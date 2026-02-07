import random
import time
from datetime import datetime

class Portefeuille:
    def __init__(self, capital_initial=1000.0):
        self.especes = capital_initial
        self.actifs = {}  # Ex: {'BTC': 0.5, 'AAPL': 10}
        self.historique = []

    def acheter(self, symbole, prix_unitaire, quantite):
        cout_total = prix_unitaire * quantite
        
        if cout_total > self.especes:
            print(f"⚠️  Fonds insuffisants pour acheter {quantite} {symbole}")
            return False
        
        # Mise à jour du solde
        self.especes -= cout_total
        
        # Mise à jour des actifs
        if symbole in self.actifs:
            self.actifs[symbole] += quantite
        else:
            self.actifs[symbole] = quantite
            
        self._enregistrer_transaction("ACHAT", symbole, prix_unitaire, quantite)
        print(f"✅ ACHAT RÉUSSI : {quantite} {symbole} à {prix_unitaire:.2f} €")
        return True

    def vendre(self, symbole, prix_unitaire, quantite):
        if symbole not in self.actifs or self.actifs[symbole] < quantite:
            print(f"⚠️  Actifs insuffisants pour vendre {quantite} {symbole}")
            return False
            
        gain_total = prix_unitaire * quantite
        
        # Mise à jour du solde
        self.especes += gain_total
        
        # Mise à jour des actifs
        self.actifs[symbole] -= quantite
        if self.actifs[symbole] == 0:
            del self.actifs[symbole] # Nettoyage si solde à 0
            
        self._enregistrer_transaction("VENTE", symbole, prix_unitaire, quantite)
        print(f"💰 VENTE RÉUSSIE : {quantite} {symbole} à {prix_unitaire:.2f} €")
        return True

    def _enregistrer_transaction(self, type_ordre, symbole, prix, quantite):
        """Fonction interne pour garder une trace"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.historique.append({
            'heure': timestamp,
            'type': type_ordre,
            'symbole': symbole,
            'prix': prix,
            'quantite': quantite
        })

    def afficher_etat(self, prix_actuel_marche):
        """Visualisation facile à lire du portefeuille"""
        valeur_actifs = 0
        if 'BTC' in self.actifs:
            valeur_actifs = self.actifs['BTC'] * prix_actuel_marche
            
        valeur_totale = self.especes + valeur_actifs
        
        print("\n" + "="*40)
        print(f"📊 ÉTAT DU PORTEFEUILLE ({datetime.now().strftime('%H:%M:%S')})")
        print("-" * 40)
        print(f"💵 Espèces disponibles : {self.especes:.2f} €")
        print(f"🪙  Actifs détenus      : {self.actifs}")
        print(f"📈 Valeur Totale       : {valeur_totale:.2f} €")
        print("="*40 + "\n")

# --- SIMULATION DU MARCHÉ ---

def generer_prix_fictif(ancien_prix):
    """Simule une fluctuation de marché basique"""
    changement = random.uniform(-0.02, 0.02) # Fluctuation entre -2% et +2%
    nouveau_prix = ancien_prix * (1 + changement)
    return round(nouveau_prix, 2)

# --- BOUCLE PRINCIPALE ---

def lancer_bot():
    mon_wallet = Portefeuille(capital_initial=1000.0)
    prix_btc = 30000.0 # Prix de départ fictif
    
    print("🤖 Démarrage du Bot de Trading - Simulation")
    print(f"Capital de départ : {mon_wallet.especes} €\n")

    try:
        while True:
            # 1. Mise à jour du marché (Simulation)
            prix_btc = generer_prix_fictif(prix_btc)
            print(f"ℹ️  Prix actuel du BTC : {prix_btc} €")

            # 2. TA STRATÉGIE ICI (Zone à modifier par toi)
            # Pour l'exemple, j'ai mis une logique aléatoire basique
            action = random.choice(['rien', 'acheter', 'vendre'])
            
            if action == 'acheter':
                # Tente d'acheter pour 10% du cash dispo
                montant_a_investir = mon_wallet.especes * 0.10
                quantite = montant_a_investir / prix_btc
                if quantite > 0.0001: # Minimum technique
                    mon_wallet.acheter('BTC', prix_btc, quantite)
            
            elif action == 'vendre':
                # Tente de vendre 50% des BTC détenus
                if 'BTC' in mon_wallet.actifs:
                    quantite = mon_wallet.actifs['BTC'] * 0.5
                    mon_wallet.vendre('BTC', prix_btc, quantite)

            # 3. Affichage
            mon_wallet.afficher_etat(prix_actuel_marche=prix_btc)
            
            # Pause pour lisibilité
            time.sleep(2) 

    except KeyboardInterrupt:
        print("\n🛑 Arrêt du bot...")

if __name__ == "__main__":
    lancer_bot()