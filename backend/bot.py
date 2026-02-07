from google import genai
import ollama
import json
import random
import uuid
from datetime import datetime
from typing import List, Dict, Any

apikey = "AIzaSyDi_k7pgc04BDwlIKxF-7WKwXFBhehUgzw"

client = genai.Client(api_key=apikey)

# --- MESSAGES TYPES POUR L'IA (RAISONNEMENT) ---
BUY_REASONS = [
    "Analyse de sentiment positive sur Twitter/X.",
    "Détection d'un pic de volume inhabituel.",
    "Le modèle de probabilité indique une sous-évaluation de 15%.",
    "News majeure détectée par le module NLP.",
    "Convergence des indicateurs techniques (RSI + MACD)."
]

SELL_REASONS = [
    "Prise de profit automatique (Target atteinte).",
    "La tendance s'inverse, fermeture défensive.",
    "Le risque de volatilité dépasse le seuil autorisé.",
    "Nouvelle information contradictoire détectée.",
    "Rééquilibrage du portefeuille."
]

class BotStrategy:
    def __init__(self, name: str, risk_tolerance: float, preferred_categories: List[str]):
        self.id = str(uuid.uuid4())
        self.name = name
        # risk_tolerance: 0.1 (Prudent) à 1.0 (Degen/Agressif)
        self.risk_tolerance = risk_tolerance 
        self.preferred_categories = preferred_categories
        self.win_rate = 0.5 + (random.random() * 0.3) # Simule un winrate entre 50% et 80%

    def analyze_market(self, market: Dict) -> Dict:
        """
        Simule une réflexion de l'IA sur un marché donné.
        Retourne une décision (BUY, SELL, HOLD).
        """
        category = market.get("category", "other")
        
        # 1. Score de base aléatoire (simulation de l'analyse)
        score = random.random()
        
        # 2. Bonus si c'est une catégorie préférée
        if category in self.preferred_categories:
            score += 0.15

        # 3. Facteur de risque
        # Un bot prudent (risk 0.1) a besoin d'un score très haut pour acheter
        threshold_buy = 0.8 - (self.risk_tolerance * 0.2) 
        threshold_sell = 0.3

        decision = "HOLD"
        confidence = int(score * 100)
        reasoning = "Marché en observation. Pas de signal clair."

        if score > threshold_buy:
            decision = "BUY"
            reasoning = random.choice(BUY_REASONS)
        elif score < threshold_sell:
            decision = "SELL"
            reasoning = random.choice(SELL_REASONS)

        return {
            "action": decision,
            "confidence": confidence,
            "reasoning": reasoning,
            "side": "YES" if random.random() > 0.4 else "NO" # Biais haussier léger
        }


# --- MARCHÉS FICTIFS (Pour la simulation) ---
SIMULATED_MARKETS = [
    {"id": "m1", "question": "Bitcoin > $150k en 2026?", "category": "crypto", "price": 0.42},
    {"id": "m2", "question": "Trump gagne en 2028?", "category": "politics", "price": 0.55},
    {"id": "m3", "question": "GPT-6 sort avant 2027?", "category": "science", "price": 0.30},
    {"id": "m4", "question": "Mbappé Ballon d'Or 2026?", "category": "sports", "price": 0.15},
    {"id": "m5", "question": "Taux FED < 2% en 2026?", "category": "politics", "price": 0.38},
]

def get_iso_time():
    """Format ISO 8601 strict pour TypeScript (ex: 2026-02-07T14:30:00.000Z)"""
    return datetime.utcnow().isoformat() + "Z"

