import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader, Surface, Badge, Input, TextArea } from '../components/ui/surface';
import { Button } from '../components/ui/button';
import { useBoardSession } from '../contexts/BoardSessionContext';

export function BoardPage() {
  const {
    config,
    status,
    api,
    boardState,
    error,
    busy,
    actionError,
    deploy,
    join,
    post,
    takeDown,
    isVacant,
    isOccupied,
  } = useBoardSession();

  const [joinAddress, setJoinAddress] = useState(config.contractAddress ?? '');
  const [message, setMessage] = useState('');
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  const onPost = async () => {
    setLocalMsg(null);
    try {
      await post(message.trim());
      setMessage('');
      setLocalMsg('Posted. Only the public message and sequence change on-chain.');
    } catch {
      /* actionError set in context */
    }
  };

  const onTakeDown = async () => {
    setLocalMsg(null);
    try {
      await takeDown();
      setLocalMsg('Message taken down. Board is vacant again.');
    } catch {
      /* actionError set in context */
    }
  };

  return (
    <div>
      <PageHeader
        title="Board"
        description="Deploy or join a PulseBoard, then post or take down with a zero-knowledge proof. Lace must be unlocked."
      />

      {status !== 'ready' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface>
            <h2 className="font-display text-xl">Deploy a new board</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Creates a fresh bulletin contract. Your secret key is generated locally and never
              written to the public ledger.
            </p>
            <Button className="mt-6" onClick={deploy} disabled={status === 'connecting'}>
              {status === 'connecting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                </>
              ) : (
                'Deploy board'
              )}
            </Button>
          </Surface>
          <Surface>
            <h2 className="font-display text-xl">Join existing board</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Paste a deployed contract address. If you were the poster, your private state can
              prove ownership for take-down.
            </p>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
              Contract address
            </label>
            <Input
              className="mt-2 font-mono text-xs"
              value={joinAddress}
              onChange={(e) => setJoinAddress(e.target.value)}
              placeholder="hex contract address"
            />
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => join(joinAddress)}
              disabled={status === 'connecting' || !joinAddress.trim()}
            >
              Join board
            </Button>
          </Surface>
          {error ? <p className="text-sm text-[var(--danger)] lg:col-span-2">{error}</p> : null}
          {status === 'connecting' ? (
            <p className="flex items-center gap-2 text-sm text-[var(--ink-muted)] lg:col-span-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting Lace and resolving the board…
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Surface>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isOccupied ? 'ok' : 'neutral'}>
                {isVacant ? 'Vacant' : isOccupied ? 'Occupied' : 'Unknown'}
              </Badge>
              {boardState?.isOwner ? <Badge tone="accent">Owner</Badge> : <Badge>Observer</Badge>}
              <Badge tone="neutral">seq {boardState?.sequence.toString() ?? '—'}</Badge>
            </div>
            <h2 className="mt-5 font-display text-2xl">Public message</h2>
            <p className="mt-3 min-h-[4.5rem] whitespace-pre-wrap text-base leading-relaxed text-[var(--ink-soft)]">
              {boardState?.message ?? 'Board is vacant — post a community signal.'}
            </p>
            <p className="mt-4 break-all font-mono text-[11px] text-[var(--ink-faint)]">
              {api?.deployedContractAddress}
            </p>
          </Surface>

          <Surface>
            {isVacant ? (
              <>
                <h2 className="font-display text-xl">Post anonymously</h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  The message becomes public. Your secret key stays a circuit witness.
                </p>
                <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  Message
                </label>
                <TextArea
                  className="mt-2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Community question, pulse, or feedback…"
                  disabled={busy}
                />
                <Button
                  className="mt-4"
                  onClick={() => void onPost()}
                  disabled={busy || !message.trim()}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Proving…
                    </>
                  ) : (
                    'Post with proof'
                  )}
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl">Take down</h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Only the owner (matching private secret) can clear the board. Observers cannot.
                </p>
                <Button
                  className="mt-6"
                  variant="danger"
                  onClick={() => void onTakeDown()}
                  disabled={busy || !boardState?.isOwner}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Proving…
                    </>
                  ) : boardState?.isOwner ? (
                    'Take down message'
                  ) : (
                    'Owner only'
                  )}
                </Button>
              </>
            )}
            {actionError ? <p className="mt-4 text-sm text-[var(--danger)]">{actionError}</p> : null}
            {localMsg ? <p className="mt-4 text-sm text-[var(--ok)]">{localMsg}</p> : null}
          </Surface>
        </div>
      )}
    </div>
  );
}
