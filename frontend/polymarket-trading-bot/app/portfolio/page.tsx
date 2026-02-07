/* ============================================================
   PORTFOLIO PAGE — Detailed portfolio view
   
   Features:
   - Full-size portfolio value chart (30 days + 90 days)
   - Cash vs invested breakdown
   - P&L over time chart
   - Complete positions list
   
   In production, data comes from the tunnel.
   ============================================================ */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  TrendingUp,
  Wallet,
  PieChart,
  ArrowUpDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ClientLayout from '@/components/ClientLayout';
import PortfolioChart from '@/components/PortfolioChart';
import PositionsList from '@/components/PositionsList';
import StatCard from '@/components/StatCard';
import {
  generatePortfolioHistory,
  generatePositions,
  generateDashboardStats,
} from '@/lib/simulator';
import { PortfolioSnapshot, Position, DashboardStats } from '@/lib/types';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';

/* Time range options */
type TimeRange = '7d' | '30d' | '90d';

export default function PortfolioPage() {
  const [range, setRange] = useState<TimeRange>('30d');
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  /* Generate data based on selected range */
  useEffect(() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    setPortfolio(generatePortfolioHistory(days));
    setPositions(generatePositions());
    setStats(generateDashboardStats());
  }, [range]);

  if (!stats) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-accent-green animate-pulse font-mono">
            Loading portfolio data...
          </div>
        </div>
      </ClientLayout>
    );
  }

  /* Prepare P&L bar chart data */
  const pnlData = portfolio.map((s) => ({
    date: formatDate(s.timestamp),
    pnl: s.dailyPnL,
  }));

  return (
    <ClientLayout>
      {/* ---- Page header ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          <span className="text-accent-green">$</span> Portfolio
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Detailed portfolio analysis and position management
        </p>
      </div>

      {/* ---- Stats row ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Value"
          value={formatCurrency(stats.portfolioValue)}
          change={formatPercent(stats.dailyChangePercent)}
          icon={Wallet}
          variant="green"
        />
        <StatCard
          label="Invested"
          value={formatCurrency(stats.portfolioValue * 0.65)}
          icon={PieChart}
          variant="cyan"
        />
        <StatCard
          label="Available Cash"
          value={formatCurrency(stats.portfolioValue * 0.35)}
          icon={ArrowUpDown}
          variant="amber"
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(stats.totalPnL)}
          change={formatPercent(stats.totalPnLPercent)}
          icon={TrendingUp}
          variant={stats.totalPnL >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* ---- Main chart with time range selector ---- */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <LineChart className="h-4 w-4 text-accent-green" />
            Portfolio Value Over Time
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

        <PortfolioChart data={portfolio} height={400} />
      </div>

      {/* ---- Daily P&L bar chart ---- */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent-cyan" />
          Daily P&L
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={pnlData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="date"
              stroke="#666680"
              tick={{ fill: '#666680', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1e1e2e' }}
            />
            <YAxis
              stroke="#666680"
              tick={{ fill: '#666680', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1e1e2e' }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: '#12121a',
                border: '1px solid #1e1e2e',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '12px',
              }}
              formatter={(value: any) => [formatCurrency(Number(value ?? 0)), 'P&L']}
            />
            <Bar
              dataKey="pnl"
              fill="#00ff88"
              radius={[4, 4, 0, 0]}
              // Color bars based on positive/negative
              // (Recharts doesn't natively support per-bar colors easily,
              //  so we use a custom shape)
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Active Positions ---- */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-accent-green" />
          Active Positions
          <span className="text-xs text-text-muted font-normal">— {positions.length} open</span>
        </h2>
        <PositionsList positions={positions} />
      </div>
    </ClientLayout>
  );
}
