/* ============================================================
   MARKET TICKER — Horizontal scrolling ticker of markets
   
   Displays live market prices in a scrolling ticker bar
   at the top of the page, stock-ticker style.
   
   Props:
   - markets: array of Market objects
   ============================================================ */

'use client';

import { useAppContext } from '@/components/ClientLayout';

export default function MarketTicker() {
  const { markets } = useAppContext();

  /* Double the items for seamless infinite scroll effect */
  const doubled = [...markets, ...markets];

  /* Rien à afficher si aucun marché reçu */
  if (markets.length === 0) {
    return (
      <div className="w-full overflow-hidden border-b border-border bg-surface py-1.5">
        <div className="text-center text-xs text-text-muted font-mono py-0.5">
          ░░░ EN ATTENTE DES DONNÉES MARCHÉ... ░░░
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border-b border-border bg-surface py-1.5">
      {/* Retro ticker decorations */}
      <div className="flex animate-[scroll_30s_linear_infinite] gap-6 whitespace-nowrap font-mono">
        {doubled.map((market, i) => {
          return (
            <div key={`${market.id}_${i}`} className="flex items-center gap-1.5 flex-shrink-0">
              {/* Separator */}
              <span className="text-text-muted text-[10px]">│</span>

              {/* Market name (truncated) */}
              <span className="text-[11px] text-text-secondary max-w-[160px] truncate">
                {market.question}
              </span>

              {/* Price */}
              <span className="text-[11px] font-bold text-foreground">
                {(market.currentPrice * 100).toFixed(1)}¢
              </span>

              {/* Volume if available */}
              {market.volume24h > 0 && (
                <span className="text-[10px] text-text-muted">
                  Vol: ${(market.volume24h / 1000).toFixed(0)}K
                </span>
              )}
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
