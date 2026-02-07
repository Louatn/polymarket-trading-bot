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

interface SidebarProps {
  isConnected: boolean; // Bot connection status
}

export default function Sidebar({ isConnected }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-surface">
      {/* ---- Logo / Brand ---- */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green-dim">
          <Bot className="h-5 w-5 text-accent-green" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-accent-green text-glow-green">
            POLYBOT
          </h1>
          <p className="text-[10px] tracking-widest text-text-muted uppercase">
            Trading Terminal
          </p>
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
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-accent-green-dim text-accent-green glow-green'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-accent-green' : 'text-text-muted group-hover:text-accent-cyan'
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ---- Bot Status Footer ---- */}
      <div className="border-t border-border px-4 py-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 mb-3">
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-accent-green animate-pulse-dot" />
              <span className="text-xs text-accent-green">Tunnel Active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-accent-red" />
              <span className="text-xs text-accent-red">Disconnected</span>
            </>
          )}
        </div>

        {/* Mode badge */}
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-accent-amber" />
          <span className="text-xs text-accent-amber">Paper Trading</span>
        </div>

        {/* Version */}
        <div className="mt-3 flex items-center gap-2">
          <Terminal className="h-3 w-3 text-text-muted" />
          <span className="text-[10px] text-text-muted font-mono">v2.4.1 • polybot</span>
        </div>
      </div>
    </aside>
  );
}
