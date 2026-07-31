/**
 * Sync until shielded+unshielded are ready (do not wait forever for dust).
 * Exit 0 = core wallets ready for dust registration + deploy.
 * Exit 2 = timed chunk (rare with long timeout). Exit 1 = error.
 *
 * Env:
 *   PREPROD_SEED
 *   PREPROD_SYNC_CHUNK_MS  (default 1200000)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { createPreprodWallet, persistPreprodWalletState } from '../preprod-wallet.js';

// @ts-expect-error apollo websocket
globalThis.WebSocket = WebSocket;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CHUNK_MS = Number(process.env.PREPROD_SYNC_CHUNK_MS || 1_200_000);

function progressDone(progress: unknown): boolean {
  if (!progress || typeof progress !== 'object') return false;
  const c = progress as { isStrictlyComplete?: unknown };
  return typeof c.isStrictlyComplete === 'function' ? (c.isStrictlyComplete as () => boolean)() : false;
}

async function main() {
  const seed = process.env.PREPROD_SEED?.trim();
  if (!seed) {
    console.error('PREPROD_SEED required');
    process.exitCode = 1;
    return;
  }

  const mins = (CHUNK_MS / 60_000).toFixed(1);
  console.log(`─── Sync chunk (up to ${mins} min) — exit when shielded+unshielded ready ───`);
  console.log('  Dust sync often never completes before NIGHT→DUST registration; we do not wait for it.');
  const walletCtx = await createPreprodWallet({ seed, cwd: ROOT, skipDustRestore: true });
  const restored = Object.values(walletCtx.restored).filter(Boolean).length;
  console.log(
    `  Restored ${restored}/3 (dust forced fresh) | ${walletCtx.unshieldedKeystore.getBech32Address().toString()}`,
  );

  const persist = async (label: string) => {
    try {
      // Never persist incomplete dust — that was trapping sync for hours.
      await persistPreprodWalletState(walletCtx, ROOT, { includeDust: false });
      console.log(`  Checkpoint saved (${label}, no dust)`);
    } catch (e) {
      console.warn(`  Checkpoint failed (${label}): ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const start = Date.now();
  let readyStreak = 0;
  const sample = async () => {
    try {
      const s = await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(Rx.take(1), Rx.timeout({ first: 8_000 })),
      );
      const elapsed = ((Date.now() - start) / 60_000).toFixed(1);
      const sh = progressDone(s.shielded.state.progress);
      const uns = progressDone(s.unshielded.progress);
      const dust = progressDone(s.dust.state.progress);
      console.log(
        `  [${elapsed}m] isSynced=${s.isSynced} shielded=${sh} unshielded=${uns} dust=${dust}`,
      );
      if (sh && uns) {
        readyStreak += 1;
      } else {
        readyStreak = 0;
      }
      // Two consecutive samples (~1 min) with core wallets ready.
      return readyStreak >= 2;
    } catch (e) {
      console.warn(`  sample failed (ignored): ${String(e)}`);
      readyStreak = 0;
      return false;
    }
  };

  await sample();
  const ticker = setInterval(() => {
    void (async () => {
      if (await sample()) {
        /* handled below via race */
      }
    })();
  }, 30_000);
  const checkpointTicker = setInterval(() => {
    void persist('interval');
  }, 120_000);

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const ready = await Promise.race([
      (async () => {
        while (Date.now() - start < CHUNK_MS) {
          if (await sample()) return true;
          await new Promise((r) => setTimeout(r, 30_000));
        }
        return false;
      })(),
      new Promise<false>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(false), CHUNK_MS);
      }),
    ]);

    clearInterval(ticker);
    clearInterval(checkpointTicker);
    if (timeoutHandle) clearTimeout(timeoutHandle);

    await persist(ready ? 'core-ready' : 'chunk-end');
    await walletCtx.wallet.stop();

    if (ready) {
      console.log('  ✓ Shielded + unshielded ready — proceed to dust registration + deploy');
      process.exitCode = 0;
    } else {
      console.log('  …chunk timeout — will continue from checkpoint');
      process.exitCode = 2;
    }
  } catch (e) {
    clearInterval(ticker);
    clearInterval(checkpointTicker);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    console.error('Sync chunk error:', e instanceof Error ? e.message : String(e));
    await persist('error');
    try {
      await walletCtx.wallet.stop();
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  }
}

await main();
