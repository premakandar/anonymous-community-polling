/**
 * Preprod wallet — create-mn-app / Degree Verification style (WalletFacade.init + restore).
 * Avoids testkit FluentWalletBuilder, which aborts ~1m into Preprod shielded sync.
 */
import { Buffer } from 'buffer';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  WalletFacade,
  DustWallet,
  HDWallet,
  Roles,
  ShieldedWallet,
  createKeystore,
  NoOpTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk';
import * as Rx from 'rxjs';
import {
  CHILD_KINDS,
  clearDustWalletState,
  loadWalletState,
  saveWalletState,
  type ChildKind,
  type PersistedWalletState,
} from './preprod-wallet-state.js';

export { unshieldedToken };
export { saveWalletState, loadWalletState, clearDustWalletState, WALLET_STATE_DIR } from './preprod-wallet-state.js';

export const PREPROD_NETWORK = {
  networkId: 'preprod' as const,
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
  faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
};

/** Sibling create-mn-app fee overhead — PulseBoard testkit used 1000n which is far too low. */
const PUBLIC_FEE_OVERHEAD = 300_000_000_000_000n;
export const PUBLIC_NETWORK_SYNC_TIMEOUT_MS = 90 * 60 * 1000;

function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return result.keys;
}

export interface WalletContext {
  wallet: Awaited<ReturnType<typeof WalletFacade.init>>;
  shieldedSecretKeys: ReturnType<typeof ledger.ZswapSecretKeys.fromSeed>;
  dustSecretKey: ReturnType<typeof ledger.DustSecretKey.fromSeed>;
  unshieldedKeystore: ReturnType<typeof createKeystore>;
  restored: { shielded: boolean; unshielded: boolean; dust: boolean };
}

function warnRestoreFailure(kind: ChildKind, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`  ⚠ Could not restore ${kind} wallet state (${msg}); falling back to fresh sync.\n`);
}

export async function createPreprodWallet(opts: {
  seed: string;
  cwd?: string;
  restore?: boolean;
  /** When true, ignore saved dust.json (stuck incomplete dust checkpoints). Default true. */
  skipDustRestore?: boolean;
}): Promise<WalletContext> {
  setNetworkId(PREPROD_NETWORK.networkId);

  const keys = deriveKeys(opts.seed);
  const networkId = getNetworkId();
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  const skipDust = opts.skipDustRestore !== false;
  if (skipDust) {
    clearDustWalletState('preprod', { cwd: opts.cwd });
  }

  const saved: PersistedWalletState = opts.restore === false ? {} : loadWalletState('preprod', { cwd: opts.cwd });
  if (skipDust) {
    delete saved.dust;
  }

  const restored = { shielded: false, unshielded: false, dust: false };

  const walletConfig = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: PREPROD_NETWORK.indexer,
      indexerWsUrl: PREPROD_NETWORK.indexerWS,
    },
    provingServerUrl: new URL(PREPROD_NETWORK.proofServer),
    relayURL: new URL(PREPROD_NETWORK.node.replace(/^http/, 'ws')),
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
    costParameters: { additionalFeeOverhead: PUBLIC_FEE_OVERHEAD, feeBlocksMargin: 5 },
  };

  type RestorableWallet = { restore: (serialized: string) => Promise<unknown> };
  const asRestorable = (cls: unknown): RestorableWallet => cls as RestorableWallet;
  const restoreState = (value: unknown): string => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: async (config) => {
      const cls = ShieldedWallet(config);
      if (saved.shielded !== undefined && saved.shielded !== null) {
        try {
          const restoredWallet = await asRestorable(cls).restore(restoreState(saved.shielded));
          restored.shielded = true;
          return restoredWallet as Awaited<ReturnType<typeof cls.startWithSecretKeys>>;
        } catch (err) {
          warnRestoreFailure('shielded', err);
        }
      }
      return cls.startWithSecretKeys(shieldedSecretKeys);
    },
    unshielded: async (config) => {
      const cls = UnshieldedWallet(config);
      if (saved.unshielded !== undefined && saved.unshielded !== null) {
        try {
          const restoredWallet = await asRestorable(cls).restore(restoreState(saved.unshielded));
          restored.unshielded = true;
          return restoredWallet as Awaited<ReturnType<typeof cls.startWithPublicKey>>;
        } catch (err) {
          warnRestoreFailure('unshielded', err);
        }
      }
      return cls.startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
    },
    dust: async (config) => {
      const cls = DustWallet(config);
      if (saved.dust !== undefined && saved.dust !== null) {
        try {
          const restoredWallet = await asRestorable(cls).restore(restoreState(saved.dust));
          restored.dust = true;
          return restoredWallet as Awaited<ReturnType<typeof cls.startWithSecretKey>>;
        } catch (err) {
          warnRestoreFailure('dust', err);
        }
      }
      return cls.startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);
    },
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, restored };
}