def test_simulation(wallet, bot: BotStrategy):
    """
    Génère une séquence d'événements simulés (Market updates, Trades, Logs).
    À appeler dans une boucle ou via un endpoint API.
    """
    
    events = [] # On va stocker les événements générés lors de ce "tick"

    # --- 1. SIMULATION DU MARCHÉ (MARKET UPDATE) ---
    # On fait bouger un marché au hasard
    market = random.choice(SIMULATED_MARKETS)
    fluctuation = random.uniform(-0.05, 0.05)
    market["price"] = max(0.01, min(0.99, market["price"] + fluctuation))
    
    events.append({
        "type": "MARKET_UPDATE",
        "timestamp": get_iso_time(),
        "payload": {
            "id": market["id"],
            "question": market["question"],
            "category": market["category"],
            "currentPrice": round(market["price"], 2),
            "volume24h": random.randint(10000, 500000),
            "liquidity": random.randint(50000, 2000000),
            "endDate": "2026-12-31T00:00:00Z",
            "resolved": False
        }
    })

    # --- 2. DÉCISION DU BOT (TRADE) ---
    # Le bot analyse le marché qui vient de bouger
    analysis = bot.analyze_market(market)
    
    if analysis["action"] == "BUY":
        # Calcul de la mise (Kelly Criterion simplifié ou % du wallet)
        # Un bot agressif mise plus (ex: 10% du wallet), un prudent 1%
        stake_percent = 0.01 + (bot.risk_tolerance * 0.05) 
        amount_usd = wallet.usd_balance * stake_percent
        amount_usd = max(10, min(amount_usd, 500)) # Bornes de sécurité
        
        # Exécution sur le faux wallet
        success = wallet.buy(
            market_id=market["id"],
            market_title=market["question"],
            outcome=analysis["side"],
            price=market["price"],
            amount_usd=amount_usd
        )

        if success:
            quantity = amount_usd / market["price"]
            events.append({
                "type": "TRADE_EXECUTED",
                "timestamp": get_iso_time(),
                "payload": {
                    "id": f"trade_{uuid.uuid4().hex[:8]}",
                    "marketId": market["id"],
                    "marketQuestion": market["question"],
                    "action": "BUY",
                    "side": analysis["side"],
                    "quantity": round(quantity, 2),
                    "price": round(market["price"], 2),
                    "totalCost": round(amount_usd, 2),
                    "confidence": analysis["confidence"],
                    "reasoning": analysis["reasoning"]
                }
            })
            
            # Log système associé
            events.append({
                "type": "ACTIVITY_LOG",
                "timestamp": get_iso_time(),
                "payload": {
                    "id": f"log_{uuid.uuid4().hex[:6]}",
                    "type": "TRADE",
                    "severity": "success",
                    "message": f"Ordre exécuté : {analysis['side']} sur {market['question'][:20]}...",
                    "details": analysis["reasoning"]
                }
            })

    # --- 3. MISE À JOUR PORTEFEUILLE (PORTFOLIO UPDATE) ---
    # On envoie toujours l'état du wallet après un tick
    # Calcul PnL fictif (valeur actuelle - coût)
    invested_value = 0
    for pid, pos in wallet.positions.items():
        # Pour la simu, on utilise le prix du marché simulé s'il correspond, sinon le prix moyen
        # Dans un vrai cas, on aurait un dict des prix live
        current_p = next((m["price"] for m in SIMULATED_MARKETS if m["id"] == pid), pos["avg_price"])
        invested_value += pos["shares"] * current_p

    total_value = wallet.usd_balance + invested_value
    
    events.append({
        "type": "PORTFOLIO_UPDATE",
        "timestamp": get_iso_time(),
        "payload": {
            "totalValue": round(total_value, 2),
            "cashBalance": round(wallet.usd_balance, 2),
            "investedValue": round(invested_value, 2),
            "dailyPnL": round(total_value - 1000, 2), # Suppose capital départ 1000
            "totalPnL": round(total_value - 1000, 2)
        }
    })

    # --- 4. STATUS DU BOT (HEARTBEAT) ---
    if random.random() > 0.8: # Pas à chaque fois
        events.append({
            "type": "BOT_STATUS",
            "timestamp": get_iso_time(),
            "payload": {
                "isConnected": True,
                "lastHeartbeat": get_iso_time(),
                "uptime": 1234, # À remplacer par time.time() - start_time
                "totalTrades": len(wallet.transaction_history),
                "winRate": round(bot.win_rate * 100, 1),
                "activePositions": len(wallet.positions),
                "mode": "PAPER",
                "version": "1.0.0"
            }
        })

    return events

  
def generate_response_genai(prompt, temperature=1.0):
    response = client.models.generate_content(
        model="gemini-3-flash-preview", contents=prompt, temperature=temperature
    )
    return response.text

def generate_response_local(prompt, temperature=0.1):
    return ollama.chat(
    model='qwen2.5:14b',
    messages=[{'role': 'user', 'content': prompt}],
    format='json',
    options={
        'num_ctx': 8192, # Contexte suffisant pour un évent Polymarket
        'temperature': temperature # Très bas pour être rigoureux et "froid"
    }
)

def analyze_event_locally(event_text, model_name="qwen2.5:14b"):

    """
    Utilise une IA locale pour trier les données.
    Retourne un dictionnaire ou None si erreur.
    """
    
    # 1. Le Prompt Système (Les règles du jeu)
    system_prompt = """
    Tu es un assistant financier expert. Ta tâche est de filtrer des événements de marché.
    Réponds UNIQUEMENT au format JSON strict.
    Champs requis:
    - "keep": boolean (true si l'événement est pertinent pour la finance/crypto, false sinon)
    - "reason": string (explication courte en français)
    
    Critères d'exclusion (keep: false):
    - Sport, Célébrités.
    
    Critères d'inclusion (keep: true):
    - Finance, Crypto, Tech, Économie, Géopolitique majeure.
    """

    try:
        response = ollama.chat(
            model=model_name,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': f"Analyse cet événement : {event_text}"},
            ],
            format='json',
            options={
                'temperature': 0.1,
                'num_ctx': 8192
            }
        )

        raw_content = response['message']['content']
        decision = json.loads(raw_content)
        return decision

    except Exception as e:
        print(f"❌ Erreur locale ({model_name}): {e}")
        return None