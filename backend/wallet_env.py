# backend/wallet.py

from datetime import datetime
from typing import Dict, List, Optional
import uuid

class PaperWallet:
    def __init__(self, starting_balance: float = 10000.0):
        self.cash_balance = starting_balance
        self.initial_balance = starting_balance
        # Stockage des positions: { "market_id": { ...détails... } }
        self.positions: Dict[str, Dict] = {}
        self.transaction_history: List[Dict] = []
        self.start_time = datetime.utcnow()

    def buy(self, market_id: str, question: str, side: str, price: float, amount_usd: float) -> bool:
        """
        Exécute un ordre d'achat.
        Retourne True si succès, False si fonds insuffisants.
        """
        if amount_usd > self.cash_balance:
            print(f"❌ [WALLET] Fonds insuffisants: ${self.cash_balance:.2f} < ${amount_usd:.2f}")
            return False

        # 1. Débit du cash
        self.cash_balance -= amount_usd
        shares_bought = amount_usd / price

        # 2. Mise à jour ou Création de la position
        if market_id not in self.positions:
            self.positions[market_id] = {
                "marketId": market_id,
                "marketQuestion": question,
                "side": side,
                "shares": 0.0,
                "avgEntryPrice": 0.0,
                "totalCost": 0.0
            }

        pos = self.positions[market_id]
        
        # Calcul du nouveau prix moyen pondéré (Weighted Average Price)
        # Formule : (Coût total ancien + Coût nouveau) / (Parts anciennes + Parts nouvelles)
        new_total_cost = pos["totalCost"] + amount_usd
        new_total_shares = pos["shares"] + shares_bought
        
        pos["shares"] = new_total_shares
        pos["totalCost"] = new_total_cost
        pos["avgEntryPrice"] = new_total_cost / new_total_shares if new_total_shares > 0 else 0

        # 3. Log de la transaction
        self._log_transaction("BUY", market_id, question, side, price, shares_bought)
        return True

    def sell(self, market_id: str, price: float, shares_to_sell: Optional[float] = None) -> float:
        """
        Exécute un ordre de vente.
        Retourne le Profit/Perte réalisé (Realized PnL).
        """
        if market_id not in self.positions:
            return 0.0

        pos = self.positions[market_id]
        current_shares = pos["shares"]
        
        if shares_to_sell is None or shares_to_sell > current_shares:
            shares_to_sell = current_shares # Vendre tout par défaut

        # 1. Calcul des revenus
        revenue = shares_to_sell * price
        cost_basis = shares_to_sell * pos["avgEntryPrice"]
        realized_pnl = revenue - cost_basis

        # 2. Crédit du cash
        self.cash_balance += revenue

        # 3. Mise à jour de la position
        pos["shares"] -= shares_to_sell
        pos["totalCost"] -= cost_basis

        # Nettoyage si position fermée (ou poussière < 0.001 part)
        if pos["shares"] < 0.001:
            del self.positions[market_id]

        # 4. Log
        self._log_transaction("SELL", market_id, pos["marketQuestion"], pos["side"], price, shares_to_sell, realized_pnl)
        return realized_pnl

    def get_snapshot(self, current_market_prices: Dict[str, float]) -> Dict:
        """
        Génère l'objet 'PortfolioSnapshot' attendu par le Frontend.
        current_market_prices: Dict { "market_id": prix_actuel } pour calculer la valeur latente.
        """
        invested_value = 0.0
        
        # Calcul de la valeur actuelle des positions
        for m_id, pos in self.positions.items():
            # Si on a le prix live, on l'utilise, sinon on prend le prix d'achat (fallback conservateur)
            current_price = current_market_prices.get(m_id, pos["avgEntryPrice"])
            invested_value += pos["shares"] * current_price

        total_value = self.cash_balance + invested_value
        total_pnl = total_value - self.initial_balance

        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "totalValue": round(total_value, 2),
            "cashBalance": round(self.cash_balance, 2),
            "investedValue": round(invested_value, 2),
            "dailyPnL": round(total_pnl, 2), # Simplifié pour l'exemple (Total = Daily ici)
            "totalPnL": round(total_pnl, 2)
        }

    def get_positions_formatted(self, current_market_prices: Dict[str, float]) -> List[Dict]:
        """Retourne la liste des positions formatée pour le tableau de bord"""
        formatted = []
        for m_id, pos in self.positions.items():
            current_price = current_market_prices.get(m_id, pos["avgEntryPrice"])
            unrealized_pnl = (current_price - pos["avgEntryPrice"]) * pos["shares"]
            percent_change = ((current_price - pos["avgEntryPrice"]) / pos["avgEntryPrice"]) * 100 if pos["avgEntryPrice"] > 0 else 0

            formatted.append({
                "marketId": m_id,
                "marketQuestion": pos["marketQuestion"],
                "side": pos["side"],
                "shares": round(pos["shares"], 2),
                "avgEntryPrice": round(pos["avgEntryPrice"], 3),
                "currentPrice": round(current_price, 3),
                "unrealizedPnL": round(unrealized_pnl, 2),
                "percentChange": round(percent_change, 2)
            })
        return formatted

    def _log_transaction(self, action, m_id, question, side, price, qty, pnl=0):
        self.transaction_history.append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "marketId": m_id,
            "question": question,
            "action": action,
            "side": side,
            "price": price,
            "quantity": qty,
            "pnl": pnl
        })