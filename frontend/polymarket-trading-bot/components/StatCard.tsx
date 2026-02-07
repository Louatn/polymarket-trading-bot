/* ============================================================
   STAT CARD — Reusable metric card component
   
   Displays a single KPI with icon, value, label, and change.
   Used across the dashboard for key metrics.
   
   Props:
   - label: metric name
   - value: formatted value string
   - change: change value (positive/negative)
   - icon: Lucide icon component
   - variant: color theme (green, cyan, red, amber)
   ============================================================ */

'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  variant?: 'green' | 'cyan' | 'red' | 'amber';
}

/* Color mapping for each variant */
const VARIANT_STYLES = {
  green: {
    iconBg: 'bg-accent-green-dim',
    iconColor: 'text-accent-green',
    changePositive: 'text-accent-green',
  },
  cyan: {
    iconBg: 'bg-accent-cyan-dim',
    iconColor: 'text-accent-cyan',
    changePositive: 'text-accent-cyan',
  },
  red: {
    iconBg: 'bg-accent-red-dim',
    iconColor: 'text-accent-red',
    changePositive: 'text-accent-red',
  },
  amber: {
    iconBg: 'bg-accent-amber-dim',
    iconColor: 'text-accent-amber',
    changePositive: 'text-accent-amber',
  },
};

export default function StatCard({ label, value, change, icon: Icon, variant = 'green' }: StatCardProps) {
  const styles = VARIANT_STYLES[variant];

  /* Determine if the change is positive or negative */
  const isPositive = change ? !change.startsWith('-') : true;

  return (
    <div className="card p-4">
      {/* Retro top bar */}
      <div className="flex items-center gap-1 mb-3 pb-2 border-b border-border">
        <Icon className={cn('h-3.5 w-3.5', styles.iconColor)} />
        <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono">
          {label}
        </span>
        {change && (
          <span
            className={cn(
              'text-[10px] font-mono font-bold ml-auto',
              isPositive ? 'text-accent-green' : 'text-accent-red'
            )}
          >
            [{change}]
          </span>
        )}
      </div>

      {/* Value — big phosphor display */}
      <p className="text-2xl font-bold tracking-tight font-mono text-glow-green">
        {value}
      </p>

      {/* Retro bottom decoration */}
      <p className="mt-2 text-[9px] text-text-muted font-mono">
        {'░'.repeat(20)}
      </p>
    </div>
  );
}
