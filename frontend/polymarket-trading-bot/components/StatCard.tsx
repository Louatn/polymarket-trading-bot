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
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', styles.iconBg)}>
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>

        {/* Change indicator */}
        {change && (
          <span
            className={cn(
              'text-xs font-mono font-medium px-2 py-0.5 rounded',
              isPositive
                ? 'text-accent-green bg-accent-green-dim'
                : 'text-accent-red bg-accent-red-dim'
            )}
          >
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground font-mono">
        {value}
      </p>

      {/* Label */}
      <p className="mt-1 text-xs text-text-muted uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
