import random
import uuid
from datetime import datetime

# Données statiques pour simuler le marché (Miroir de SIMULATED_MARKETS du TS)
MARKETS_DB = [
    {"id": "mkt_btc_100k", "question": "Will Bitcoin reach $150k by end of 2026?", "category": "crypto", "price": 0.42},
    {"id": "mkt_us_election", "question": "Will the current party win the next US election?", "category": "politics", "price": 0.55},
    {"id": "mkt_eth_merge", "question": "Will Ethereum surpass $10k in 2026?", "category": "crypto", "price": 0.31},
    {"id": "mkt_mars", "question": "Will humans land on Mars before 2030?", "category": "science", "price": 0.08},
]

def get_iso_time():
    """Format de date strict ISO 8601 pour TypeScript"""
    return datetime.utcnow().isoformat() + "Z"

def test_simulation(wallet, bot_strategy):
    """
    Génère un 'tick' de simulation : bouge le marché, fait trader le bot, et renvoie les logs.
    Retourne une liste de 'TunnelMessage' (JSON).
    """
    events = []
    
    # --- 1. MOUVEMENT DE MARCHÉ (MARKET_UPDATE) ---
    target_market = random.choice(MARKETS_DB)
    # Fluctuation légère du prix
    change = random.uniform(-0.02, 0.02)
    target_market["price"] = max(0.01, min(0.99, target_market["price"] + change))
    
    # On notifie le front que le prix a changé
    events.append({
        "type": "MARKET_UPDATE",
        "timestamp": get_iso_time(),
        "payload": {
            "id": target_market["id"],
            "question": target_market["question"],
            "category": target_market["category"],
            "currentPrice": round(target_market["price"], 2),
            "volume24h": random.randint(100000, 5000000),
            "liquidity": random.randint(1000000, 10000000),
            "endDate": "2026-12-31T00:00:00Z",
            "resolved": False
        }
    })

    # --- 2. DÉCISION DU BOT (TRADE_EXECUTED) ---
    # On demande au bot s'il veut agir sur ce marché modifié
    decision = bot_strategy.decide(target_market)
    
    if decision["action"] in ["BUY", "SELL"]:
        # Exécution dans le wallet Python
        amount_usd = 50.0 # Mise fixe pour le test
        
        if decision["action"] == "BUY":
            success = wallet.buy(target_market["id"], target_market["question"], decision["side"], target_market["price"], amount_usd)
        else:
            # Pour simplifier la simu SELL, on assume qu'on vend 50%
            success = wallet.sell(target_market["id"], target_market["price"]) > 0

        if success:
            events.append({
                "type": "TRADE_EXECUTED",
                "timestamp": get_iso_time(),
                "payload": {
                    "id": f"trade_{uuid.uuid4().hex[:8]}",
                    "timestamp": get_iso_time(),
                    "marketId": target_market["id"],
                    "marketQuestion": target_market["question"],
                    "action": decision["action"],
                    "side": decision["side"],
                    "quantity": round(amount_usd / target_market["price"], 2),
                    "price": round(target_market["price"], 2),
                    "totalCost": round(amount_usd, 2),
                    "confidence": decision["confidence"],
                    "reasoning": decision["reasoning"]
                }
            })
            
            # Petit log d'activité sympa
            events.append({
                "type": "ACTIVITY_LOG",
                "timestamp": get_iso_time(),
                "payload": {
                    "id": f"log_{uuid.uuid4().hex[:6]}",
                    "timestamp": get_iso_time(),
                    "type": "TRADE",
                    "severity": "success",
                    "message": f"{decision['action']} {decision['side']} on {target_market['category']}",
                    "details": decision["reasoning"]
                }
            })

    # --- 3. MISE À JOUR PORTEFEUILLE (PORTFOLIO_UPDATE) ---
    # Le frontend a besoin de l'état complet du wallet à chaque tick
    snapshot = wallet.get_snapshot(current_market_prices={m["id"]: m["price"] for m in MARKETS_DB})
    
    events.append({
        "type": "PORTFOLIO_UPDATE",
        "timestamp": get_iso_time(),
        "payload": snapshot
    })
    
    # --- 4. HEARTBEAT (BOT_STATUS) ---
    # Pour dire "Je suis vivant"
    events.append({
        "type": "BOT_STATUS",
        "timestamp": get_iso_time(),
        "payload": {
            "isConnected": True,
            "lastHeartbeat": get_iso_time(),
            "uptime": 120, 
            "totalTrades": len(wallet.transaction_history),
            "winRate": 64.5,
            "activePositions": len(wallet.positions),
            "mode": "LIVE_SIM", # Indique qu'on est connecté au Python
            "version": "1.0.0"
        }
    })

    return events