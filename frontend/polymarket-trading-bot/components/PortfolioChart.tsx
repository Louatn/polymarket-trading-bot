/* ============================================================
   PORTFOLIO CHART — Recharts area chart for portfolio value
   
   Displays portfolio value over time with a glowing green area.
   Responsive and auto-updates with new data.
   
   Props:
   - data: array of PortfolioSnapshot
   - height: chart height in px (default 350)
   ============================================================ */

'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PortfolioSnapshot } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PortfolioChartProps {
  data: PortfolioSnapshot[];
  height?: number;
}

/* Custom tooltip component — hacker style */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="card p-3 border-accent-green/30">
      <p className="text-[10px] text-text-muted mb-1 font-mono">─ {label} ─</p>
      <p className="text-sm font-bold text-accent-green font-mono text-glow-green">
        {formatCurrency(payload[0].value)}
      </p>
      {payload[0].payload.dailyPnL !== undefined && (
        <p className={`text-xs font-mono mt-1 ${payload[0].payload.dailyPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
          Daily: {formatCurrency(payload[0].payload.dailyPnL)}
        </p>
      )}
    </div>
  );
}

export default function PortfolioChart({ data, height = 350 }: PortfolioChartProps) {
  /* Format data for the chart — use short date as label */
  const chartData = data.map((snapshot) => ({
    ...snapshot,
    date: formatDate(snapshot.timestamp),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {/* Grid */}
        <CartesianGrid strokeDasharray="3 3" stroke="#0f2f0f" />

        {/* X axis — dates */}
        <XAxis
          dataKey="date"
          stroke="#00802080"
          tick={{ fill: '#00802080', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#0f2f0f' }}
        />

        {/* Y axis — dollar values */}
        <YAxis
          stroke="#00802080"
          tick={{ fill: '#00802080', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#0f2f0f' }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
        />

        {/* Tooltip */}
        <Tooltip content={<CustomTooltip />} />

        {/* Gradient definition for the area fill */}
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff41" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#00ff41" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Main area — green phosphor glow */}
        <Area
          type="monotone"
          dataKey="totalValue"
          stroke="#00ff41"
          strokeWidth={2}
          fill="url(#portfolioGradient)"
          dot={false}
          activeDot={{
            r: 4,
            stroke: '#00ff41',
            strokeWidth: 2,
            fill: '#020a02',
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
