/* ============================================================
   TRADES PAGE — Full trade history with filters
   
   Displays the complete history of all trades executed
   by the AI trading bot. Includes:
   - Total trade count and P&L summary
   - Sortable and filterable trade table
   - Expandable AI reasoning for each trade
   
   In production, data comes from the tunnel/API.
   ============================================================ */

'use client';

import { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Target,
} from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';
import TradeTable from '@/components/TradeTable';
import StatCard from '@/components/StatCard';
import { generateTradeHistory, generateTrade, SIMULATED_MARKETS } from '@/lib/simulator';
import { Trade } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);

  /* Initialize with historical trades */
  useEffect(() => {
    setTrades(generateTradeHistory(100));
  }, []);

  /* Simulate new trades arriving */
  useEffect(() => {
    const interval = setInterval(() => {
      const newTrade = generateTrade(SIMULATED_MARKETS);
      setTrades((prev) => [newTrade, ...prev]);
    }, 25000); // New trade every 25 seconds

    return () => clearInterval(interval);
  }, []);

  /* Calculate summary stats from trades */
  const totalTrades = trades.length;
  const buyCount = trades.filter((t) => t.action === 'BUY').length;
  const sellCount = trades.filter((t) => t.action === 'SELL').length;
  const holdCount = trades.filter((t) => t.action === 'HOLD').length;
  const totalPnL = trades.reduce((acc, t) => acc + (t.profitLoss ?? 0), 0);
  const winCount = trades.filter((t) => t.profitLoss !== undefined && t.profitLoss > 0).length;
  const lossCount = trades.filter((t) => t.profitLoss !== undefined && t.profitLoss < 0).length;
  const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;

  return (
    <ClientLayout>
      {/* ---- Page header ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          <span className="text-accent-green">$</span> Trade History
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Complete log of all AI trading decisions and executions
        </p>
      </div>

      {/* ---- Summary stats ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Trades"
          value={totalTrades.toString()}
          icon={ArrowRightLeft}
          variant="cyan"
        />
        <StatCard
          label="Buy Orders"
          value={buyCount.toString()}
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          label="Sell Orders"
          value={sellCount.toString()}
          icon={TrendingDown}
          variant="red"
        />
        <StatCard
          label="Realized P&L"
          value={formatCurrency(totalPnL)}
          icon={History}
          variant={totalPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          icon={Target}
          variant="amber"
        />
      </div>

      {/* ---- Trade table ---- */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-accent-green" />
          All Trades
          <span className="text-xs text-text-muted font-normal">
            — Click a row to see AI reasoning
          </span>
        </h2>
        <TradeTable trades={trades} />
      </div>
    </ClientLayout>
  );
}
