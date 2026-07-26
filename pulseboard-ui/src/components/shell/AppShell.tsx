import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Settings,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { cn, shortAddr } from '../../lib/utils';
import { Badge } from '../ui/surface';
import { useBoardSession } from '../../contexts/BoardSessionContext';
import { networkLabel, LACE_STORE_URL } from '../../config';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/board', label: 'Board', icon: MessageSquareText },
  { href: '/history', label: 'History', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

function SessionChip() {
  const { status, api, error } = useBoardSession();

  if (status === 'connecting') return <Badge tone="warn">Connecting…</Badge>;
  if (status === 'ready' && api) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="ok">Board live</Badge>
        <code className="hidden max-w-[140px] truncate font-mono text-[11px] text-[var(--ink-muted)] sm:inline">
          {shortAddr(api.deployedContractAddress)}
        </code>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <span
        className="hidden max-w-[220px] truncate text-xs text-[var(--danger)] lg:inline"
        title={error ?? ''}
      >
        {error ?? 'Connection failed'}
      </span>
    );
  }
  return <Badge tone="neutral">No board</Badge>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { config } = useBoardSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[var(--canvas)]">
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[var(--shell-w)] flex-col border-r border-[var(--line)] bg-[var(--paper)] transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-[var(--line)] px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-white">
              <Radio className="h-4 w-4" />
            </span>
            <span className="font-display text-lg">PulseBoard</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-deep)]'
                      : 'text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Network
          </p>
          <p className="mt-1.5 text-sm font-medium">{networkLabel(config.networkId)}</p>
          <a
            href={LACE_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs font-semibold text-[var(--accent-deep)] hover:underline"
          >
            Lace wallet
          </a>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[var(--shell-w)]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 backdrop-blur-md sm:px-8">
          <button
            className="rounded-[var(--radius)] p-2 text-[var(--ink-muted)] hover:bg-[var(--surface)] lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge tone="accent">Midnight ZK</Badge>
            <span className="text-sm text-[var(--ink-faint)]">Anonymous community board</span>
          </div>
          <div className="ml-auto">
            <SessionChip />
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-8 sm:px-8 lg:px-12 xl:px-16">{children}</main>
      </div>
    </div>
  );
}
