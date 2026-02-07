/* ============================================================
   DASHBOARD PAGE — Main overview / homepage
   
   Displays:
   - Key portfolio metrics (stat cards)
   - Portfolio value chart (mini)
   - Recent trades (last 5)
   - Active positions snapshot
   - Recent activity feed
   
   Toutes les données viennent du contexte global (useAppContext)
   qui poll le backend Python via /api/tick.
   ============================================================ */

'use client';

import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Award,
  Shield,
  Activity,
} from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';
import { useAppContext } from '@/components/ClientLayout';
import StatCard from '@/components/StatCard';
import PortfolioChart from '@/components/PortfolioChart';
import TradeTable from '@/components/TradeTable';
import PositionsList from '@/components/PositionsList';
import ActivityFeed from '@/components/ActivityFeed';
import { formatCurrency, formatPercent } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <ClientLayout>
      <DashboardContent />
    </ClientLayout>
  );
}

function DashboardContent() {
  /* ---- Données live depuis le contexte global ---- */
  const {
    dashboardStats: stats,
    portfolioHistory: portfolio,
    recentTrades: trades,
    positions,
    activities: logs,
    isConnected,
  } = useAppContext();

  /* Écran de chargement tant que pas connecté */
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-accent-green font-mono text-glow-green">
          <pre className="text-xs">{`
> INITIALIZING POLYBOT TERMINAL...
> CONNECTING TO BACKEND............
> WAITING FOR SIGNAL...............
          `}</pre>
          <span className="cursor-blink text-accent-green"> </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ---- Page header — Retro ASCII ---- */}
      <div className="mb-6">
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
        <h1 className="text-xl font-bold tracking-widest text-glow-green font-mono">
          {'>'} DASHBOARD_
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-mono">
          // Real-time overview of AI trading operations
        </p>
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
      </div>

      {/* ---- Stat cards grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(stats.portfolioValue)}
          change={formatPercent(stats.dailyChangePercent)}
          icon={DollarSign}
          variant="green"
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(stats.totalPnL)}
          change={formatPercent(stats.totalPnLPercent)}
          icon={TrendingUp}
          variant={stats.totalPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          icon={Target}
          variant="cyan"
        />
        <StatCard
          label="Total Trades"
          value={stats.totalTrades.toString()}
          icon={Zap}
          variant="amber"
        />
      </div>

      {/* ---- Second row: more stats ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Sharpe Ratio"
          value={stats.sharpeRatio.toFixed(2)}
          icon={Award}
          variant="cyan"
        />
        <StatCard
          label="Max Drawdown"
          value={`-${stats.maxDrawdown}%`}
          icon={Shield}
          variant="red"
        />
        <StatCard
          label="Active Positions"
          value={stats.activePositions.toString()}
          icon={BarChart3}
          variant="green"
        />
        <StatCard
          label="Daily Change"
          value={formatCurrency(stats.dailyChange)}
          change={formatPercent(stats.dailyChangePercent)}
          icon={Activity}
          variant={stats.dailyChange >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* ---- Main content: Chart + Activity ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Portfolio chart */}
        <div className="lg:col-span-2 card p-4">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-green" />
            Portfolio Performance
            <span className="text-xs text-text-muted font-normal">— live</span>
          </h2>
          <PortfolioChart data={portfolio} height={300} />
        </div>

        {/* Activity feed */}
        <div className="card p-4 max-h-[420px] overflow-y-auto">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-cyan" />
            Live Activity
          </h2>
          <ActivityFeed logs={logs} maxItems={10} />
        </div>
      </div>

      {/* ---- Positions ---- */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent-green" />
          Active Positions
        </h2>
        <PositionsList positions={positions} />
      </div>

      {/* ---- Recent Trades ---- */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-amber" />
          Recent Trades
        </h2>
        <TradeTable trades={trades.slice(0, 10)} />
      </div>
    </>
  );
}
