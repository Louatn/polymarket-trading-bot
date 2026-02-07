from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import de tes modules locaux
from wallet_env import PaperWallet # Ton fichier wallet existant
from bot_brain import BotBrain     # Le fichier créé ci-dessus
from simulation import test_simulation # Le fichier créé ci-dessus

app = FastAPI()

# IMPORTANT : Autoriser le frontend (Localhost + Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation Unique
my_wallet = PaperWallet(starting_balance=10000.0)
my_bot = BotBrain(name="PolyBot V1")

@app.get("/")
def read_root():
    return {"status": "Python Backend is Running"}

@app.get("/api/tick")
def get_simulation_tick():
    """
    Le Frontend appelle cette URL toutes les X secondes.
    Le Backend fait avancer la simulation d'un pas et renvoie les événements.
    """
    # On lance un tour de simulation
    tunnel_messages = test_simulation(my_wallet, my_bot)
    
    return {
        "events": tunnel_messages
    }

# Endpoint pour récupérer les positions initiales (optionnel mais utile)
@app.get("/api/positions")
def get_positions():
    # On simule des prix actuels pour l'exemple
    dummy_prices = {"mkt_btc_100k": 0.42, "mkt_mars": 0.08}
    return my_wallet.get_positions_formatted(dummy_prices)