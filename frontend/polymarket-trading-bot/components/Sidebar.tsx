/* ============================================================
   SIDEBAR — Main navigation component
   
   Hacker-style sidebar with neon green accents.
   Uses lucide-react icons for a modern look.
   
   TO ADD A NEW PAGE:
   1. Add a new entry to the NAV_ITEMS array below
   2. Create the corresponding page in app/<path>/page.tsx
   ============================================================ */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  History,
  MessageSquareText,
  Activity,
  Bot,
  Terminal,
  Wifi,
  WifiOff,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/components/ClientLayout';

/* ---- Navigation items configuration ---- */
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Overview & key metrics',
  },
  {
    label: 'Portfolio',
    href: '/portfolio',
    icon: LineChart,
    description: 'Value charts & positions',
  },
  {
    label: 'Trade History',
    href: '/trades',
    icon: History,
    description: 'All executed trades',
  },
  {
    label: 'Activity Feed',
    href: '/activity',
    icon: Activity,
    description: 'Live system logs',
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: MessageSquareText,
    description: 'Talk to the bot',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { botStatus, isConnected } = useAppContext();

  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-surface">
      {/* ---- Logo / Brand — Retro ASCII art header ---- */}
      <div className="border-b border-border px-4 py-4">
        <pre className="text-[9px] leading-tight text-accent-green text-glow-green font-mono select-none" aria-hidden="true">
{`╔═══════════════════════╗
║  ██▓▒░ POLYBOT ░▒▓██  ║
║   TRADING TERMINAL    ║
╚═══════════════════════╝`}
        </pre>
        <div className="flex items-center gap-2 mt-2">
          <Bot className="h-4 w-4 text-accent-green" />
          <span className="text-[10px] text-text-secondary font-mono">v2.4.1 // ONLINE</span>
        </div>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 border border-transparent',
                isActive
                  ? 'bg-accent-green-dim text-accent-green glow-green border-accent-green/30'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-foreground hover:border-accent-green/10'
              )}
            >
              <span className={cn(
                'text-xs font-mono',
                isActive ? 'text-accent-green' : 'text-text-muted'
              )}>{isActive ? '>' : ' '}</span>
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-accent-green' : 'text-text-muted group-hover:text-accent-green'
                )}
              />
              <span className="font-medium uppercase tracking-wider text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ---- Bot Status Footer — Retro status panel ---- */}
      <div className="border-t border-border px-4 py-4">
        <p className="text-[9px] text-text-muted font-mono mb-2 tracking-wider">── STATUS ──</p>
        {/* Connection status */}
        <div className="flex items-center gap-2 mb-2">
          {isConnected ? (
            <>
              <span className="h-2 w-2 bg-accent-green animate-pulse-dot" />
              <span className="text-xs text-accent-green font-mono">[CONNECTED]</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 bg-accent-red" />
              <span className="text-xs text-accent-red font-mono">[OFFLINE]</span>
            </>
          )}
        </div>

        {/* Mode badge — dynamique depuis le backend */}
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-3 w-3 text-accent-amber" />
          <span className="text-xs text-accent-amber font-mono">[{botStatus.mode} MODE]</span>
        </div>

        {/* Version — dynamique depuis le backend */}
        <div className="mt-3 flex items-center gap-2">
          <Terminal className="h-3 w-3 text-text-muted" />
          <span className="text-[10px] text-text-muted font-mono">{botStatus.version} • polybot</span>
        </div>
      </div>
    </aside>
  );
}
