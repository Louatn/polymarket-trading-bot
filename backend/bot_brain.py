import random

class BotBrain:
    def __init__(self, name="AlphaOne"):
        self.name = name

    def decide(self, market):
        """Prend une décision sur un marché"""
        # Simulation d'intelligence : 10% de chance de trader
        if random.random() < 0.90:
            return {"action": "HOLD", "confidence": 0, "reasoning": "Waiting for signal"}

        side = "YES" if random.random() > 0.5 else "NO"
        action = "BUY" # On fait surtout du BUY pour tester
        
        reasons = [
            "Volume spike detected indicating institutional interest.",
            "Sentiment analysis on X shows positive momentum.",
            "Price divergence from calculated probability model."
        ]
        
        return {
            "action": action,
            "side": side,
            "confidence": random.randint(70, 95),
            "reasoning": random.choice(reasons)
        }