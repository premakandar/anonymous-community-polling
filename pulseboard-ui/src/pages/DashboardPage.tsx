import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PageHeader, Surface, Badge } from '../components/ui/surface';
import { Button } from '../components/ui/button';
import { useBoardSession } from '../contexts/BoardSessionContext';
import { networkLabel } from '../config';
import { shortAddr } from '../lib/utils';

export function DashboardPage() {
  const { config, status, api, boardState, error, deploy, join, isVacant, isOccupied } = useBoardSession();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview for anonymous community posts on Midnight."
        action={
          status !== 'ready' ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={deploy}>
                Deploy board
              </Button>
              {config.contractAddress ? (
                <Button size="sm" variant="outline" onClick={() => join(config.contractAddress!)}>
                  Join saved
                </Button>
              ) : null}
            </div>
          ) : (
            <Link
              to="/board"
              className="inline-flex h-9 items-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-semibold hover:bg-[var(--surface)]"
            >
              Open board
            </Link>
          )
        }
      />

      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Surface>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Network</p>
          <p className="mt-2 font-display text-xl">{networkLabel(config.networkId)}</p>
        </Surface>
        <Surface>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Session</p>
          <p className="mt-2 font-display text-xl capitalize">{status}</p>
          <p className="mt-1 truncate text-xs text-[var(--ink-muted)]">
            {api ? shortAddr(api.deployedContractAddress, 14, 8) : 'No contract attached'}
          </p>
        </Surface>
        <Surface>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Board</p>
          <p className="mt-2 font-display text-xl">{isVacant ? 'Vacant' : isOccupied ? 'Occupied' : '—'}</p>
          {boardState?.isOwner ? <Badge tone="accent">You are owner</Badge> : null}
        </Surface>
        <Surface>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Sequence</p>
          <p className="mt-2 font-display text-xl">{boardState ? boardState.sequence.toString() : '—'}</p>
        </Surface>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <Surface>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg">Current public message</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {boardState?.message ??
                  'When the board is occupied, the public message appears here. The author secret never does.'}
              </p>
            </div>
            <Badge tone={isOccupied ? 'ok' : 'neutral'}>{isOccupied ? 'Live' : 'Empty'}</Badge>
          </div>
          <Link
            to="/board"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-deep)] hover:underline"
          >
            Manage board <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Surface>
        <Surface>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg">Contract</h2>
              <p className="mt-1 break-all font-mono text-xs text-[var(--ink-muted)]">
                {api?.deployedContractAddress ?? config.contractAddress ?? 'Not set — deploy, join, or open Settings'}
              </p>
            </div>
            <Badge tone="neutral">Config</Badge>
          </div>
          <Link
            to="/settings"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-deep)] hover:underline"
          >
            Open settings <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Surface>
      </div>
    </div>
  );
}
