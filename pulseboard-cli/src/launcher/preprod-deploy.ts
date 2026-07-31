/**
 * Non-interactive Preprod deploy for PulseBoard.
 * Uses create-mn-app style wallet (WalletFacade.init + persistence), not testkit FluentWalletBuilder.
 *
 * Env:
 *   PREPROD_SEED  — reuse an existing hex seed (required for funded wallet)
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { randomBytes } from 'node:crypto';
import * as Rx from 'rxjs';
import { BBoardAPI, type BBoardProviders, type PrivateStateId } from '../../../api/src/index';
import { BBoardPrivateState } from '../../../contract/src/witnesses.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import {
  createPreprodWallet,
  persistPreprodWalletState,
  waitForCoreWalletsSynced,
  unshieldedToken,
  PREPROD_NETWORK,
  type WalletContext,
} from '../preprod-wallet.js';

// @ts-expect-error apollo websocket
globalThis.WebSocket = WebSocket;

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const outPath = path.join(ROOT, 'preprod-deployment.json');
const walletNotePath = path.join(ROOT, '.preprod-wallet.env');
const zkConfigPath = path.resolve(__dirname, '..', '..', '..', 'contract', 'src', 'managed', 'bboard');

async function waitForProofServer(url: string, timeoutMs = 600_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/health`);
      if (res.ok) return;
    } catch {
      /* warming */
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error(
    `Proof server not healthy at ${url} — start: docker compose -f pulseboard-cli/proof-server-local.yml up -d`,
  );
}

function createProviders(walletCtx: WalletContext): BBoardProviders {
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider<'post' | 'takeDown'>(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
      privateStateStoreName: 'bboard-private-state-preprod',
      signingKeyStoreName: 'bboard-private-state-preprod-signing-keys',
      privateStoragePasswordProvider: () => 'Bboard-Test-2026!',
      accountId,
    }),
    publicDataProvider: indexerPublicDataProvider(PREPROD_NETWORK.indexer, PREPROD_NETWORK.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PREPROD_NETWORK.proofServer, zkConfigProvider),
    walletProvider: walletProvider as BBoardProviders['walletProvider'],
    midnightProvider: walletProvider as BBoardProviders['midnightProvider'],
  };
}

async function waitForDustSynced(walletCtx: WalletContext, timeoutMs = 45 * 60 * 1000): Promise<void> {
  const start = Date.now();
  console.log('  Waiting for dust wallet ledger sync (fresh dust; can take a while)...');
  await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(
      Rx.throttleTime(15_000, undefined, { leading: true, trailing: true }),
      Rx.tap((s) => {
        const mins = ((Date.now() - start) / 60_000).toFixed(1);
        const dust = s.dust.state.progress.isStrictlyComplete();
        const bal = s.dust.balance(new Date());
        console.log(`  [${mins}m] dustSynced=${dust} dustBal=${bal} isSynced=${s.isSynced}`);
      }),
      Rx.filter((s) => s.dust.state.progress.isStrictlyComplete()),
      Rx.take(1),
      Rx.timeout({
        first: timeoutMs,
        with: () =>
          Rx.throwError(
            () =>
              new Error(
                `Dust wallet sync did not complete within ${Math.round(timeoutMs / 60_000)} min`,
              ),
          ),
      }),
    ),
  );
  console.log('  ✓ Dust wallet synced');
}

async function ensureDust(walletCtx: WalletContext): Promise<void> {
  console.log('─── DUST Token Setup ───────────────────────────────────────────\n');
  await waitForCoreWalletsSynced(walletCtx, 20 * 60 * 1000);

  // Siblings wait for full isSynced (incl. dust) BEFORE registering NIGHT→DUST.
  // Registering against an unsynced dust wallet left balance at 0 for 45m.
  try {
    await waitForDustSynced(walletCtx, 45 * 60 * 1000);
  } catch (e) {
    console.warn(`  ⚠ ${e instanceof Error ? e.message : String(e)}`);
    console.warn('  Continuing with registration anyway...');
  }

  let state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.take(1)));
  const unregisteredUtxos = state.unshielded.availableCoins.filter(
    (c) => !c.meta?.registeredForDustGeneration,
  );

  if (unregisteredUtxos.length > 0) {
    console.log(`  Registering ${unregisteredUtxos.length} NIGHT UTXOs for DUST generation...`);
    const dustAddress = (state.dust as { address?: unknown }).address;
    const recipe = dustAddress
      ? await walletCtx.wallet.registerNightUtxosForDustGeneration(
          unregisteredUtxos,
          walletCtx.unshieldedKeystore.getPublicKey(),
          (payload) => walletCtx.unshieldedKeystore.signData(payload),
          dustAddress as never,
        )
      : await walletCtx.wallet.registerNightUtxosForDustGeneration(
          unregisteredUtxos,
          walletCtx.unshieldedKeystore.getPublicKey(),
          (payload) => walletCtx.unshieldedKeystore.signData(payload),
        );
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
    const txId = await walletCtx.wallet.submitTransaction(finalized);
    console.log(`  Dust registration tx: ${txId}`);

    // Wait until local unshielded state sees the UTXO as registered.
    console.log('  Waiting for registration to appear in wallet state...');
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s) => {
          const still = s.unshielded.availableCoins.filter((c) => !c.meta?.registeredForDustGeneration);
          return still.length === 0 || s.dust.balance(new Date()) > 0n;
        }),
        Rx.take(1),
        Rx.timeout({ first: 10 * 60 * 1000, with: () => Rx.of(null) }),
      ),
    ).catch(() => undefined);
  } else {
    console.log('  NIGHT UTXOs already registered for dust (or none available).');
  }

  state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.take(1)));
  let bal = state.dust.balance(new Date());
  console.log(`  Current dust balance projection: ${bal}`);

  if (bal === 0n) {
    console.log('  Waiting for DUST balance projection (up to 15m; then deploy retries)...');
    try {
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(10_000),
          Rx.tap((s) => {
            const b = s.dust.balance(new Date());
            const dust = s.dust.state.progress.isStrictlyComplete();
            console.log(`  dustBal=${b} dustSynced=${dust}`);
          }),
          Rx.filter((s) => s.dust.balance(new Date()) > 0n),
          Rx.take(1),
          Rx.timeout({ first: 15 * 60 * 1000 }),
        ),
      );
      bal = (await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.take(1)))).dust.balance(new Date());
    } catch {
      console.warn(
        '  ⚠ Dust balance still 0 after wait — will attempt deploy with shortage retries (sibling pattern).',
      );
    }
  }
  console.log(`  DUST ready (balance=${bal})\n`);
}

