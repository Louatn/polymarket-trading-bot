import requests
from datetime import datetime
from typing import Iterable, Optional, List, Dict, Any

def collect_data(active=True, 
                 closed=False, 
                 limit=None,
                 type: list[str] = [None]):
    return {
        "market_data": collect_events(active, closed, limit, type),
        }

def collect_events(active=True, closed=False, limit=None, types: list[str] = [None]):
    for type in types:
        if type not in ["crypto", "sports", "events", None]:
            raise ValueError(f"Invalid type: {type}. Must be one of 'crypto', 'sports', 'events'.") 
        else :
            url = f"https://gamma-api.polymarket.com/{type if type else 'events'}?active={active}&closed={closed}&limit={limit}"

            response = requests.get(url)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to fetch events: {response.status_code}")
                
                return None


def sort_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Trie les données Polymarket pour une IA.
    Retourne une liste de dictionnaires contenant :
    1. La structure optimisée pour la décision (Smart Data)
    2. La donnée brute épurée du bruit visuel/technique (Raw Filtered)
    """
    
    # Liste des clés considérées comme du "Bruit" (Noise) à supprimer de la donnée brute
    # Cela réduit la taille du contexte pour l'IA sans perdre d'info financière.
    NOISE_KEYS_ROOT = [
        "image", "icon", "slug", "submitted_by", "resolvedBy", 
        "requiresTranslation", "cyom", "pagerDutyNotificationEnabled", 
        "approved", "restricted", "seriesColor", "showGmpSeries"
    ]
    
    NOISE_KEYS_MARKET = [
        "image", "icon", "slug", "marketMakerAddress", 
        "clobTokenIds", "umaBond", "umaReward", "seriesColor"
    ]

    analyzed_events = []

    for event in data:
        # --- ÉTAPE 1 : CRÉATION DE LA "DONNÉE ÉPURÉE BRUTE" ---
        # On fait une copie pour ne pas modifier la liste originale par erreur
        raw_cleaned = event.copy()
        
        # Nettoyage niveau racine (Event)
        for key in NOISE_KEYS_ROOT:
            raw_cleaned.pop(key, None)
            
        # Nettoyage niveau sous-marchés (Markets)
        if "markets" in raw_cleaned:
            clean_markets = []
            for m in raw_cleaned["markets"]:
                m_copy = m.copy()
                for key in NOISE_KEYS_MARKET:
                    m_copy.pop(key, None)
                clean_markets.append(m_copy)
            raw_cleaned["markets"] = clean_markets

        # --- ÉTAPE 2 : STRUCTURATION INTELLIGENTE (SMART DATA) ---
        smart_data = {
            # Bloc 1 : Suivi Technique
            "tracking": {
                "event_id": event.get("id"),
                "ticker": event.get("ticker")
            },

            # Bloc 2 : Contexte pour Recherche Web (Prompting)
            "research_context": {
                "query_topic": event.get("title"),
                "constraints": event.get("description"),
                "sector_tags": [tag.get("label") for tag in event.get("tags", [])],
                "resolution_source": event.get("resolutionSource")
            },

            # Bloc 3 : Données Financières pour Calculs
            "market_opportunities": [],

            # Bloc 4 : La Donnée Épurée Brute (Backup pour l'IA)
            "raw_data_filtered": raw_cleaned 
        }

        # Remplissage du Bloc 3 (Opportunités)
        for market in event.get("markets", []):
            # Filtre : On ignore les marchés fermés/résolus pour le trading actif
            # Mais ils restent présents dans "raw_data_filtered" pour l'historique
            market_status = "ACTIVE"
            if market.get("closed") or market.get("umaResolutionStatus") == "resolved":
                market_status = "CLOSED"

            opportunity = {
                "status": market_status,
                "sub_id": market.get("id"),
                "clob_ids": market.get("clobTokenIds"), # Gardé ici pour l'exécution d'ordre
                "specific_question": market.get("question"),
                "deadline": market.get("endDate"),
                "prices": {
                    "outcomes": market.get("outcomes"),
                    "probabilities": market.get("outcomePrices"),
                    "spread": market.get("spread"),
                    "best_bid": market.get("bestBid"),
                    "best_ask": market.get("bestAsk")
                },
                "liquidity_metrics": {
                    "liquidity_depth": market.get("liquidity"),
                    "volume_24h": market.get("volume24hr"),
                    "volume_total": market.get("volume")
                }
            }
            smart_data["market_opportunities"].append(opportunity)

        analyzed_events.append(smart_data)

    return analyzed_events

def print_analyzed_event(
    smart_event: Dict[str, Any],
    *,
    show_markets: bool = True,
    max_markets: Optional[int] = None,
    show_tags: bool = True,
    show_description: bool = False,
    compact: bool = False
) -> None:
    """
    Affiche un rapport terminal structuré basé sur la donnée 'Smart Data' triée pour l'IA.
    """

    # --- HELPER FUNCTIONS (Identiques à votre standard) ---
    def _fmt_date(iso: Optional[str]) -> str:
        if not iso:
            return "N/A"
        try:
            # Nettoyage basique du format ISO
            return datetime.fromisoformat(iso.replace("Z", "")).strftime("%Y-%m-%d %H:%M")
        except Exception:
            return str(iso)

    def _fmt_float(x, ndigits=2) -> str:
        if x is None:
            return "N/A"
        try:
            return f"{float(x):,.{ndigits}f}"
        except Exception:
            return str(x)

    def _fmt_list(items: list) -> str:
        if not items: 
            return "None"
        try:
            # Gestion des outcomePrices qui sont parfois des strings JSON "['0.2', '0.8']"
            if isinstance(items, str) and "[" in items:
                import ast
                items = ast.literal_eval(items)
            return ", ".join(str(i) for i in items)
        except:
            return str(items)

    # Extraction des blocs de données
    tracking = smart_event.get("tracking", {})
    ctx = smart_event.get("research_context", {})
    opps = smart_event.get("market_opportunities", [])

    sep = "=" * 90
    sub = "-" * 90

    # --- SECTION 1 : EN-TÊTE ---
    print(sep)
    print("SORTED ANALYSIS REPORT")
    print(sep)

    print(f"Topic        : {ctx.get('query_topic')}")
    print(f"Ticker       : {tracking.get('ticker')}")
    print(f"Event ID     : {tracking.get('event_id')}")
    print(f"Source       : {ctx.get('resolution_source') or 'Polymarket General'}")

    # --- SECTION 2 : CONTEXTE (TAGS & DESCRIPTION) ---
    if show_tags:
        tags = ctx.get("sector_tags") or []
        if tags:
            print(sub)
            print("SECTOR CONTEXT")
            print(sub)
            print(", ".join(tags))

    if show_description:
        desc = ctx.get("constraints")
        if desc:
            print(sub)
            print("RESOLUTION CONSTRAINTS")
            print(sub)
            print(desc.strip())

    # --- SECTION 3 : OPPORTUNITÉS DE MARCHÉ ---
    if show_markets:
        if max_markets is not None:
            opps = opps[:max_markets]

        print(sub)
        print(f"MARKET OPPORTUNITIES ({len(opps)} items)")
        print(sub)

        for i, m in enumerate(opps, 1):
            # Alias pour raccourcir l'accès aux sous-dictionnaires
            p = m.get("prices", {})
            l = m.get("liquidity_metrics", {})
            
            # Indicateur visuel d'état
            status_icon = "🟢" if m.get("status") == "ACTIVE" else "🔴"
            
            print(f"[{i}] {status_icon} {m.get('specific_question')}")
            print(f"    Sub-ID    : {m.get('sub_id')}")
            print(f"    Deadline  : {_fmt_date(m.get('deadline'))}")
            
            # Affichage des probabilités (Cœur de la décision IA)
            probs = p.get("probabilities")
            outcomes = p.get("outcomes")
            if probs and outcomes:
                # Nettoyage si c'est encore des strings
                import ast
                if isinstance(probs, str): probs = ast.literal_eval(probs)
                if isinstance(outcomes, str): outcomes = ast.literal_eval(outcomes)
                
                # Formatage propre "Yes: 23% | No: 77%"
                try:
                    prob_str = " | ".join([f"{o}: {float(v)*100:.1f}%" for o, v in zip(outcomes, probs)])
                    print(f"    Implied % : {prob_str}")
                except:
                    print(f"    Implied % : {probs}")

            if not compact:
                print(f"    --- Liquidity & Order Book ---")
                print(f"    Liquidity : ${_fmt_float(l.get('liquidity_depth'))}")
                print(f"    Vol (24h) : ${_fmt_float(l.get('volume_24h'))}")
                print(f"    Vol (Tot) : ${_fmt_float(l.get('volume_total'))}")
                print(f"    Best Bid  : {_fmt_float(p.get('best_bid'), 3)}")
                print(f"    Best Ask  : {_fmt_float(p.get('best_ask'), 3)}")
                print(f"    Spread    : {_fmt_float(p.get('spread'), 4)}")

            print()

    print(sep)