import { Link } from 'react-router-dom';
import {
  ArrowRight,
  EyeOff,
  Shield,
  BarChart3,
  MessageSquareText,
  LayoutDashboard,
  ScrollText,
  Settings,
} from 'lucide-react';
import { useBoardSession } from '../contexts/BoardSessionContext';
import { networkLabel } from '../config';

export function LandingPage() {
  const { config, boardState, status, api } = useBoardSession();

  return (
    <div className="min-h-screen w-full bg-[var(--canvas)] text-[var(--ink)]">
      <section className="hero-wash relative flex min-h-screen w-full flex-col text-white">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="fade-in pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/50"
          aria-hidden
        />

        <header className="relative z-10 flex w-full items-center justify-between px-5 py-5 sm:px-8 lg:px-12 xl:px-16">
          <p className="font-display text-xl tracking-tight sm:text-2xl">PulseBoard</p>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center rounded-[var(--radius)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-teal-50"
          >
            Open app
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full flex-1 flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-20">
            <div className="slide-up">
              <p className="font-display text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.9] tracking-tight">
                PulseBoard
              </p>
              <h1 className="mt-7 max-w-xl text-lg font-medium leading-snug text-white/80 sm:text-xl lg:text-2xl">
                Post a community signal without revealing who you are — ownership stays a private
                proof.
              </h1>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/board"
                  className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] bg-white px-6 text-base font-semibold text-[var(--ink)] hover:bg-teal-50"
                >
                  Open board
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex h-12 items-center rounded-[var(--radius)] border border-white/35 px-6 text-base font-semibold text-white hover:bg-white/10"
                >
                  Dashboard
                </Link>
              </div>
              <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-white/45">
                {networkLabel(config.networkId).toUpperCase()}
                {status === 'ready' ? ' · Board connected' : ''}
              </p>
            </div>

            <div
              className="slide-up w-full border border-white/15 bg-black/30 p-8 backdrop-blur-md sm:p-10"
              style={{ animationDelay: '0.12s' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/85">
                Public ledger preview
              </p>
              <div className="mt-10 space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Status</p>
                  <p className="mt-2 font-display text-3xl">
                    {boardState
                      ? boardState.state === 0
                        ? 'Vacant'
                        : 'Occupied'
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Message</p>
                  <p className="mt-2 line-clamp-3 font-display text-xl text-white/90">
                    {boardState?.message ?? 'No public post yet'}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Sequence</p>
                    <p className="mt-2 font-display text-5xl tabular-nums leading-none">
                      {boardState ? boardState.sequence.toString() : '0'}
                    </p>
                  </div>
                  <p className="max-w-[9rem] pb-1 text-right text-xs leading-relaxed text-white/45">
                    Secret key & identity never appear here.
                    {api ? '' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="grid w-full md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Ownership sealed',
              body: 'Your local secret key proves you own a post — without publishing who you are.',
            },
            {
              icon: EyeOff,
              title: 'Identity private',
              body: 'Observers see the message and sequence, not the wallet that authored it.',
            },
            {
              icon: BarChart3,
              title: 'Public accountability',
              body: 'Vacant/occupied status and the current message stay auditable on-chain.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border-[var(--line)] px-6 py-16 md:border-r md:px-10 lg:px-14 md:last:border-r-0"
            >
              <item.icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
              <h2 className="mt-5 font-display text-2xl lg:text-3xl">{item.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)] lg:text-base">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full px-5 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
            Workspace
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl">
            One console. Four jobs.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)]">
            Dashboard, live board, history, and settings — structured like a product, not a demo
            page.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              to: '/dashboard',
              icon: LayoutDashboard,
              title: 'Dashboard',
              body: 'Network, board status, sequence, and ownership at a glance.',
            },
            {
              to: '/board',
              icon: MessageSquareText,
              title: 'Board',
              body: 'Deploy or join, then post or take down with a ZK proof.',
            },
            {
              to: '/history',
              icon: ScrollText,
              title: 'History',
              body: 'Local trail of deploy, join, post, and take-down attempts.',
            },
            {
              to: '/settings',
              icon: Settings,
              title: 'Settings',
              body: 'Contract address override and environment endpoints.',
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col bg-[var(--paper)] p-7 transition-colors hover:bg-[var(--accent-soft)] sm:p-8"
            >
              <item.icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
              <h3 className="mt-5 font-display text-xl group-hover:text-[var(--accent-deep)]">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                {item.body}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-deep)]">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="w-full border-t border-[var(--line)] bg-[var(--paper)] px-5 py-8 text-center text-xs text-[var(--ink-faint)] sm:px-8">
        Anonymous Community Polling · Midnight Network · Compact ZK · Lace
      </footer>
    </div>
  );
}
