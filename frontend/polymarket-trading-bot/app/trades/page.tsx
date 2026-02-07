/* ============================================================
   TRADES PAGE — Full trade history with filters
   
   Displays the complete history of all trades executed
   by the AI trading bot. Includes:
   - Total trade count and P&L summary
   - Sortable and filterable trade table
   - Expandable AI reasoning for each trade
   
   Données live via useAppContext() (polling backend Python).
   ============================================================ */

'use client';

import {
  History,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Target,
} from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';
import { useAppContext } from '@/components/ClientLayout';
import TradeTable from '@/components/TradeTable';
import StatCard from '@/components/StatCard';
import { formatCurrency } from '@/lib/utils';

export default function TradesPage() {
  return (
    <ClientLayout>
      <TradesContent />
    </ClientLayout>
  );
}

function TradesContent() {
  const { recentTrades: trades } = useAppContext();

  /* Calculate summary stats from trades */
  const totalTrades = trades.length;
  const buyCount = trades.filter((t) => t.action === 'BUY').length;
  const sellCount = trades.filter((t) => t.action === 'SELL').length;
  const totalPnL = trades.reduce((acc, t) => acc + (t.profitLoss ?? 0), 0);
  const winCount = trades.filter((t) => t.profitLoss !== undefined && t.profitLoss > 0).length;
  const lossCount = trades.filter((t) => t.profitLoss !== undefined && t.profitLoss < 0).length;
  const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;

  return (
    <>
      {/* ---- Page header — Retro ASCII ---- */}
      <div className="mb-6">
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
        <h1 className="text-xl font-bold tracking-widest text-glow-green font-mono">
          {'>'} TRADE_HISTORY_
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-mono">
          // Complete log of all AI trading decisions
        </p>
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
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
        <h2 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 font-mono">
          <span className="text-text-muted">[</span>
          <History className="h-3.5 w-3.5 text-accent-green" />
          ALL_TRADES
          <span className="text-text-muted">]</span>
          <span className="text-[10px] text-text-muted font-normal ml-2">
            // Click row for AI reasoning
          </span>
        </h2>
        <TradeTable trades={trades} />
      </div>
    </>
  );
}