export async function persistPreprodWalletState(
  ctx: WalletContext,
  cwd?: string,
  opts?: { includeDust?: boolean },
): Promise<void> {
  const next: PersistedWalletState = {};
  const includeDust = opts?.includeDust === true;
  for (const kind of CHILD_KINDS) {
    if (kind === 'dust' && !includeDust) continue;
    try {
      const child = (ctx.wallet as unknown as Record<ChildKind, { serializeState: () => Promise<unknown> }>)[kind];
      const serialized = await child.serializeState();
      if (kind === 'dust') {
        next.dust = serialized as string;
      } else {
        next[kind] = serialized;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`  ⚠ Could not serialize ${kind} wallet state (${msg})\n`);
    }
  }
  saveWalletState('preprod', next, { cwd });
}

/** Wait until shielded + unshielded are synced (dust often never completes before registration). */
export async function waitForCoreWalletsSynced(
  ctx: WalletContext,
  timeoutMs = PUBLIC_NETWORK_SYNC_TIMEOUT_MS,
): Promise<void> {
  const start = Date.now();
  console.log('  Waiting for shielded+unshielded sync (dust handled after NIGHT registration)...');
  await Rx.firstValueFrom(
    ctx.wallet.state().pipe(
      Rx.throttleTime(10_000, undefined, { leading: true, trailing: true }),
      Rx.tap((s) => {
        const mins = ((Date.now() - start) / 60_000).toFixed(1);
        const sh = s.shielded.state.progress.isStrictlyComplete();
        const uns = s.unshielded.progress.isStrictlyComplete();
        const dust = s.dust.state.progress.isStrictlyComplete();
        console.log(`  [${mins}m] core sync: shielded=${sh} unshielded=${uns} dust=${dust}`);
      }),
      Rx.filter((s) => s.shielded.state.progress.isStrictlyComplete() && s.unshielded.progress.isStrictlyComplete()),
      Rx.take(1),
      Rx.timeout({
        first: timeoutMs,
        with: () =>
          Rx.throwError(
            () => new Error(`Shielded+unshielded sync did not complete within ${Math.round(timeoutMs / 60_000)} min`),
          ),
      }),
    ),
  );
  console.log('  ✓ Shielded + unshielded synced');
}

export async function waitForWalletSync(
  ctx: WalletContext,
  timeoutMs = PUBLIC_NETWORK_SYNC_TIMEOUT_MS,
): Promise<Awaited<ReturnType<WalletContext['wallet']['waitForSyncedState']>>> {
  const address = ctx.unshieldedKeystore.getBech32Address().toString();
  console.log(`  Wallet Address: ${address}`);
  console.log(`  Faucet:         ${PREPROD_NETWORK.faucet}`);
  console.log(`  Sync timeout:   ${Math.round(timeoutMs / 60_000)} min`);
  console.log('  Syncing with network...');
  console.log('  ℹ  RPC disconnection messages during sync are normal.\n');

  const syncStart = Date.now();
  const syncInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - syncStart) / 1000);
    process.stdout.write(`\r  ⏳ Still syncing... (${elapsed}s elapsed)   `);
  }, 10_000);

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const state = await Promise.race([
      ctx.wallet.waitForSyncedState(),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Preprod wallet sync did not complete within ${Math.round(timeoutMs / 60_000)} minutes.`));
        }, timeoutMs);
      }),
    ]);
    process.stdout.write('\r  ✓ Synced with network.                                      \n');
    return state;
  } finally {
    clearInterval(syncInterval);
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}
