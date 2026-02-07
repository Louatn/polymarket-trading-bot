/* ============================================================
   DATA SIMULATOR — Generates fake trading data for development
   
   This module simulates the data that would normally come from
   the AI trading bot through the tunnel connection.
   
   In production, replace the simulator calls with actual
   WebSocket/tunnel data handlers.
   
   HOW TO CUSTOMIZE:
   - Adjust MARKETS array to add/remove simulated markets
   - Modify generateTrade() to change trade patterns
   - Change INITIAL_BALANCE for different starting capital
   - Adjust intervals in useSimulator() for data frequency
   ============================================================ */

import {
  Trade,
  Market,
  Position,
  PortfolioSnapshot,
  BotStatus,
  ActivityLog,
  DashboardStats,
  ChatMessage,
  TradeAction,
  MarketCategory,
} from './types';

// ---- Configuration ----
const INITIAL_BALANCE = 10000;     // Starting balance in USD
const TRADE_FREQUENCY_MS = 15000;  // New trade every 15 seconds
const SNAPSHOT_FREQUENCY_MS = 5000; // Portfolio snapshot every 5 seconds

// ---- Helper: generate UUID ----
function uuid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ---- Helper: random number in range ----
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ---- Helper: random item from array ----
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- Simulated Polymarket markets ----
const SIMULATED_MARKETS: Market[] = [
  {
    id: 'mkt_btc_100k',
    question: 'Will Bitcoin reach $150k by end of 2026?',
    category: 'crypto',
    currentPrice: 0.42,
    volume24h: 1250000,
    liquidity: 3400000,
    endDate: '2026-12-31T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_us_election',
    question: 'Will the current party win the next US election?',
    category: 'politics',
    currentPrice: 0.55,
    volume24h: 8900000,
    liquidity: 15000000,
    endDate: '2028-11-05T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_eth_merge',
    question: 'Will Ethereum surpass $10k in 2026?',
    category: 'crypto',
    currentPrice: 0.31,
    volume24h: 780000,
    liquidity: 2100000,
    endDate: '2026-12-31T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_ai_agi',
    question: 'Will AGI be achieved before 2030?',
    category: 'science',
    currentPrice: 0.18,
    volume24h: 450000,
    liquidity: 890000,
    endDate: '2030-01-01T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_mars',
    question: 'Will humans land on Mars before 2030?',
    category: 'science',
    currentPrice: 0.08,
    volume24h: 320000,
    liquidity: 670000,
    endDate: '2030-01-01T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_world_cup',
    question: 'Will Brazil win the 2026 World Cup?',
    category: 'sports',
    currentPrice: 0.22,
    volume24h: 2100000,
    liquidity: 5600000,
    endDate: '2026-07-19T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_fed_rate',
    question: 'Will the Fed cut rates below 3% in 2026?',
    category: 'politics',
    currentPrice: 0.38,
    volume24h: 1900000,
    liquidity: 4200000,
    endDate: '2026-12-31T00:00:00Z',
    resolved: false,
  },
  {
    id: 'mkt_oscar',
    question: 'Will an AI-generated film win an Oscar by 2028?',
    category: 'entertainment',
    currentPrice: 0.12,
    volume24h: 150000,
    liquidity: 340000,
    endDate: '2028-03-01T00:00:00Z',
    resolved: false,
  },
];

// ---- AI reasoning templates ----
const BUY_REASONS = [
  'Sentiment analysis indicates increasing public confidence. Market price is undervalued relative to our probability model. Expected value: positive.',
  'Cross-referencing news sources shows momentum shift. Volume spike detected — institutional interest likely. Risk-adjusted return is favorable.',
  'Our neural network predicts a 73% probability vs market\'s {price}%. Significant alpha opportunity detected. Initiating position.',
  'Social media sentiment turned bullish in the last 4 hours. On-chain metrics confirm growing interest. Probability arbitrage identified.',
  'Statistical model shows mean reversion expected. Current price diverges from fundamental probability by >15%. High conviction buy.',
  'Breaking news catalyst detected. Market hasn\'t fully priced in recent developments. Time-sensitive opportunity.',
];

const SELL_REASONS = [
  'Position target reached. Locking in {profit}% profit. Risk management protocol triggered — reducing exposure.',
  'Market dynamics shifting against our thesis. Updated probability model shows reduced edge. Defensive exit initiated.',
  'Volatility spike detected — protective sell to preserve capital. Will re-enter when conditions stabilize.',
  'New information contradicts original thesis. Bayesian update reduces predicted probability. Cutting losses early.',
  'Portfolio rebalancing trigger hit. Position exceeded maximum allocation of 15%. Trimming to optimal size.',
  'Correlation analysis shows increasing systemic risk. Reducing overall exposure across all positions.',
];

const HOLD_REASONS = [
  'Position within expected range. No new information to change thesis. Maintaining with current stop-loss levels.',
  'Market consolidating — waiting for breakout signal. Patience is the optimal strategy at this junction.',
  'Analysis ongoing. Current indicators are neutral. Will reassess at next data checkpoint.',
  'Position performing as expected. Unrealized gains of {profit}% — letting the winner run.',
];

