/* ============================================================
   TRADE TABLE — Sortable, filterable table of trade history
   
   Displays all trades executed by the bot with full details:
   action, market, price, quantity, P&L, confidence, reasoning.
   
   Features:
   - Filter by action type (BUY/SELL/HOLD)
   - Color-coded rows by action type
   - Expandable reasoning column
   ============================================================ */

'use client';

import { useState } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  PauseCircle,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Trade, TradeAction } from '@/lib/types';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';

interface TradeTableProps {
  trades: Trade[];
}

/* Action badge component */
function ActionBadge({ action }: { action: TradeAction }) {
  const config = {
    BUY: { icon: ArrowUpCircle, color: 'text-accent-green bg-accent-green-dim', label: 'BUY' },
    SELL: { icon: ArrowDownCircle, color: 'text-accent-red bg-accent-red-dim', label: 'SELL' },
    HOLD: { icon: PauseCircle, color: 'text-accent-amber bg-accent-amber-dim', label: 'HOLD' },
  };

  const { icon: Icon, color, label } = config[action];

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold', color)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export default function TradeTable({ trades }: TradeTableProps) {
  const [filter, setFilter] = useState<TradeAction | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Apply filter */
  const filtered = filter === 'ALL' ? trades : trades.filter((t) => t.action === filter);

  return (
    <div>
      {/* ---- Filter bar ---- */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-text-muted" />
        {(['ALL', 'BUY', 'SELL', 'HOLD'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors',
              filter === f
                ? 'bg-accent-green-dim text-accent-green'
                : 'bg-surface text-text-muted hover:text-foreground hover:bg-surface-hover'
            )}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted font-mono">
          {filtered.length} trades
        </span>
      </div>

      {/* ---- Table ---- */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Market</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Side</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Conf.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">P&L</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trade) => (
              <>
                <tr
                  key={trade.id}
                  className="border-b border-border hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                >
                  <td className="px-4 py-3 text-xs text-text-secondary font-mono whitespace-nowrap">
                    {formatDateTime(trade.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={trade.action} />
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground max-w-[200px] truncate" title={trade.marketQuestion}>
                    {trade.marketQuestion}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-bold',
                      trade.side === 'YES' ? 'text-accent-green' : 'text-accent-red'
                    )}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-foreground">
                    {trade.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-foreground">
                    ${trade.price.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-foreground">
                    {formatCurrency(trade.totalCost)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-xs font-mono font-bold',
                      trade.confidence >= 75 ? 'text-accent-green' :
                      trade.confidence >= 50 ? 'text-accent-amber' :
                      'text-accent-red'
                    )}>
                      {trade.confidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trade.profitLoss !== undefined ? (
                      <span className={cn(
                        'text-xs font-mono font-bold',
                        trade.profitLoss >= 0 ? 'text-accent-green' : 'text-accent-red'
                      )}>
                        {formatCurrency(trade.profitLoss)}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {expandedId === trade.id ? (
                      <ChevronDown className="h-4 w-4 text-accent-green mx-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-text-muted mx-auto" />
                    )}
                  </td>
                </tr>

                {/* Expanded reasoning row */}
                {expandedId === trade.id && (
                  <tr key={`${trade.id}_detail`} className="bg-surface">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-accent-cyan-dim flex items-center justify-center">
                          <span className="text-[10px] text-accent-cyan font-bold">AI</span>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                            AI Reasoning
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {trade.reasoning}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
