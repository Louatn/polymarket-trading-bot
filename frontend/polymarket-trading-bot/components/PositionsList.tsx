/* ============================================================
   POSITIONS LIST — Shows active portfolio positions
   
   Displays current open positions with entry price,
   current price, unrealized P&L, and percentage change.
   
   Props:
   - positions: array of Position objects
   ============================================================ */

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Position } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

interface PositionsListProps {
  positions: Position[];
}

export default function PositionsList({ positions }: PositionsListProps) {
  return (
    <div className="space-y-2">
      {positions.map((pos) => {
        const isProfit = pos.unrealizedPnL >= 0;

        return (
          <div
            key={pos.marketId}
            className="card p-4 flex items-center gap-4"
          >
            {/* P&L indicator */}
            <div className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              isProfit ? 'bg-accent-green-dim' : 'bg-accent-red-dim'
            )}>
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-accent-green" />
              ) : (
                <TrendingDown className="h-5 w-5 text-accent-red" />
              )}
            </div>

            {/* Market info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate" title={pos.marketQuestion}>
                {pos.marketQuestion}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn(
                  'text-xs font-bold',
                  pos.side === 'YES' ? 'text-accent-green' : 'text-accent-red'
                )}>
                  {pos.side}
                </span>
                <span className="text-xs text-text-muted">
                  {pos.shares} shares
                </span>
                <span className="text-xs text-text-muted">
                  Entry: ${pos.avgEntryPrice.toFixed(4)}
                </span>
                <span className="text-xs text-text-muted">
                  Now: ${pos.currentPrice.toFixed(4)}
                </span>
              </div>
            </div>

            {/* P&L */}
            <div className="text-right flex-shrink-0">
              <p className={cn(
                'text-sm font-bold font-mono',
                isProfit ? 'text-accent-green' : 'text-accent-red'
              )}>
                {isProfit ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
              </p>
              <p className={cn(
                'text-xs font-mono',
                isProfit ? 'text-accent-green' : 'text-accent-red'
              )}>
                {isProfit ? '+' : ''}{pos.percentChange.toFixed(2)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