// ---- Generate a random trade ----
export function generateTrade(markets: Market[]): Trade {
  const market = pick(markets);
  const action: TradeAction = pick(['BUY', 'SELL', 'HOLD', 'BUY', 'BUY', 'SELL']); // Weighted toward BUY
  const side = pick(['YES', 'NO']) as 'YES' | 'NO';
  const quantity = Math.floor(rand(10, 500));
  const price = Math.max(0.01, Math.min(0.99, market.currentPrice + rand(-0.1, 0.1)));
  const confidence = Math.floor(rand(45, 98));
  const profitLoss = action === 'SELL' ? rand(-50, 200) : undefined;

  // Pick reasoning based on action type
  let reasoning: string;
  if (action === 'BUY') {
    reasoning = pick(BUY_REASONS).replace('{price}', (market.currentPrice * 100).toFixed(0));
  } else if (action === 'SELL') {
    reasoning = pick(SELL_REASONS).replace('{profit}', (profitLoss ?? 0).toFixed(1));
  } else {
    reasoning = pick(HOLD_REASONS).replace('{profit}', rand(1, 15).toFixed(1));
  }

  return {
    id: `trade_${uuid()}`,
    timestamp: new Date().toISOString(),
    marketId: market.id,
    marketQuestion: market.question,
    action,
    side,
    quantity,
    price: parseFloat(price.toFixed(4)),
    totalCost: parseFloat((quantity * price).toFixed(2)),
    confidence,
    reasoning,
    profitLoss: profitLoss ? parseFloat(profitLoss.toFixed(2)) : undefined,
  };
}

// ---- Generate portfolio history ----
export function generatePortfolioHistory(days: number = 30): PortfolioSnapshot[] {
  const snapshots: PortfolioSnapshot[] = [];
  let value = INITIAL_BALANCE;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    // Simulate daily fluctuation with slight upward bias
    const dailyReturn = rand(-0.03, 0.035);
    value = value * (1 + dailyReturn);
    const dailyPnL = value * dailyReturn;

    snapshots.push({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      totalValue: parseFloat(value.toFixed(2)),
      cashBalance: parseFloat((value * rand(0.2, 0.5)).toFixed(2)),
      investedValue: parseFloat((value * rand(0.5, 0.8)).toFixed(2)),
      dailyPnL: parseFloat(dailyPnL.toFixed(2)),
      totalPnL: parseFloat((value - INITIAL_BALANCE).toFixed(2)),
    });
  }

  return snapshots;
}

// ---- Generate active positions ----
export function generatePositions(): Position[] {
  return SIMULATED_MARKETS.slice(0, Math.floor(rand(3, 7))).map((market) => {
    const avgEntry = Math.max(0.01, market.currentPrice + rand(-0.15, 0.05));
    const shares = Math.floor(rand(50, 1000));
    const unrealizedPnL = (market.currentPrice - avgEntry) * shares;

    return {
      marketId: market.id,
      marketQuestion: market.question,
      side: pick(['YES', 'NO']) as 'YES' | 'NO',
      shares,
      avgEntryPrice: parseFloat(avgEntry.toFixed(4)),
      currentPrice: market.currentPrice,
      unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
      percentChange: parseFloat(((market.currentPrice - avgEntry) / avgEntry * 100).toFixed(2)),
    };
  });
}

// ---- Generate bot status ----
export function generateBotStatus(): BotStatus {
  return {
    isConnected: true,
    lastHeartbeat: new Date().toISOString(),
    uptime: Math.floor(rand(3600, 864000)), // 1 hour to 10 days
    totalTrades: Math.floor(rand(150, 2500)),
    winRate: parseFloat(rand(52, 78).toFixed(1)),
    activePositions: Math.floor(rand(3, 8)),
    mode: 'PAPER',
    version: '2.4.1',
  };
}

// ---- Generate dashboard stats ----
export function generateDashboardStats(): DashboardStats {
  const portfolioValue = parseFloat(rand(9000, 15000).toFixed(2));
  const dailyChange = parseFloat(rand(-200, 400).toFixed(2));
  const totalPnL = portfolioValue - INITIAL_BALANCE;

  return {
    portfolioValue,
    dailyChange,
    dailyChangePercent: parseFloat((dailyChange / portfolioValue * 100).toFixed(2)),
    totalPnL: parseFloat(totalPnL.toFixed(2)),
    totalPnLPercent: parseFloat((totalPnL / INITIAL_BALANCE * 100).toFixed(2)),
    totalTrades: Math.floor(rand(150, 2500)),
    winRate: parseFloat(rand(52, 78).toFixed(1)),
    activePositions: Math.floor(rand(3, 8)),
    sharpeRatio: parseFloat(rand(0.8, 2.5).toFixed(2)),
    maxDrawdown: parseFloat(rand(5, 20).toFixed(2)),
  };
}

