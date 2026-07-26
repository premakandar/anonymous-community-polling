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
  Wallet,
  FileCode2,
  Server,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';
import { useBoardSession } from '../contexts/BoardSessionContext';
import { networkLabel } from '../config';

export function LandingPage() {
  const { config, boardState, status, isOccupied } = useBoardSession();
  const occupied = isOccupied;

  return (
    <div className="min-h-screen w-full bg-[var(--canvas)] text-[var(--ink)]">
      {/* ── Hero ── */}
      <section className="hero-wash relative flex min-h-screen w-full flex-col text-white">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="fade-in pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55"
          aria-hidden
        />

        <header className="relative z-10 flex w-full items-center justify-between px-5 py-5 sm:px-8 lg:px-12 xl:px-16">
          <p className="font-display text-xl tracking-tight sm:text-2xl">PulseBoard</p>
          <div className="flex items-center gap-3">
            <Link to="/board" className="hidden text-sm font-semibold text-white/70 hover:text-white sm:inline">
              Board
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center rounded-[var(--radius)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-teal-50"
            >
              Open app
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full flex-1 flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
            <div className="slide-up">
              <p className="font-display text-[clamp(3.5rem,10vw,7rem)] leading-[0.88] tracking-tight">PulseBoard</p>
              <h1 className="mt-7 max-w-xl text-lg font-medium leading-snug text-white/80 sm:text-xl lg:text-2xl">
                Post a community signal without revealing who you are — ownership stays a private proof.
              </h1>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/board"
                  className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] bg-white px-6 text-base font-semibold text-[var(--ink)] hover:bg-teal-50"
                >
                  Launch board
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#stack"
                  className="inline-flex h-12 items-center rounded-[var(--radius)] border border-white/35 px-6 text-base font-semibold text-white hover:bg-white/10"
                >
                  See the stack
                </a>
              </div>
              <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-white/45">
                {networkLabel(config.networkId).toUpperCase()}
                {status === 'ready' ? ' · Board connected' : ' · Lace + Compact + Midnight.js'}
              </p>
            </div>

            <div
              className="slide-up relative w-full overflow-hidden border border-white/15 bg-black/35 p-8 backdrop-blur-md sm:p-10"
              style={{ animationDelay: '0.12s' }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/85">
                  Live public ledger
                </p>
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/50">
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-teal-300" />
                  On-chain
                </span>
              </div>

              <div className="mt-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Status</p>
                    <p className="mt-2 font-display text-3xl">
                      {boardState ? (occupied ? 'Occupied' : 'Vacant') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Sequence</p>
                    <p className="mt-2 font-display text-3xl tabular-nums">
                      {boardState ? boardState.sequence.toString() : '0'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/15 pt-8">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Message</p>
                  <p className="mt-3 min-h-[4.5rem] font-display text-2xl leading-snug text-white/90">
                    {boardState?.message ?? 'Waiting for the next anonymous community pulse…'}
                  </p>
                </div>

                <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-6">
                  <p className="max-w-[14rem] text-xs leading-relaxed text-white/45">
                    Secret key and author identity never appear on this surface.
                  </p>
                  <p className="font-mono text-[10px] text-white/35">post · takeDown</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy pillars ── */}
      <section className="w-full border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="grid w-full md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Ownership sealed',
              body: 'A local secret key proves you own a post — without publishing who you are.',
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
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)] lg:text-base">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="w-full border-b border-[var(--line)] px-5 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">Flow</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl">From secret to public pulse</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)]">
            One Compact board. One message slot. Zero identity leakage.
          </p>
        </div>

        <div className="relative mt-14 grid gap-10 md:grid-cols-3">
          <div className="flow-line absolute left-[16%] right-[16%] top-7 hidden h-px md:block" aria-hidden />
          {[
            {
              n: '01',
              title: 'Connect Lace',
              body: 'Unlock Lace on the target network. Indexer and proof-server URIs come from Lace or your env.',
            },
            {
              n: '02',
              title: 'Deploy or join',
              body: 'Spin up a fresh board contract or join an existing address from Settings.',
            },
            {
              n: '03',
              title: 'Post with proof',
              body: 'Your secret key is a circuit witness. Only the public message and sequence change.',
            },
          ].map((step) => (
            <div key={step.n} className="relative">
              <p className="font-display text-4xl text-[var(--accent)]">{step.n}</p>
              <h3 className="mt-4 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Full stack ── */}
      <section
        id="stack"
        className="w-full border-b border-[var(--line)] bg-[var(--ink)] px-5 py-20 text-white sm:px-8 lg:px-12 xl:px-16"
      >
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">Full stack</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl">Contract, API, CLI, and console</h2>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            Built as a Midnight workspace — Compact circuits, shared API, Node CLI, and a Lace browser app.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: FileCode2,
              title: 'Compact contract',
              body: 'bboard.compact — public state, message, sequence, owner commitment.',
            },
            {
              icon: Layers,
              title: 'Shared API',
              body: 'Deploy, join, post, and takeDown helpers shared by CLI and UI.',
            },
            {
              icon: Server,
              title: 'CLI + Docker',
              body: 'Standalone / preview / preprod launchers with local proof server.',
            },
            {
              icon: Wallet,
              title: 'PulseBoard UI',
              body: 'Vite + React console with Lace connect, ZK assets, and SaaS routes.',
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-white/15 pt-6">
              <item.icon className="h-5 w-5 text-teal-300" strokeWidth={1.75} />
              <h3 className="mt-5 font-display text-xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy model ── */}
      <section className="w-full border-b border-[var(--line)] bg-[var(--paper)] px-5 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
            Privacy model
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl">
            What the ledger reveals — and what it never will
          </h2>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <Unlock className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="font-display text-2xl">Observers can learn</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              <li className="border-l-2 border-[var(--accent)] pl-4">Whether the board is vacant or occupied</li>
              <li className="border-l-2 border-[var(--accent)] pl-4">The current public message text</li>
              <li className="border-l-2 border-[var(--accent)] pl-4">The sequence counter after each rotation</li>
              <li className="border-l-2 border-[var(--accent)] pl-4">
                That a valid ZK proof was accepted for post / takeDown
              </li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[var(--ink-muted)]" />
              <h3 className="font-display text-2xl">Observers cannot learn</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              <li className="border-l-2 border-[var(--line)] pl-4">The author’s local secret key (circuit witness)</li>
              <li className="border-l-2 border-[var(--line)] pl-4">
                Which Lace wallet controls the board as a public identity
              </li>
              <li className="border-l-2 border-[var(--line)] pl-4">
                Future posts before they are proven and disclosed
              </li>
              <li className="border-l-2 border-[var(--line)] pl-4">
                Private state stored only in the browser / wallet session
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Workspace ── */}
      <section className="w-full px-5 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">Console</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl">One product. Four focused surfaces.</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)]">
            Dashboard, board, history, and settings — each with one job.
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
              <h3 className="mt-5 font-display text-xl group-hover:text-[var(--accent-deep)]">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ink-muted)]">{item.body}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-deep)]">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="hero-wash relative w-full overflow-hidden px-5 py-24 text-white sm:px-8 lg:px-12 xl:px-16">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-display text-4xl sm:text-5xl lg:text-6xl">Ready to post anonymously?</p>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Unlock Lace, start the local proof stack, and open the board console.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/board"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] bg-white px-6 text-base font-semibold text-[var(--ink)] hover:bg-teal-50"
            >
              Open board
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/settings"
              className="inline-flex h-12 items-center rounded-[var(--radius)] border border-white/35 px-6 text-base font-semibold text-white hover:bg-white/10"
            >
              Configure env
            </Link>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-[var(--line)] bg-[var(--paper)] px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xl">PulseBoard</p>
            <p className="mt-2 max-w-md text-sm text-[var(--ink-muted)]">
              Anonymous community polling on Midnight — Compact ZK, Lace wallet, full-stack workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-[var(--accent-deep)]">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link to="/board" className="hover:underline">
              Board
            </Link>
            <Link to="/history" className="hover:underline">
              History
            </Link>
            <Link to="/settings" className="hover:underline">
              Settings
            </Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-[var(--ink-faint)]">
          Midnight Network · Compact · midnight.js · Lace · Anonymous Feedback / Survey
        </p>
      </footer>
    </div>
  );
}
