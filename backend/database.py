"""
============================================================
DATABASE — Stockage persistant SQLite pour le bot de trading

Tables :
  - trades          : Historique complet de chaque trade exécuté
  - portfolio_snapshots : Photo du portefeuille à chaque tick (pour les charts)
  - activity_logs   : Tous les logs système / alertes / analyses
  - bot_decisions   : Chaque décision prise par l'IA (BUY/SELL/HOLD) avec le raisonnement
  - market_snapshots: Prix des marchés à chaque relevé (historique de prix)
  - chat_messages   : Historique complet des conversations avec le bot
  - bot_config      : Configuration persistante du bot (capital initial, mode, etc.)

Usage :
  from database import Database
  db = Database()             # Crée/ouvre polybot.db
  db.insert_trade(...)
  trades = db.get_trades()
============================================================
"""

import sqlite3
import uuid
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


DB_PATH = os.path.join(os.path.dirname(__file__), "polybot.db")


def get_iso_time():
    """Format ISO 8601 strict pour compatibilité TypeScript."""
    return datetime.utcnow().isoformat() + "Z"


class Database:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Permet d'accéder aux colonnes par nom
        self.conn.execute("PRAGMA journal_mode=WAL")  # Performance en écriture
        self._create_tables()

    # ==========================================================
    #  CRÉATION DES TABLES
    # ==========================================================
    def _create_tables(self):
        cursor = self.conn.cursor()

        # --- TRADES : Chaque trade exécuté par le bot ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                market_id TEXT NOT NULL,
                market_question TEXT NOT NULL,
                action TEXT NOT NULL,           -- BUY / SELL
                side TEXT NOT NULL,              -- YES / NO
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                total_cost REAL NOT NULL,
                confidence INTEGER NOT NULL,     -- 0-100
                reasoning TEXT NOT NULL,
                profit_loss REAL,                -- NULL si pas encore réalisé
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # --- PORTFOLIO SNAPSHOTS : État du portefeuille à chaque tick ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                total_value REAL NOT NULL,
                cash_balance REAL NOT NULL,
                invested_value REAL NOT NULL,
                daily_pnl REAL NOT NULL,
                total_pnl REAL NOT NULL
            )
        """)

        # --- ACTIVITY LOGS : Logs système, alertes, analyses ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                type TEXT NOT NULL,              -- TRADE / ALERT / SYSTEM / ANALYSIS
                severity TEXT NOT NULL,           -- info / warning / success / error
                message TEXT NOT NULL,
                details TEXT
            )
        """)

        # --- BOT DECISIONS : Chaque décision de l'IA (y compris HOLD) ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bot_decisions (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                market_id TEXT NOT NULL,
                market_question TEXT NOT NULL,
                action TEXT NOT NULL,            -- BUY / SELL / HOLD
                side TEXT,                       -- YES / NO (NULL si HOLD)
                confidence INTEGER NOT NULL,
                reasoning TEXT NOT NULL,
                was_executed INTEGER NOT NULL DEFAULT 0,  -- 1 si le trade a été passé
                execution_result TEXT             -- 'success' / 'insufficient_funds' / etc.
            )
        """)

        # --- MARKET SNAPSHOTS : Historique des prix de marché ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS market_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                market_id TEXT NOT NULL,
                question TEXT NOT NULL,
                category TEXT,
                price REAL NOT NULL,
                volume_24h REAL,
                liquidity REAL
            )
        """)

        # --- CHAT MESSAGES : Historique des conversations ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                sender TEXT NOT NULL,            -- USER / BOT
                content TEXT NOT NULL
            )
        """)

        # --- BOT CONFIG : Configuration persistante ---
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bot_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)

        self.conn.commit()

        # Initialiser la config par défaut si elle n'existe pas
        self._init_default_config()

    def _init_default_config(self):
        """Insère les valeurs par défaut de configuration si absentes."""
        defaults = {
            "initial_balance": "10000.0",
            "mode": "PAPER",
            "version": "1.0.0",
            "bot_name": "PolyBot",
            "risk_tolerance": "0.3",
            "start_time": get_iso_time(),
        }
        for key, value in defaults.items():
            self.conn.execute(
                "INSERT OR IGNORE INTO bot_config (key, value) VALUES (?, ?)",
                (key, value)
            )
        self.conn.commit()

    # ==========================================================
    #  CONFIG
    # ==========================================================
    def get_config(self, key: str, default: str = "") -> str:
        row = self.conn.execute(
            "SELECT value FROM bot_config WHERE key = ?", (key,)
        ).fetchone()
        return row["value"] if row else default

    def set_config(self, key: str, value: str):
        self.conn.execute(
            "INSERT OR REPLACE INTO bot_config (key, value, updated_at) VALUES (?, ?, ?)",
            (key, value, get_iso_time())
        )
        self.conn.commit()

    # ==========================================================
    #  TRADES
    # ==========================================================
    def insert_trade(self, trade: Dict[str, Any]) -> str:
        """Insère un trade et retourne son ID."""
        trade_id = trade.get("id", f"trade_{uuid.uuid4().hex[:8]}")
        self.conn.execute("""
            INSERT INTO trades (id, timestamp, market_id, market_question, action, side,
                               quantity, price, total_cost, confidence, reasoning, profit_loss)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            trade_id,
            trade.get("timestamp", get_iso_time()),
            trade["market_id"],
            trade["market_question"],
            trade["action"],
            trade["side"],
            trade["quantity"],
            trade["price"],
            trade["total_cost"],
            trade["confidence"],
            trade["reasoning"],
            trade.get("profit_loss"),
        ))
        self.conn.commit()
        return trade_id

    def get_trades(self, limit: int = 100) -> List[Dict]:
        """Retourne les derniers trades formatés pour le frontend."""
        rows = self.conn.execute(
            "SELECT * FROM trades ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "marketId": r["market_id"],
                "marketQuestion": r["market_question"],
                "action": r["action"],
                "side": r["side"],
                "quantity": r["quantity"],
                "price": r["price"],
                "totalCost": r["total_cost"],
                "confidence": r["confidence"],
                "reasoning": r["reasoning"],
                "profitLoss": r["profit_loss"],
            }
            for r in rows
        ]

    def get_trade_count(self) -> int:
        row = self.conn.execute("SELECT COUNT(*) as c FROM trades").fetchone()
        return row["c"]

    def get_win_rate(self) -> float:
        """Calcule le win rate réel à partir des trades avec P&L."""
        rows = self.conn.execute(
            "SELECT profit_loss FROM trades WHERE profit_loss IS NOT NULL"
        ).fetchall()
        if not rows:
            return 0.0
        wins = sum(1 for r in rows if r["profit_loss"] > 0)
        return round((wins / len(rows)) * 100, 1) if rows else 0.0

    # ==========================================================
    #  PORTFOLIO SNAPSHOTS
    # ==========================================================
    def insert_portfolio_snapshot(self, snap: Dict[str, Any]):
        """Insère un snapshot du portefeuille."""
        self.conn.execute("""
            INSERT INTO portfolio_snapshots (timestamp, total_value, cash_balance,
                                            invested_value, daily_pnl, total_pnl)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            snap.get("timestamp", get_iso_time()),
            snap["totalValue"],
            snap["cashBalance"],
            snap["investedValue"],
            snap["dailyPnL"],
            snap["totalPnL"],
        ))
        self.conn.commit()

    def get_portfolio_history(self, days: int = 90) -> List[Dict]:
        """Retourne l'historique du portefeuille pour les charts."""
        since = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"
        rows = self.conn.execute(
            "SELECT * FROM portfolio_snapshots WHERE timestamp >= ? ORDER BY timestamp ASC",
            (since,)
        ).fetchall()
        return [
            {
                "timestamp": r["timestamp"],
                "totalValue": r["total_value"],
                "cashBalance": r["cash_balance"],
                "investedValue": r["invested_value"],
                "dailyPnL": r["daily_pnl"],
                "totalPnL": r["total_pnl"],
            }
            for r in rows
        ]

    def get_latest_snapshot(self) -> Optional[Dict]:
        """Retourne le dernier snapshot ou None."""
        row = self.conn.execute(
            "SELECT * FROM portfolio_snapshots ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()
        if not row:
            return None
        return {
            "timestamp": row["timestamp"],
            "totalValue": row["total_value"],
            "cashBalance": row["cash_balance"],
            "investedValue": row["invested_value"],
            "dailyPnL": row["daily_pnl"],
            "totalPnL": row["total_pnl"],
        }

    # ==========================================================
    #  ACTIVITY LOGS
    # ==========================================================
    def insert_activity_log(self, log: Dict[str, Any]) -> str:
        log_id = log.get("id", f"log_{uuid.uuid4().hex[:6]}")
        self.conn.execute("""
            INSERT INTO activity_logs (id, timestamp, type, severity, message, details)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            log_id,
            log.get("timestamp", get_iso_time()),
            log["type"],
            log["severity"],
            log["message"],
            log.get("details"),
        ))
        self.conn.commit()
        return log_id

    def get_activity_logs(self, limit: int = 200) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "type": r["type"],
                "severity": r["severity"],
                "message": r["message"],
                "details": r["details"],
            }
            for r in rows
        ]

    # ==========================================================
    #  BOT DECISIONS (toutes les décisions, y compris HOLD)
    # ==========================================================
    def insert_decision(self, decision: Dict[str, Any]) -> str:
        dec_id = decision.get("id", f"dec_{uuid.uuid4().hex[:8]}")
        self.conn.execute("""
            INSERT INTO bot_decisions (id, timestamp, market_id, market_question,
                                      action, side, confidence, reasoning,
                                      was_executed, execution_result)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dec_id,
            decision.get("timestamp", get_iso_time()),
            decision["market_id"],
            decision["market_question"],
            decision["action"],
            decision.get("side"),
            decision["confidence"],
            decision["reasoning"],
            decision.get("was_executed", 0),
            decision.get("execution_result"),
        ))
        self.conn.commit()
        return dec_id

    def get_decisions(self, limit: int = 100) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM bot_decisions ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]

    def get_decision_stats(self) -> Dict:
        """Statistiques sur les décisions pour le dashboard."""
        total = self.conn.execute("SELECT COUNT(*) as c FROM bot_decisions").fetchone()["c"]
        buys = self.conn.execute("SELECT COUNT(*) as c FROM bot_decisions WHERE action='BUY'").fetchone()["c"]
        sells = self.conn.execute("SELECT COUNT(*) as c FROM bot_decisions WHERE action='SELL'").fetchone()["c"]
        holds = self.conn.execute("SELECT COUNT(*) as c FROM bot_decisions WHERE action='HOLD'").fetchone()["c"]
        executed = self.conn.execute("SELECT COUNT(*) as c FROM bot_decisions WHERE was_executed=1").fetchone()["c"]
        return {
            "total_decisions": total,
            "buys": buys,
            "sells": sells,
            "holds": holds,
            "executed": executed,
        }

    # ==========================================================
    #  MARKET SNAPSHOTS (historique des prix)
    # ==========================================================
    def insert_market_snapshot(self, snap: Dict[str, Any]):
        self.conn.execute("""
            INSERT INTO market_snapshots (timestamp, market_id, question, category,
                                         price, volume_24h, liquidity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            snap.get("timestamp", get_iso_time()),
            snap["market_id"],
            snap["question"],
            snap.get("category"),
            snap["price"],
            snap.get("volume_24h"),
            snap.get("liquidity"),
        ))
        self.conn.commit()

    def get_market_history(self, market_id: str, limit: int = 100) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM market_snapshots WHERE market_id=? ORDER BY timestamp DESC LIMIT ?",
            (market_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]

    def get_tracked_markets(self) -> List[Dict]:
        """Retourne les derniers prix connus pour chaque marché tracké."""
        rows = self.conn.execute("""
            SELECT ms.* FROM market_snapshots ms
            INNER JOIN (
                SELECT market_id, MAX(timestamp) as max_ts
                FROM market_snapshots
                GROUP BY market_id
            ) latest ON ms.market_id = latest.market_id AND ms.timestamp = latest.max_ts
        """).fetchall()
        return [
            {
                "id": r["market_id"],
                "question": r["question"],
                "category": r["category"],
                "currentPrice": r["price"],
                "volume24h": r["volume_24h"] or 0,
                "liquidity": r["liquidity"] or 0,
                "endDate": "",
                "resolved": False,
            }
            for r in rows
        ]

    # ==========================================================
    #  CHAT MESSAGES
    # ==========================================================
    def insert_chat_message(self, msg: Dict[str, Any]) -> str:
        msg_id = msg.get("id", f"msg_{uuid.uuid4().hex[:8]}")
        self.conn.execute("""
            INSERT INTO chat_messages (id, timestamp, sender, content)
            VALUES (?, ?, ?, ?)
        """, (
            msg_id,
            msg.get("timestamp", get_iso_time()),
            msg["sender"],
            msg["content"],
        ))
        self.conn.commit()
        return msg_id

    def get_chat_history(self, limit: int = 100) -> List[Dict]:
        rows = self.conn.execute(
            "SELECT * FROM chat_messages ORDER BY timestamp ASC LIMIT ?", (limit,)
        ).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "sender": r["sender"],
                "content": r["content"],
            }
            for r in rows
        ]

    # ==========================================================
    #  STATS CALCULÉES (Dashboard)
    # ==========================================================
    def compute_dashboard_stats(self, wallet_snapshot: Dict) -> Dict:
        """
        Calcule les stats du dashboard à partir de données RÉELLES.
        wallet_snapshot : le snapshot actuel du wallet (totalValue, cashBalance, etc.)
        """
        initial_balance = float(self.get_config("initial_balance", "10000.0"))
        total_value = wallet_snapshot.get("totalValue", 0)
        total_pnl = total_value - initial_balance
        total_pnl_percent = (total_pnl / initial_balance * 100) if initial_balance > 0 else 0

        # Calcul du daily P&L réel (comparer avec le snapshot d'il y a ~24h)
        yesterday = (datetime.utcnow() - timedelta(hours=24)).isoformat() + "Z"
        yesterday_snap = self.conn.execute(
            "SELECT total_value FROM portfolio_snapshots WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1",
            (yesterday,)
        ).fetchone()
        yesterday_value = yesterday_snap["total_value"] if yesterday_snap else initial_balance
        daily_change = total_value - yesterday_value
        daily_change_percent = (daily_change / yesterday_value * 100) if yesterday_value > 0 else 0

        # Max drawdown réel
        all_values = self.conn.execute(
            "SELECT total_value FROM portfolio_snapshots ORDER BY timestamp ASC"
        ).fetchall()
        max_drawdown = 0.0
        peak = initial_balance
        for row in all_values:
            v = row["total_value"]
            if v > peak:
                peak = v
            dd = ((peak - v) / peak * 100) if peak > 0 else 0
            if dd > max_drawdown:
                max_drawdown = dd

        return {
            "portfolioValue": round(total_value, 2),
            "dailyChange": round(daily_change, 2),
            "dailyChangePercent": round(daily_change_percent, 2),
            "totalPnL": round(total_pnl, 2),
            "totalPnLPercent": round(total_pnl_percent, 2),
            "totalTrades": self.get_trade_count(),
            "winRate": self.get_win_rate(),
            "activePositions": wallet_snapshot.get("activePositions", 0),
            "sharpeRatio": 0.0,  # Calculable si assez de données historiques
            "maxDrawdown": round(max_drawdown, 2),
        }

    # ==========================================================
    #  FERMETURE
    # ==========================================================
    def close(self):
        self.conn.close()