async function main() {
  let walletCtx: WalletContext | undefined;
  try {
    console.log('─── PulseBoard Preprod Deploy (create-mn-app wallet) ───────────\n');
    await waitForProofServer(PREPROD_NETWORK.proofServer);
    console.log('  Proof server OK on :6300\n');

    const seed = process.env.PREPROD_SEED?.trim() || toHex(randomBytes(32));
    if (process.env.PREPROD_SEED) {
      console.log('  Using PREPROD_SEED from environment');
    } else {
      console.log(`  Generated seed (save it): ${seed}`);
    }

    walletCtx = await createPreprodWallet({ seed, cwd: ROOT, skipDustRestore: true });
    console.log(
      `  Restore: shielded=${walletCtx.restored.shielded} unshielded=${walletCtx.restored.unshielded} dust=${walletCtx.restored.dust}`,
    );

    await waitForCoreWalletsSynced(walletCtx);

    const token = unshieldedToken();
    const state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.take(1)));
    const night = state.unshielded.balances[token.raw] ?? 0n;
    console.log(`  NIGHT balance: ${night}`);
    if (night === 0n) {
      const addr = walletCtx.unshieldedKeystore.getBech32Address().toString();
      console.error(`\n  ❌ No NIGHT. Fund ${addr} at ${PREPROD_NETWORK.faucet} then re-run with same PREPROD_SEED.\n`);
      process.exitCode = 1;
      return;
    }

    await persistPreprodWalletState(walletCtx, ROOT, { includeDust: false });
    await ensureDust(walletCtx);
    await persistPreprodWalletState(walletCtx, ROOT, { includeDust: true });

    console.log('─── Deploy Contract ────────────────────────────────────────────\n');
    // Preprod block-time lag: dust projection vs spendable dust (sibling uses ~6s on devnet).
    process.stdout.write('  Waiting for dust/block lag...');
    await new Promise((r) => setTimeout(r, 30_000));
    process.stdout.write(' done.\n');

    const providers = createProviders(walletCtx);
    console.log('  Deploying PulseBoard contract (proofs can take a while)...\n');

    const MAX_RETRIES = 40;
    const RETRY_DELAY_MS = 10_000;
    let api: Awaited<ReturnType<typeof BBoardAPI.deploy>> | undefined;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        api = await BBoardAPI.deploy(providers);
        break;
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        const cause =
          err instanceof Error && err.cause instanceof Error
            ? err.cause.message
            : err && typeof err === 'object' && 'cause' in err
              ? String((err as { cause?: unknown }).cause)
              : '';
        const full = `${msg} ${cause}`;
        const isDustShortage =
          full.includes('Not enough Dust') ||
          full.includes('Insufficient Funds') ||
          full.includes('could not balance dust') ||
          full.includes('InsufficientDust');

        if (!(isDustShortage && attempt === 1)) {
          console.warn(`  Deploy attempt ${attempt}/${MAX_RETRIES}: ${msg}`);
        } else {
          console.log('  Waiting for dust to become spendable...');
        }

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, isDustShortage ? RETRY_DELAY_MS : RETRY_DELAY_MS));
        }
      }
    }
    if (!api) {
      throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    }

    const address = api.deployedContractAddress;
    await persistPreprodWalletState(walletCtx, ROOT, { includeDust: true });

    const payload = {
      network: 'preprod',
      contractAddress: address,
      walletSeed: seed,
      deployedAt: new Date().toISOString(),
      faucet: PREPROD_NETWORK.faucet,
      indexer: PREPROD_NETWORK.indexer,
      node: PREPROD_NETWORK.node,
      explorer: `https://preprod.midnightexplorer.com/contracts/0x${address}`,
    };
    writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    writeFileSync(
      walletNotePath,
      `SEED=${seed}\nCONTRACT=${address}\nFAUCET=${PREPROD_NETWORK.faucet}\n`,
      'utf8',
    );
    console.log('\n=== PREPROD DEPLOY OK ===');
    console.log(JSON.stringify(payload, null, 2));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('PREPROD DEPLOY FAILED:', msg);
    if (e instanceof Error && e.stack) console.error(e.stack);
    process.exitCode = 1;
  } finally {
    try {
      if (walletCtx) {
        console.log('  Stopping wallet...');
        await walletCtx.wallet.stop();
      }
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
    }
  }
}

await main();
