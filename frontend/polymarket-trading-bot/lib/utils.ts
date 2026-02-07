/* ============================================================
   UTILS — Shared utility/helper functions
   
   Formatting, date helpers, and other shared logic.
   ============================================================ */

import { format, formatDistanceToNow } from 'date-fns';

/* ---- Format USD currency ---- */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ---- Format percentage ---- */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/* ---- Format large numbers (e.g., 1.2M, 340K) ---- */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

/* ---- Format date/time ---- */
export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'MMM dd, yyyy HH:mm:ss');
}

/* ---- Format short date ---- */
export function formatDate(iso: string): string {
  return format(new Date(iso), 'MMM dd');
}

/* ---- Format time only ---- */
export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm:ss');
}

/* ---- Relative time (e.g. "3 minutes ago") ---- */
export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

/* ---- Format uptime from seconds ---- */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/* ---- Classnames helper (simple) ---- */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
