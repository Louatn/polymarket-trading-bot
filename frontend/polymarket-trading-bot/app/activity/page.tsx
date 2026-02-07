/* ============================================================
   ACTIVITY PAGE — Full activity feed / system logs
   
   Displays a detailed, filterable activity feed showing:
   - Trade executions
   - System alerts
   - AI analysis updates
   - Connection events
   
   Styled like a terminal/console output for the hacker feel.
   
   In production, data comes from the tunnel.
   ============================================================ */

'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Cpu,
  Filter,
} from 'lucide-react';
import ClientLayout from '@/components/ClientLayout';
import ActivityFeed from '@/components/ActivityFeed';
import { generateActivityLogs } from '@/lib/simulator';
import { ActivityLog } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Filter options for activity types */
type ActivityFilter = 'ALL' | 'TRADE' | 'ALERT' | 'SYSTEM' | 'ANALYSIS';

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>('ALL');

  /* Initialize with historical logs */
  useEffect(() => {
    setLogs(generateActivityLogs(100));
  }, []);

  /* Simulate new logs arriving */
  useEffect(() => {
    const interval = setInterval(() => {
      const newLogs = generateActivityLogs(1);
      setLogs((prev) => [...newLogs, ...prev].slice(0, 200));
    }, 8000); // New log every 8 seconds

    return () => clearInterval(interval);
  }, []);

  /* Apply type filter */
  const filteredLogs = filter === 'ALL'
    ? logs
    : logs.filter((l) => l.type === filter);

  /* Filter badge config */
  const filterConfig: { value: ActivityFilter; icon: any; label: string }[] = [
    { value: 'ALL', icon: Activity, label: 'All' },
    { value: 'TRADE', icon: ArrowRightLeft, label: 'Trades' },
    { value: 'ALERT', icon: AlertTriangle, label: 'Alerts' },
    { value: 'SYSTEM', icon: Cpu, label: 'System' },
    { value: 'ANALYSIS', icon: BarChart3, label: 'Analysis' },
  ];

  return (
    <ClientLayout>
      {/* ---- Page header ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          <span className="text-accent-green">$</span> Activity Feed
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time system logs and bot activity monitor
        </p>
      </div>

      {/* ---- Filter bar ---- */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-text-muted" />
          {filterConfig.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors',
                filter === value
                  ? 'bg-accent-green-dim text-accent-green'
                  : 'text-text-muted hover:text-foreground hover:bg-surface-hover'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}

          {/* Log count */}
          <span className="ml-auto text-xs text-text-muted font-mono">
            {filteredLogs.length} entries
          </span>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-green animate-pulse-dot" />
            <span className="text-xs text-accent-green font-mono">LIVE</span>
          </div>
        </div>
      </div>

      {/* ---- Terminal-style log container ---- */}
      <div className="card p-4">
        {/* Terminal header bar */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <span className="h-3 w-3 rounded-full bg-accent-red" />
          <span className="h-3 w-3 rounded-full bg-accent-amber" />
          <span className="h-3 w-3 rounded-full bg-accent-green" />
          <span className="ml-3 text-xs text-text-muted font-mono">
            polybot@terminal ~ /var/log/activity
          </span>
        </div>

        {/* Scrollable log feed */}
        <div className="max-h-[600px] overflow-y-auto">
          <ActivityFeed logs={filteredLogs} maxItems={100} />
        </div>
      </div>
    </ClientLayout>
  );
}
