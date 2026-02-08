"""
============================================================
MAIN — Serveur FastAPI du bot de trading Polymarket

Endpoints :
  GET  /              → Health check
  GET  /api/tick      → Avance la simulation d'un pas, retourne les événements
  GET  /api/positions → Positions ouvertes du wallet
  GET  /api/trades    → Historique des trades (depuis la DB)
  GET  /api/activity  → Logs d'activité (depuis la DB)
  GET  /api/portfolio/history → Historique du portefeuille (depuis la DB)
  GET  /api/stats     → Stats du dashboard (calculées à partir de vraies données)
  GET  /api/decisions → Historique des décisions IA
  GET  /api/markets   → Marchés trackés (derniers prix connus)
  POST /api/chat      → Envoyer un message au bot

Lancer : uvicorn main:app --reload --host 0.0.0.0 --port 8000
============================================================
"""

import time
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import Database, get_iso_time
from wallet_env import PaperWallet
from bot_brain import BotBrain
from simulation import test_simulation, MARKETS_DB

# ==========================================================
#  INITIALISATION
# ==========================================================
app = FastAPI(title="PolyBot Trading API", version="1.0.0")

# CORS — autoriser le frontend (localhost + ngrok + vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de données persistante
db = Database()

# Wallet papier — restaurer le solde depuis la DB si disponible
initial_balance = float(db.get_config("initial_balance", "10000.0"))
last_snap = db.get_latest_snapshot()
if last_snap:
    # Reprendre le cash balance du dernier snapshot
    my_wallet = PaperWallet(starting_balance=last_snap["cashBalance"])
    my_wallet.initial_balance = initial_balance
else:
    my_wallet = PaperWallet(starting_balance=initial_balance)

# Cerveau du bot
my_bot = BotBrain(name="PolyBot V1")

# Timer de démarrage (pour l'uptime)
START_TIME = time.time()

# Log de démarrage dans la DB
db.insert_activity_log({
    "type": "SYSTEM",
    "severity": "info",
    "message": "Backend Python démarré",
    "details": f"Capital initial: ${initial_balance:.2f} | Mode: {db.get_config('mode', 'PAPER')}",
})


# ==========================================================
#  MODÈLES PYDANTIC
# ==========================================================
class ChatRequest(BaseModel):
    message: str


# ==========================================================
#  ENDPOINTS
# ==========================================================

@app.get("/")
def health_check():
    """Health check — vérifie que le serveur tourne."""
    return {
        "status": "running",
        "uptime": round(time.time() - START_TIME, 1),
        "bot": db.get_config("bot_name", "PolyBot"),
        "mode": db.get_config("mode", "PAPER"),
    }


@app.get("/api/tick")
def get_tick():
    """
    Le frontend appelle cette URL toutes les 1.5s.
    Le backend avance la simulation d'un pas et retourne les événements.
    Chaque événement est AUSSI persisté dans la base de données.
    """
    # 1. Lancer un tick de simulation
    events = test_simulation(my_wallet, my_bot, db)

    # 2. Calculer les stats réelles depuis la DB
    current_prices = {m["id"]: m["price"] for m in MARKETS_DB}
    wallet_snap = my_wallet.get_snapshot(current_prices)
    wallet_snap["activePositions"] = len(my_wallet.positions)
    stats = db.compute_dashboard_stats(wallet_snap)

    # 3. Positions formatées (valeurs réelles du wallet)
    positions = my_wallet.get_positions_formatted(current_prices)

    # 4. Marchés trackés (derniers prix depuis la DB)
    markets = db.get_tracked_markets()

    return {
        "events": events,
        "stats": stats,
        "positions": positions,
        "markets": markets,
    }


@app.get("/api/positions")
def get_positions():
    """Retourne les positions ouvertes du wallet (valeurs réelles)."""
    current_prices = {m["id"]: m["price"] for m in MARKETS_DB}
    return my_wallet.get_positions_formatted(current_prices)


@app.get("/api/trades")
def get_trades(limit: int = 100):
    """Retourne l'historique des trades depuis la base de données."""
    return db.get_trades(limit)


@app.get("/api/activity")
def get_activity(limit: int = 200):
    """Retourne les logs d'activité depuis la base de données."""
    return db.get_activity_logs(limit)


@app.get("/api/portfolio/history")
def get_portfolio_history(days: int = 90):
    """Retourne l'historique du portefeuille pour les charts."""
    return db.get_portfolio_history(days)


@app.get("/api/stats")
def get_stats():
    """Retourne les stats du dashboard calculées à partir de données réelles."""
    current_prices = {m["id"]: m["price"] for m in MARKETS_DB}
    wallet_snap = my_wallet.get_snapshot(current_prices)
    wallet_snap["activePositions"] = len(my_wallet.positions)
    return db.compute_dashboard_stats(wallet_snap)


@app.get("/api/decisions")
def get_decisions(limit: int = 100):
    """Retourne l'historique de toutes les décisions de l'IA."""
    return db.get_decisions(limit)


@app.get("/api/decisions/stats")
def get_decision_stats():
    """Retourne les statistiques sur les décisions (BUY/SELL/HOLD comptages)."""
    return db.get_decision_stats()


@app.get("/api/markets")
def get_markets():
    """Retourne les marchés trackés avec leurs derniers prix connus."""
    return db.get_tracked_markets()


@app.get("/api/chat/history")
def get_chat_history(limit: int = 100):
    """Retourne l'historique des messages de chat."""
    return db.get_chat_history(limit)