// ---- Generate activity logs ----
export function generateActivityLogs(count: number = 20): ActivityLog[] {
  const logs: ActivityLog[] = [];
  const now = Date.now();

  const templates: { type: ActivityLog['type']; severity: ActivityLog['severity']; messages: string[] }[] = [
    {
      type: 'TRADE',
      severity: 'success',
      messages: [
        'BUY order executed: 150 shares YES @ $0.42',
        'SELL order filled: 200 shares NO @ $0.67',
        'Position opened on "Will BTC reach $150k?"',
        'Take-profit triggered on ETH market position',
      ],
    },
    {
      type: 'ALERT',
      severity: 'warning',
      messages: [
        'Unusual volume detected on political markets',
        'Portfolio drawdown approaching 10% threshold',
        'Market volatility index elevated — adjusting strategy',
        'Liquidity decreased in target market — widening spreads',
      ],
    },
    {
      type: 'SYSTEM',
      severity: 'info',
      messages: [
        'Tunnel connection established — latency: 23ms',
        'Model checkpoint loaded — version 2.4.1',
        'Risk parameters updated — max position: 15%',
        'Daily portfolio snapshot saved',
        'Heartbeat received — all systems operational',
      ],
    },
    {
      type: 'ANALYSIS',
      severity: 'info',
      messages: [
        'Sentiment analysis complete — 12 markets scanned',
        'News feed processed — 3 actionable signals detected',
        'Probability model recalibrated — accuracy: 71.3%',
        'Cross-market correlation updated — 2 new edges found',
      ],
    },
  ];

  for (let i = 0; i < count; i++) {
    const template = pick(templates);
    logs.push({
      id: `log_${uuid()}`,
      timestamp: new Date(now - i * rand(30000, 600000)).toISOString(),
      type: template.type,
      severity: template.severity,
      message: pick(template.messages),
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ---- Generate initial trade history ----
export function generateTradeHistory(count: number = 50): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const trade = generateTrade(SIMULATED_MARKETS);
    trade.timestamp = new Date(now - i * rand(600000, 7200000)).toISOString();
    trades.push(trade);
  }

  return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ---- Bot chat response generator ----
const BOT_RESPONSES: Record<string, string[]> = {
  default: [
    'I\'m currently monitoring 8 active markets across politics, crypto, and sports categories. My analysis pipeline processes data every 30 seconds.',
    'My current strategy focuses on probability arbitrage — finding markets where my model\'s predicted probability diverges significantly from the market price.',
    'I use a combination of sentiment analysis, on-chain metrics, and news feed processing to make trading decisions. Each signal is weighted by historical accuracy.',
    'Portfolio health is nominal. Current Sharpe ratio is within acceptable range. I\'m maintaining defensive positioning due to elevated market volatility.',
  ],
  strategy: [
    'Current strategy: Multi-factor probability arbitrage. I identify markets where the implied probability (price) deviates from my statistical model by more than 10%. I then size positions using Kelly Criterion with a 0.5x multiplier for safety.',
    'I employ three main strategies: 1) Momentum-based entries on high-volume moves, 2) Mean-reversion plays when prices deviate from fundamentals, 3) Event-driven positioning based on news catalysts.',
  ],
  performance: [
    'Over the last 30 days: Win rate 64.2%, Sharpe ratio 1.87, max drawdown -8.3%. Total P&L: +$847.23. Best performing sector: crypto markets.',
    'Performance metrics are updated every hour. Current session shows 12 trades executed with 75% hit rate. Average profit per winning trade: $34.50.',
  ],
  risk: [
    'Risk management rules: Max 15% portfolio allocation per position. Stop-loss at -20% per trade. Daily loss limit: 5% of portfolio. Currently operating within all parameters.',
    'Risk level is moderate. I\'m monitoring correlation between positions to avoid concentrated sector exposure. Current max correlated exposure: 28%.',
  ],
  market: [
    'Market conditions: Overall liquidity is healthy across monitored markets. Political markets showing highest volumes. Crypto markets are in a consolidation phase — waiting for breakout signals.',
    'Key events to watch: Fed meeting next week could impact rate markets. Several crypto markets have upcoming resolution dates. Sports markets are seeing pre-event volume increases.',
  ],
};

export function generateBotResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('strateg') || lower.includes('stratégie') || lower.includes('comment')) {
    return pick(BOT_RESPONSES.strategy);
  }
  if (lower.includes('perform') || lower.includes('résult') || lower.includes('profit') || lower.includes('gain')) {
    return pick(BOT_RESPONSES.performance);
  }
  if (lower.includes('risk') || lower.includes('risque') || lower.includes('danger') || lower.includes('perte')) {
    return pick(BOT_RESPONSES.risk);
  }
  if (lower.includes('market') || lower.includes('marché') || lower.includes('march')) {
    return pick(BOT_RESPONSES.market);
  }

  return pick(BOT_RESPONSES.default);
}

// ---- Export markets for use in components ----
export { SIMULATED_MARKETS };
export { INITIAL_BALANCE, TRADE_FREQUENCY_MS, SNAPSHOT_FREQUENCY_MS };
