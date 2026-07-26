import { useState } from 'react';
import { PageHeader, Surface, Badge, Input } from '../components/ui/surface';
import { Button } from '../components/ui/button';
import { useBoardSession } from '../contexts/BoardSessionContext';
import { networkLabel, LACE_STORE_URL } from '../config';

export function SettingsPage() {
  const { config, setContractAddress, clearContractOverride, api } = useBoardSession();
  const [address, setAddress] = useState(config.contractAddress ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Contract address override and environment endpoints used by the Lace-backed providers."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <h2 className="font-display text-xl">Contract address</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Override <code className="font-mono text-xs">VITE_CONTRACT_ADDRESS</code> for this
            browser. Used as the default join target.
          </p>
          <Input
            className="mt-4 font-mono text-xs"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSaved(false);
            }}
            placeholder="hex contract address"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setContractAddress(address);
                setSaved(true);
              }}
            >
              Save override
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearContractOverride();
                setAddress('');
                setSaved(false);
              }}
            >
              Clear
            </Button>
          </div>
          {saved ? <p className="mt-3 text-sm text-[var(--ok)]">Saved.</p> : null}
          {api ? (
            <p className="mt-4 break-all font-mono text-[11px] text-[var(--ink-faint)]">
              Active session: {api.deployedContractAddress}
            </p>
          ) : null}
        </Surface>

        <Surface>
          <h2 className="font-display text-xl">Environment</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-faint)]">Network</dt>
              <dd className="font-medium">{networkLabel(config.networkId)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-faint)]">Indexer</dt>
              <dd className="max-w-[60%] break-all text-right font-mono text-xs">
                {config.indexerUri ?? 'From Lace'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-faint)]">Proof server</dt>
              <dd className="max-w-[60%] break-all text-right font-mono text-xs">
                {config.proofServerUri ?? 'From Lace'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ink-faint)]">Logging</dt>
              <dd className="font-mono text-xs">{config.loggingLevel}</dd>
            </div>
          </dl>
          <a
            href={LACE_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-deep)] hover:underline"
          >
            Install / open Lace →
          </a>
          <p className="mt-4 text-xs leading-relaxed text-[var(--ink-muted)]">
            Unlock Lace before deploy/join. For local undepolyed, point Lace proof server to{' '}
            <code className="font-mono">http://localhost:6300</code> and run the project Docker
            stack.
          </p>
          <Badge tone="warn">Preprod sync may block — see README</Badge>
        </Surface>
      </div>
    </div>
  );
}
