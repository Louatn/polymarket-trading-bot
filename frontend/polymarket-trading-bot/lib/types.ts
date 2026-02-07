/* ============================================================
   TYPES — Shared TypeScript interfaces for the trading bot
   
   These types define the data structures exchanged between
   the frontend and the AI trading bot via the tunnel.
   
   IMPORTANT: If you modify these types, make sure the backend
   simulator and all components stay in sync.
   ============================================================ */

/* ---- Trade action types ---- */
export type TradeAction = 'BUY' | 'SELL' | 'HOLD';

/* ---- Market category ---- */
export type MarketCategory = 'politics' | 'crypto' | 'sports' | 'entertainment' | 'science' | 'other';

/* ---- A single Polymarket market ---- */
export interface Market {
  id: string;                   // Unique market identifier
  question: string;             // e.g. "Will Bitcoin reach $100k by 2026?"
  category: MarketCategory;     // Category of the market
  currentPrice: number;         // Current price (0.00 - 1.00, represents probability)
  volume24h: number;            // 24h trading volume in USD
  liquidity: number;            // Available liquidity in USD
  endDate: string;              // ISO date when market resolves
  resolved: boolean;            // Whether the market has resolved
  outcome?: 'YES' | 'NO';      // Outcome if resolved
}

/* ---- A trade executed by the bot ---- */
export interface Trade {
  id: string;                   // Unique trade identifier
  timestamp: string;            // ISO timestamp of the trade
  marketId: string;             // Reference to the market
  marketQuestion: string;       // Human-readable market question
  action: TradeAction;          // BUY, SELL, or HOLD
  side: 'YES' | 'NO';          // Which side of the market
  quantity: number;             // Number of shares
  price: number;                // Price per share at execution
  totalCost: number;            // Total cost (quantity * price)
  confidence: number;           // AI confidence level (0-100%)
  reasoning: string;            // AI explanation for the trade
  profitLoss?: number;          // Realized P&L if applicable
}

/* ---- Portfolio position ---- */
export interface Position {
  marketId: string;             // Market identifier
  marketQuestion: string;       // Human-readable question
  side: 'YES' | 'NO';          // Position side
  shares: number;               // Number of shares held
  avgEntryPrice: number;        // Average entry price
  currentPrice: number;         // Current market price
  unrealizedPnL: number;        // Unrealized profit/loss
  percentChange: number;        // Percentage change
}

/* ---- Portfolio snapshot (for chart data) ---- */
export interface PortfolioSnapshot {
  timestamp: string;            // ISO timestamp
  totalValue: number;           // Total portfolio value in USD
  cashBalance: number;          // Available cash
  investedValue: number;        // Value in positions
  dailyPnL: number;             // Daily profit/loss
  totalPnL: number;             // Total profit/loss since inception
}

/* ---- Bot status ---- */
export interface BotStatus {
  isConnected: boolean;         // Whether tunnel is active
  lastHeartbeat: string;        // Last heartbeat timestamp
  uptime: number;               // Uptime in seconds
  totalTrades: number;          // Total trades executed
  winRate: number;              // Win rate percentage
  activePositions: number;      // Number of active positions
  mode: 'LIVE' | 'PAPER';      // Trading mode
  version: string;              // Bot version
}

/* ---- Chat message with the bot ---- */
export interface ChatMessage {
  id: string;                   // Message ID
  timestamp: string;            // ISO timestamp
  sender: 'USER' | 'BOT';      // Who sent the message
  content: string;              // Message content
  isTyping?: boolean;           // Bot typing indicator
}

/* ---- Activity log entry ---- */
export interface ActivityLog {
  id: string;                   // Log entry ID
  timestamp: string;            // ISO timestamp
  type: 'TRADE' | 'ALERT' | 'SYSTEM' | 'ANALYSIS';
  severity: 'info' | 'warning' | 'success' | 'error';
  message: string;              // Log message
  details?: string;             // Additional details
}

/* ---- Dashboard stats ---- */
export interface DashboardStats {
  portfolioValue: number;       // Total portfolio value
  dailyChange: number;          // Daily change in USD
  dailyChangePercent: number;   // Daily change in %
  totalPnL: number;             // Total P&L since inception
  totalPnLPercent: number;      // Total P&L in %
  totalTrades: number;          // Total trades
  winRate: number;              // Win rate %
  activePositions: number;      // Active positions count
  sharpeRatio: number;          // Sharpe ratio
  maxDrawdown: number;          // Max drawdown %
}

/* ---- Tunnel message format (from backend) ---- */
export interface TunnelMessage {
  type: 'TRADE_EXECUTED' | 'PORTFOLIO_UPDATE' | 'BOT_STATUS' | 'CHAT_RESPONSE' | 'ACTIVITY_LOG' | 'MARKET_UPDATE';
  payload: Trade | PortfolioSnapshot | BotStatus | ChatMessage | ActivityLog | Market;
  timestamp: string;
}