@app.post("/api/chat")
def send_chat_message(req: ChatRequest):
    """
    Reçoit un message de l'utilisateur, le persiste,
    génère une réponse du bot, la persiste, et la retourne.
    """
    now = get_iso_time()

    # 1. Persister le message utilisateur
    user_msg = {
        "id": f"user_{uuid.uuid4().hex[:8]}",
        "timestamp": now,
        "sender": "USER",
        "content": req.message,
    }
    db.insert_chat_message(user_msg)

    # 2. Générer la réponse du bot (basée sur les données réelles)
    response_content = _generate_bot_response(req.message)

    # 3. Persister la réponse du bot
    bot_msg = {
        "id": f"bot_{uuid.uuid4().hex[:8]}",
        "timestamp": get_iso_time(),
        "sender": "BOT",
        "content": response_content,
    }
    db.insert_chat_message(bot_msg)

    # 4. Log de l'interaction
    db.insert_activity_log({
        "type": "SYSTEM",
        "severity": "info",
        "message": f"Chat: \"{req.message[:50]}...\"",
        "details": f"Réponse générée ({len(response_content)} chars)",
    })

    return bot_msg


@app.get("/api/config")
def get_config():
    """Retourne la configuration persistante du bot."""
    return {
        "initial_balance": float(db.get_config("initial_balance", "10000.0")),
        "mode": db.get_config("mode", "PAPER"),
        "version": db.get_config("version", "1.0.0"),
        "bot_name": db.get_config("bot_name", "PolyBot"),
        "risk_tolerance": float(db.get_config("risk_tolerance", "0.3")),
        "start_time": db.get_config("start_time"),
    }


# ==========================================================
#  HELPERS (Réponse du bot basée sur données réelles)
# ==========================================================
def _generate_bot_response(user_message: str) -> str:
    """
    Génère une réponse contextuelle basée sur les vraies données de la DB.
    """
    msg = user_message.lower()
    current_prices = {m["id"]: m["price"] for m in MARKETS_DB}
    snapshot = my_wallet.get_snapshot(current_prices)

    if any(w in msg for w in ["portfolio", "portefeuille", "performance", "how", "comment"]):
        total = snapshot["totalValue"]
        pnl = snapshot["totalPnL"]
        cash = snapshot["cashBalance"]
        trades = db.get_trade_count()
        win_rate = db.get_win_rate()
        return (
            f"📊 État actuel du portefeuille :\n"
            f"• Valeur totale : ${total:,.2f}\n"
            f"• P&L total : ${pnl:+,.2f}\n"
            f"• Cash disponible : ${cash:,.2f}\n"
            f"• Trades exécutés : {trades}\n"
            f"• Win rate : {win_rate}%\n"
            f"Toutes ces valeurs sont calculées en temps réel."
        )

    if any(w in msg for w in ["strategy", "stratégie", "approach", "approche"]):
        dec_stats = db.get_decision_stats()
        return (
            f"🎯 Stratégie actuelle :\n"
            f"• Mode : {db.get_config('mode', 'PAPER')}\n"
            f"• Risk tolerance : {db.get_config('risk_tolerance', '0.3')}\n"
            f"• Décisions totales : {dec_stats['total_decisions']}\n"
            f"  - BUY : {dec_stats['buys']} | SELL : {dec_stats['sells']} | HOLD : {dec_stats['holds']}\n"
            f"  - Exécutées : {dec_stats['executed']}\n"
            f"J'analyse chaque marché Polymarket et décide en fonction du score de confiance."
        )

    if any(w in msg for w in ["market", "marché", "price", "prix", "bullish"]):
        markets = db.get_tracked_markets()
        if markets:
            lines = [f"📈 Marchés trackés ({len(markets)}) :"]
            for m in markets[:5]:
                lines.append(f"• {m['question'][:50]}... → {m['currentPrice']*100:.0f}¢")
            return "\n".join(lines)
        return "Aucun marché tracké pour le moment. Les données arrivent au prochain tick."

    if any(w in msg for w in ["risk", "risque", "drawdown", "perte"]):
        stats = db.compute_dashboard_stats({**snapshot, "activePositions": len(my_wallet.positions)})
        return (
            f"🛡️ Gestion du risque :\n"
            f"• Max drawdown : {stats['maxDrawdown']:.1f}%\n"
            f"• Positions actives : {len(my_wallet.positions)}\n"
            f"• Capital à risque : ${snapshot['investedValue']:,.2f}\n"
            f"• Cash de réserve : ${snapshot['cashBalance']:,.2f}\n"
            f"Le bot maintient un ratio risque/capital conservateur."
        )

    if any(w in msg for w in ["position", "open", "ouvert"]):
        positions = my_wallet.get_positions_formatted(current_prices)
        if not positions:
            return "Aucune position ouverte pour le moment."
        lines = [f"📋 Positions ouvertes ({len(positions)}) :"]
        for p in positions:
            lines.append(
                f"• {p['marketQuestion'][:40]}... | {p['side']} | "
                f"{p['shares']:.1f} parts @ {p['avgEntryPrice']:.3f} | "
                f"P&L: ${p['unrealizedPnL']:+.2f}"
            )
        return "\n".join(lines)

    return (
        "Je suis PolyBot, votre assistant de trading Polymarket. "
        "Vous pouvez me demander :\n"
        "• Mon portefeuille / performance\n"
        "• Ma stratégie de trading\n"
        "• Les marchés que je surveille\n"
        "• Ma gestion du risque\n"
        "• Mes positions ouvertes\n"
        "Toutes les données affichées sont réelles et proviennent de la base de données."
    )
