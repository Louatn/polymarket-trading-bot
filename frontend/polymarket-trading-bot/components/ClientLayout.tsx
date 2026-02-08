/* ============================================================
   CLIENT LAYOUT — Contexte global + pont vers le backend Python
   
   Ce composant centralise TOUTE la logique de communication
   avec le backend Python via l'API (polling /api/tick).
   
   Il expose un contexte React (useAppContext) que chaque page
   peut consommer pour accéder aux données live :
   - botStatus      → statut du bot (connecté, uptime, etc.)
   - portfolio       → dernier snapshot du portefeuille
   - portfolioHistory → historique pour les charts
   - recentTrades   → derniers trades exécutés
   - activities      → logs d'activité
   - positions       → positions ouvertes
   - markets         → marchés en cours
   - dashboardStats  → stats résumées
   - isConnected     → état de la connexion au backend
   - sendChatMessage → envoyer un message au bot
   
   CONFIGURATION :
   L'URL du backend est dans .env.local → NEXT_PUBLIC_API_URL
   ============================================================ */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import MarketTicker from '@/components/MarketTicker';
import {
  BotStatus,
  PortfolioSnapshot,
  Trade,
  ActivityLog,
  Position,
  Market,
  DashboardStats,
  ChatMessage,
  TunnelMessage,
  DecisionStats,
} from '@/lib/types';

// --- CONFIGURATION API ---
// Récupère l'URL depuis .env.local (ex: https://xxx.ngrok-free.app) ou fallback sur localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- INTERFACE DU CONTEXTE GLOBAL ---
interface AppContextType {
  botStatus: BotStatus;
  portfolio: PortfolioSnapshot;
  portfolioHistory: PortfolioSnapshot[];
  recentTrades: Trade[];
  activities: ActivityLog[];
  positions: Position[];
  markets: Market[];
  dashboardStats: DashboardStats;
  decisionStats: DecisionStats;
  chatHistory: ChatMessage[];
  isConnected: boolean;
  sendChatMessage: (content: string) => Promise<ChatMessage | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- HOOK pour accéder au contexte depuis n'importe quelle page ---
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within ClientLayout');
  return context;
}

// --- ÉTATS INITIAUX (vides au départ, avant le premier tick) ---
const INITIAL_STATUS: BotStatus = {
  isConnected: false,
  lastHeartbeat: new Date().toISOString(),
  uptime: 0,
  totalTrades: 0,
  winRate: 0,
  activePositions: 0,
  mode: 'PAPER',
  version: '—',
};

const INITIAL_PORTFOLIO: PortfolioSnapshot = {
  timestamp: new Date().toISOString(),
  totalValue: 0,
  cashBalance: 0,
  investedValue: 0,
  dailyPnL: 0,
  totalPnL: 0,
};

const INITIAL_STATS: DashboardStats = {
  portfolioValue: 0,
  dailyChange: 0,
  dailyChangePercent: 0,
  totalPnL: 0,
  totalPnLPercent: 0,
  totalTrades: 0,
  winRate: 0,
  activePositions: 0,
  sharpeRatio: 0,
  maxDrawdown: 0,
};

const INITIAL_DECISION_STATS: DecisionStats = {
  total_decisions: 0,
  buys: 0,
  sells: 0,
  holds: 0,
  executed: 0,
};

