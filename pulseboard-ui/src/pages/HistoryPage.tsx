import { useEffect, useState } from 'react';
import { PageHeader, Surface, Badge } from '../components/ui/surface';
import { Button } from '../components/ui/button';
import { clearActivity, loadActivity, type ActivityItem } from '../lib/activity';

function toneFor(kind: ActivityItem['kind']) {
  switch (kind) {
    case 'error':
      return 'danger' as const;
    case 'post':
    case 'deploy':
      return 'ok' as const;
    case 'take_down':
      return 'warn' as const;
    default:
      return 'neutral' as const;
  }
}

export function HistoryPage() {
  const [items, setItems] = useState<ActivityItem[]>(() => loadActivity());

  useEffect(() => {
    const refresh = () => setItems(loadActivity());
    window.addEventListener('pulseboard:activity', refresh);
    return () => window.removeEventListener('pulseboard:activity', refresh);
  }, []);

  return (
    <div>
      <PageHeader
        title="History"
        description="Local trail of board actions on this browser. Not written to the public ledger."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearActivity();
              setItems([]);
            }}
            disabled={items.length === 0}
          >
            Clear
          </Button>
        }
      />

      {items.length === 0 ? (
        <Surface>
          <p className="text-sm text-[var(--ink-muted)]">
            No activity yet. Deploy or join a board, then post or take down a message.
          </p>
        </Surface>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Surface key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={toneFor(item.kind)}>{item.kind}</Badge>
                  <p className="font-semibold">{item.title}</p>
                </div>
                {item.detail ? (
                  <p className="mt-1 break-all font-mono text-xs text-[var(--ink-muted)]">{item.detail}</p>
                ) : null}
              </div>
              <time className="text-xs text-[var(--ink-faint)]">{new Date(item.at).toLocaleString()}</time>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
