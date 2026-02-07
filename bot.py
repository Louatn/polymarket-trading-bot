from google import genai
import ollama
import json

apikey = "AIzaSyDi_k7pgc04BDwlIKxF-7WKwXFBhehUgzw"

client = genai.Client(api_key=apikey)

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