// --- COMPOSANT CLIENT LAYOUT ---
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // États React — alimentés par le polling /api/tick
  const [botStatus, setBotStatus] = useState<BotStatus>(INITIAL_STATUS);
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot>(INITIAL_PORTFOLIO);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(INITIAL_STATS);
  const [decisionStats, setDecisionStats] = useState<DecisionStats>(INITIAL_DECISION_STATS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // --- PROCESSEUR D'ÉVÉNEMENTS (TunnelMessage) ---
  const processEvent = useCallback((msg: TunnelMessage) => {
    switch (msg.type) {
      case 'BOT_STATUS':
        setBotStatus(msg.payload as BotStatus);
        break;

      case 'PORTFOLIO_UPDATE':
        const snap = msg.payload as PortfolioSnapshot;
        setPortfolio(snap);
        // Ajoute au historique (garde les 90 derniers pour les charts)
        setPortfolioHistory(prev => [...prev, snap].slice(-90));
        break;

      case 'TRADE_EXECUTED':
        const trade = msg.payload as Trade;
        setRecentTrades(prev => [trade, ...prev].slice(0, 100));
        break;

      case 'ACTIVITY_LOG':
        const log = msg.payload as ActivityLog;
        setActivities(prev => [log, ...prev].slice(0, 200));
        break;

      case 'MARKET_UPDATE':
        const market = msg.payload as Market;
        setMarkets(prev => {
          const existing = prev.findIndex(m => m.id === market.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = market;
            return updated;
          }
          return [...prev, market];
        });
        break;

      // Ajoutez ici d'autres cas si nécessaire
    }
  }, []);

  // --- LE PONT VERS PYTHON (POLLING /api/tick) ---
  useEffect(() => {
    const fetchTick = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tick`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }, // Pour ngrok
        });
        if (!res.ok) throw new Error(`API Error ${res.status}`);

        const data = await res.json();
        setIsConnected(true);

        // Traitement des événements reçus (TunnelMessages)
        if (data.events && Array.isArray(data.events)) {
          data.events.forEach((msg: TunnelMessage) => {
            processEvent(msg);
          });
        }

        // Si le backend renvoie directement des champs (fallback)
        if (data.stats) setDashboardStats(data.stats);
        if (data.positions) setPositions(data.positions);
        if (data.markets) setMarkets(data.markets);
        if (data.portfolioHistory) setPortfolioHistory(data.portfolioHistory);
      } catch (error) {
        console.error('⚠️ Backend Python déconnecté:', error);
        setIsConnected(false);
        setBotStatus(prev => ({ ...prev, isConnected: false }));
      }
    };

    // Premier appel immédiat + boucle de polling (toutes les 1.5s)
    fetchTick();
    const interval = setInterval(fetchTick, 1500);
    return () => clearInterval(interval);
  }, [processEvent]);

  // --- Récupération initiale des positions (endpoint dédié) ---
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/positions`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.ok) {
          const data = await res.json();
          setPositions(data);
        }
      } catch {
        /* Le tick prendra le relais */
      }
    };
    if (isConnected) fetchPositions();
  }, [isConnected]);

  // --- Récupération initiale de l'historique portfolio ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/portfolio/history`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setPortfolioHistory(data);
        }
      } catch {
        /* Le tick prendra le relais */
      }
    };
    if (isConnected) fetchHistory();
  }, [isConnected]);

  // --- Récupération initiale des trades ---
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch(`${API_URL}/api/trades`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRecentTrades(data);
        }
      } catch {
        /* Le tick prendra le relais */
      }
    };
    if (isConnected) fetchTrades();
  }, [isConnected]);

  // --- Récupération initiale des logs ---
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/activity`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setActivities(data);
        }
      } catch {
        /* Le tick prendra le relais */
      }
    };
    if (isConnected) fetchLogs();
  }, [isConnected]);

  // --- Récupération initiale de l'historique de chat ---
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat/history`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setChatHistory(data);
        }
      } catch {
        /* Le tick prendra le relais */
      }
    };
    if (isConnected) fetchChatHistory();
  }, [isConnected]);

  // --- Récupération des stats de décisions (polling léger) ---
  useEffect(() => {
    const fetchDecisionStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/decisions/stats`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.ok) {
          const data = await res.json();
          setDecisionStats(data);
        }
      } catch {
        /* ignore */
      }
    };
    if (isConnected) fetchDecisionStats();
    // Refresh decision stats every 5s
    const interval = setInterval(() => {
      if (isConnected) fetchDecisionStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // --- Envoi d'un message au bot via API ---
  const sendChatMessage = useCallback(async (content: string): Promise<ChatMessage | null> => {
    try {
      // Add user message to local chat history immediately
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sender: 'USER',
        content,
      };
      setChatHistory(prev => [...prev, userMsg]);

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok) throw new Error(`Chat API Error ${res.status}`);
      const data = await res.json();
      const botMsg = data as ChatMessage;
      setChatHistory(prev => [...prev, botMsg]);
      return botMsg;
    } catch (error) {
      console.error('⚠️ Chat API error:', error);
      return null;
    }
  }, []);

  // --- Valeur du contexte partagé avec toute l'app ---
  const contextValue: AppContextType = {
    botStatus: { ...botStatus, isConnected },
    portfolio,
    portfolioHistory,
    recentTrades,
    activities,
    positions,
    markets,
    dashboardStats,
    decisionStats,
    chatHistory,
    isConnected,
    sendChatMessage,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background">
        {/* Sidebar — lit isConnected depuis le contexte */}
        <Sidebar />

        {/* Zone principale — décalé du sidebar (256px = w-64) */}
        <div className="ml-64">
          {/* Bannière de déconnexion */}
          {!isConnected && (
            <div className="bg-accent-red/10 border-b border-accent-red/30 text-accent-red px-4 py-2 text-xs text-center font-mono">
              ⚠ SIGNAL PERDU — Vérifiez que le Backend Python (uvicorn) et le Tunnel (ngrok) sont lancés.
              <span className="text-text-muted ml-2">[{API_URL}]</span>
            </div>
          )}

          {/* Market ticker */}
          <MarketTicker />

          {/* Contenu de la page */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
