/* ============================================================
   PORTFOLIO PAGE — Detailed portfolio view
   
   Features:
   - Full-size portfolio value chart
   - Cash vs invested breakdown
   - P&L over time chart
   - Complete positions list
   
   Données live via useAppContext() (polling backend Python).
   ============================================================ */

'use client';

import { useState } from 'react';
import {
  LineChart,
  TrendingUp,
  Wallet,
  PieChart,
  ArrowUpDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ClientLayout from '@/components/ClientLayout';
import { useAppContext } from '@/components/ClientLayout';
import PortfolioChart from '@/components/PortfolioChart';
import PositionsList from '@/components/PositionsList';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';

/* Time range options — filtre côté client sur l'historique */
type TimeRange = '7d' | '30d' | '90d';

export default function PortfolioPage() {
  return (
    <ClientLayout>
      <PortfolioContent />
    </ClientLayout>
  );
}

function PortfolioContent() {
  const [range, setRange] = useState<TimeRange>('30d');
  const {
    dashboardStats: stats,
    portfolioHistory,
    portfolio,
    positions,
    isConnected,
  } = useAppContext();

  /* Filtrer l'historique selon la plage sélectionnée */
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const filteredHistory = portfolioHistory.slice(-days);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-accent-green animate-pulse font-mono">
          En attente de connexion au backend...
        </div>
      </div>
    );
  }

  /* Prepare P&L bar chart data */
  const pnlData = filteredHistory.map((s) => ({
    date: formatDate(s.timestamp),
    pnl: s.dailyPnL,
  }));

  return (
    <>
      {/* ---- Page header — Retro ASCII ---- */}
      <div className="mb-6">
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
        <h1 className="text-xl font-bold tracking-widest text-glow-green font-mono">
          {'>'} PORTFOLIO_
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-mono">
          // Detailed portfolio analysis and position management
        </p>
        <pre className="text-xs text-text-muted font-mono select-none">────────────────────────────────────────</pre>
      </div>

      {/* ---- Stats row ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Value"
          value={formatCurrency(portfolio.totalValue)}
          change={formatPercent(stats.dailyChangePercent)}
          icon={Wallet}
          variant="green"
        />
        <StatCard
          label="Invested"
          value={formatCurrency(portfolio.investedValue)}
          icon={PieChart}
          variant="cyan"
        />
        <StatCard
          label="Available Cash"
          value={formatCurrency(portfolio.cashBalance)}
          icon={ArrowUpDown}
          variant="amber"
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(portfolio.totalPnL)}
          change={formatPercent(stats.totalPnLPercent)}
          icon={TrendingUp}
          variant={portfolio.totalPnL >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* ---- Main chart with time range selector ---- */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-2 font-mono">
            <span className="text-text-muted">[</span>
            <LineChart className="h-3.5 w-3.5 text-accent-green" />
            VALUE_CHART
            <span className="text-text-muted">]</span>
          </h2>

          {/* Time range buttons */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors',
                  range === r
                    ? 'bg-accent-green-dim text-accent-green'
                    : 'bg-surface text-text-muted hover:text-foreground hover:bg-surface-hover'
                )}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <PortfolioChart data={filteredHistory} height={400} />
        ) : (
          <div className="flex items-center justify-center h-[400px] text-text-muted font-mono text-xs">
            ░░░ EN ATTENTE DE DONNÉES HISTORIQUES... ░░░
          </div>
        )}
      </div>

      {/* ---- Daily P&L bar chart ---- */}
      {pnlData.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 font-mono">
            <span className="text-text-muted">[</span>
            <TrendingUp className="h-3.5 w-3.5 text-accent-cyan" />
            DAILY_PNL
            <span className="text-text-muted">]</span>
          </h2>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pnlData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0f2f0f" />
              <XAxis
                dataKey="date"
                stroke="#00802080"
                tick={{ fill: '#00802080', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#0f2f0f' }}
              />
              <YAxis
                stroke="#00802080"
                tick={{ fill: '#00802080', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#0f2f0f' }}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#0a140a',
                  border: '1px solid #0f2f0f',
                  borderRadius: '0px',
                  color: '#00ff41',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(value: any) => [formatCurrency(Number(value ?? 0)), 'P&L']}
              />
              <Bar
                dataKey="pnl"
                fill="#00ff41"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ---- Active Positions ---- */}
      <div>
        <h2 className="text-xs font-bold text-foreground mb-4 flex items-center gap-2 font-mono">
          <span className="text-text-muted">[</span>
          <PieChart className="h-3.5 w-3.5 text-accent-green" />
          POSITIONS
          <span className="text-text-muted">]</span>
          <span className="text-[10px] text-text-muted font-normal">// {positions.length} open</span>
        </h2>
        <PositionsList positions={positions} />
      </div>
    </>
  );
}
