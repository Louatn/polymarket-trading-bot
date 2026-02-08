"""
============================================================
SIMULATION — Moteur de simulation du marché + décisions du bot

Chaque appel à test_simulation() :
  1. Fait bouger un marché aléatoirement (MARKET_UPDATE)
  2. Demande au bot s'il veut agir (BOT_DECISION → persisté)
  3. Exécute le trade si applicable (TRADE_EXECUTED → persisté)
  4. Prend un snapshot du portefeuille (PORTFOLIO_UPDATE → persisté)
  5. Envoie un heartbeat (BOT_STATUS)

Tout est persisté dans la base SQLite via l'objet `db`.
============================================================
"""

import random
import uuid
import time
from datetime import datetime

# Données des marchés — simulées localement
# (En production, remplacer par des données live de Polymarket via data_collector.py)
MARKETS_DB = [
    {"id": "mkt_btc_150k", "question": "Will Bitcoin reach $150k by end of 2026?", "category": "crypto", "price": 0.42},
    {"id": "mkt_us_election", "question": "Will the current party win the next US election?", "category": "politics", "price": 0.55},
    {"id": "mkt_eth_10k", "question": "Will Ethereum surpass $10k in 2026?", "category": "crypto", "price": 0.31},
    {"id": "mkt_mars", "question": "Will humans land on Mars before 2030?", "category": "science", "price": 0.08},
    {"id": "mkt_fed_rate", "question": "Will FED rate drop below 2% in 2026?", "category": "politics", "price": 0.38},
    {"id": "mkt_gpt6", "question": "Will GPT-6 be released before 2027?", "category": "science", "price": 0.65},
]

# Timer global pour l'uptime
_START_TIME = time.time()


def get_iso_time():
    """Format ISO 8601 strict pour TypeScript."""
    return datetime.utcnow().isoformat() + "Z"


def test_simulation(wallet, bot_strategy, db):
    """
    Génère un 'tick' de simulation.
    Tous les événements sont persistés dans la base de données.
    
    Args:
        wallet: PaperWallet instance
        bot_strategy: BotBrain instance
        db: Database instance
    
    Returns:
        Liste de TunnelMessage (dict) pour le frontend
    """
    events = []

    # === 1. MOUVEMENT DE MARCHÉ (MARKET_UPDATE) ===
    target_market = random.choice(MARKETS_DB)
    
    # Fluctuation réaliste du prix
    change = random.uniform(-0.02, 0.02)
    target_market["price"] = max(0.01, min(0.99, target_market["price"] + change))

    market_payload = {
        "id": target_market["id"],
        "question": target_market["question"],
        "category": target_market["category"],
        "currentPrice": round(target_market["price"], 4),
        "volume24h": random.randint(100000, 5000000),
        "liquidity": random.randint(1000000, 10000000),
        "endDate": "2026-12-31T00:00:00Z",
        "resolved": False,
    }

    events.append({
        "type": "MARKET_UPDATE",
        "timestamp": get_iso_time(),
        "payload": market_payload,
    })

    # Persister le snapshot de prix du marché
    db.insert_market_snapshot({
        "market_id": target_market["id"],
        "question": target_market["question"],
        "category": target_market["category"],
        "price": target_market["price"],
        "volume_24h": market_payload["volume24h"],
        "liquidity": market_payload["liquidity"],
    })

    # === 2. DÉCISION DU BOT (BOT_DECISION) ===
    decision = bot_strategy.decide(target_market)

    # Persister CHAQUE décision (y compris HOLD) dans la DB
    decision_record = {
        "market_id": target_market["id"],
        "market_question": target_market["question"],
        "action": decision["action"],
        "side": decision.get("side"),
        "confidence": decision["confidence"],
        "reasoning": decision["reasoning"],
        "was_executed": 0,
        "execution_result": None,
    }

    if decision["action"] in ["BUY", "SELL"]:
        amount_usd = 50.0  # Mise fixe pour la simulation

        if decision["action"] == "BUY":
            success = wallet.buy(
                target_market["id"],
                target_market["question"],
                decision["side"],
                target_market["price"],
                amount_usd,
            )
            execution_result = "success" if success else "insufficient_funds"
        else:
            pnl = wallet.sell(target_market["id"], target_market["price"])
            success = pnl != 0
            execution_result = "success" if success else "no_position"

        decision_record["was_executed"] = 1 if success else 0
        decision_record["execution_result"] = execution_result

        if success:
            quantity = round(amount_usd / target_market["price"], 2) if decision["action"] == "BUY" else 0
            
            trade_data = {
                "id": f"trade_{uuid.uuid4().hex[:8]}",
                "timestamp": get_iso_time(),
                "market_id": target_market["id"],
                "market_question": target_market["question"],
                "action": decision["action"],
                "side": decision["side"],
                "quantity": quantity,
                "price": round(target_market["price"], 4),
                "total_cost": round(amount_usd, 2),
                "confidence": decision["confidence"],
                "reasoning": decision["reasoning"],
                "profit_loss": pnl if decision["action"] == "SELL" else None,
            }

            # Persister le trade dans la DB
            db.insert_trade(trade_data)

            # Événement pour le frontend
            events.append({
                "type": "TRADE_EXECUTED",
                "timestamp": get_iso_time(),
                "payload": {
                    "id": trade_data["id"],
                    "timestamp": trade_data["timestamp"],
                    "marketId": trade_data["market_id"],
                    "marketQuestion": trade_data["market_question"],
                    "action": trade_data["action"],
                    "side": trade_data["side"],
                    "quantity": trade_data["quantity"],
                    "price": trade_data["price"],
                    "totalCost": trade_data["total_cost"],
                    "confidence": trade_data["confidence"],
                    "reasoning": trade_data["reasoning"],
                    "profitLoss": trade_data["profit_loss"],
                },
            })

            # Log d'activité (persisté)
            log_data = {
                "type": "TRADE",
                "severity": "success",
                "message": f"{decision['action']} {decision['side']} on \"{target_market['question'][:40]}...\"",
                "details": decision["reasoning"],
            }
            db.insert_activity_log(log_data)
            events.append({
                "type": "ACTIVITY_LOG",
                "timestamp": get_iso_time(),
                "payload": {
                    "id": log_data.get("id", f"log_{uuid.uuid4().hex[:6]}"),
                    "timestamp": get_iso_time(),
                    "type": log_data["type"],
                    "severity": log_data["severity"],
                    "message": log_data["message"],
                    "details": log_data["details"],
                },
            })

    # Persister la décision
    db.insert_decision(decision_record)

    # === 3. SNAPSHOT DU PORTEFEUILLE (PORTFOLIO_UPDATE) ===
    current_prices = {m["id"]: m["price"] for m in MARKETS_DB}
    snapshot = wallet.get_snapshot(current_prices)

    # Persister le snapshot dans la DB
    db.insert_portfolio_snapshot(snapshot)

    events.append({
        "type": "PORTFOLIO_UPDATE",
        "timestamp": get_iso_time(),
        "payload": snapshot,
    })

    # === 4. HEARTBEAT (BOT_STATUS) ===
    events.append({
        "type": "BOT_STATUS",
        "timestamp": get_iso_time(),
        "payload": {
            "isConnected": True,
            "lastHeartbeat": get_iso_time(),
            "uptime": round(time.time() - _START_TIME),
            "totalTrades": db.get_trade_count(),
            "winRate": db.get_win_rate(),
            "activePositions": len(wallet.positions),
            "mode": db.get_config("mode", "PAPER"),
            "version": db.get_config("version", "1.0.0"),
        },
    })

    return events