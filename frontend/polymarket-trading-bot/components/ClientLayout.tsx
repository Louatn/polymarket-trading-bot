/* ============================================================
   CLIENT LAYOUT — Client-side wrapper with sidebar + ticker
   
   This component manages the client-side state including:
   - Bot connection status (simulated)
   - Sidebar rendering
   - Market ticker
   - Main content wrapper with proper spacing
   
   It wraps all page content and provides the app shell.
   ============================================================ */

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MarketTicker from '@/components/MarketTicker';
import { SIMULATED_MARKETS } from '@/lib/simulator';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  /* Simulated connection status — toggles occasionally for realism */
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    /* Simulate occasional connection blips */
    const interval = setInterval(() => {
      // 5% chance of disconnect, reconnects after 3 seconds
      if (Math.random() < 0.05) {
        setIsConnected(false);
        setTimeout(() => setIsConnected(true), 3000);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isConnected={isConnected} />

      {/* Main content area — offset by sidebar width (256px = w-64) */}
      <div className="ml-64">
        {/* Market ticker at the top */}
        <MarketTicker markets={SIMULATED_MARKETS} />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
