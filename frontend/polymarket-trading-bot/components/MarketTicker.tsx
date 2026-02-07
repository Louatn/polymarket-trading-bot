/* ============================================================
   MARKET TICKER — Horizontal scrolling ticker of markets
   
   Displays live market prices in a scrolling ticker bar
   at the top of the page, stock-ticker style.
   
   Props:
   - markets: array of Market objects
   ============================================================ */

'use client';

import { Market } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MarketTickerProps {
  markets: Market[];
}

export default function MarketTicker({ markets }: MarketTickerProps) {
  /* Double the items for seamless infinite scroll effect */
  const doubled = [...markets, ...markets];

  return (
    <div className="w-full overflow-hidden border-b border-border bg-surface py-2">
      <div className="flex animate-[scroll_30s_linear_infinite] gap-8 whitespace-nowrap">
        {doubled.map((market, i) => {
          /* Simulate a random price change for visual effect */
          const changePercent = ((Math.random() - 0.45) * 10).toFixed(2);
          const isUp = parseFloat(changePercent) >= 0;

          return (
            <div key={`${market.id}_${i}`} className="flex items-center gap-2 flex-shrink-0">
              {/* Category dot */}
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                market.category === 'crypto' ? 'bg-accent-amber' :
                market.category === 'politics' ? 'bg-accent-cyan' :
                market.category === 'sports' ? 'bg-accent-purple' :
                'bg-accent-green'
              )} />

              {/* Market name (truncated) */}
              <span className="text-xs text-text-secondary max-w-[180px] truncate">
                {market.question}
              </span>

              {/* Price */}
              <span className="text-xs font-bold font-mono text-foreground">
                {(market.currentPrice * 100).toFixed(1)}¢
              </span>

              {/* Change */}
              <span className={cn(
                'text-[11px] font-mono font-bold',
                isUp ? 'text-accent-green' : 'text-accent-red'
              )}>
                {isUp ? '▲' : '▼'} {Math.abs(parseFloat(changePercent))}%
              </span>
            </div>
          );
        })}
      </div>

      {/* CSS animation for scroll */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
