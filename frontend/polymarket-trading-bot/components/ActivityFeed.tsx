/* ============================================================
   ACTIVITY FEED — Live scrolling log of bot activity
   
   Displays real-time system logs, trade notifications,
   alerts, and analysis updates in a terminal-style feed.
   
   Color-coded by severity:
   - info:    cyan
   - success: green
   - warning: amber
   - error:   red
   
   Props:
   - logs: array of ActivityLog entries
   - maxItems: maximum items to display (default 50)
   ============================================================ */

'use client';

import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Activity,
  BarChart3,
  Cpu,
  ArrowRightLeft,
} from 'lucide-react';
import { ActivityLog } from '@/lib/types';
import { formatTime, cn } from '@/lib/utils';

interface ActivityFeedProps {
  logs: ActivityLog[];
  maxItems?: number;
}

/* Icon and color mapping by log type */
const TYPE_CONFIG: Record<ActivityLog['type'], { icon: any; label: string }> = {
  TRADE: { icon: ArrowRightLeft, label: 'TRADE' },
  ALERT: { icon: AlertTriangle, label: 'ALERT' },
  SYSTEM: { icon: Cpu, label: 'SYS' },
  ANALYSIS: { icon: BarChart3, label: 'SCAN' },
};

const SEVERITY_CONFIG: Record<ActivityLog['severity'], { color: string; bgColor: string }> = {
  info: { color: 'text-accent-cyan', bgColor: 'bg-accent-cyan-dim' },
  success: { color: 'text-accent-green', bgColor: 'bg-accent-green-dim' },
  warning: { color: 'text-accent-amber', bgColor: 'bg-accent-amber-dim' },
  error: { color: 'text-accent-red', bgColor: 'bg-accent-red-dim' },
};

export default function ActivityFeed({ logs, maxItems = 50 }: ActivityFeedProps) {
  const displayLogs = logs.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {displayLogs.map((log) => {
        const typeConfig = TYPE_CONFIG[log.type];
        const sevConfig = SEVERITY_CONFIG[log.severity];
        const Icon = typeConfig.icon;

        return (
          <div
            key={log.id}
            className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-surface-hover transition-colors group"
          >
            {/* Timestamp */}
            <span className="flex-shrink-0 text-[11px] text-text-muted font-mono mt-0.5 w-16">
              {formatTime(log.timestamp)}
            </span>

            {/* Type badge */}
            <span className={cn(
              'flex-shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider',
              sevConfig.bgColor, sevConfig.color
            )}>
              <Icon className="h-3 w-3" />
              {typeConfig.label}
            </span>

            {/* Message */}
            <p className="text-xs text-text-secondary group-hover:text-foreground transition-colors leading-relaxed">
              {log.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
