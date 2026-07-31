// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { type FacadeState, type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { createKeystore, UnshieldedWalletState } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { Logger } from 'pino';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as Rx from 'rxjs';

export const getUnshieldedSeed = (seed: string): Uint8Array<ArrayBufferLike> => {
  const seedBuffer = Buffer.from(seed, 'hex');
  const hdWalletResult = HDWallet.fromSeed(seedBuffer);

  const { hdWallet } = hdWalletResult as {
    type: 'seedOk';
    hdWallet: HDWallet;
  };

  const derivationResult = hdWallet.selectAccount(0).selectRole(Roles.NightExternal).deriveKeyAt(0);

  if (derivationResult.type === 'keyOutOfBounds') {
    throw new Error('Key derivation out of bounds');
  }

  return derivationResult.key;
};

function progressDone(progress: unknown): boolean {
  if (!progress || typeof progress !== 'object') return false;
  const candidate = progress as { isStrictlyComplete?: unknown };
  return typeof candidate.isStrictlyComplete === 'function'
    ? (candidate.isStrictlyComplete as () => boolean)()
    : false;
}

function logSyncSample(logger: Logger, state: FacadeState, start: number): void {
  const mins = ((Date.now() - start) / 60_000).toFixed(1);
  const shielded = progressDone(state.shielded.state.progress);
  const unshielded = progressDone(state.unshielded.progress);
  const dust = progressDone(state.dust.state.progress);
  const coins = state.unshielded.availableCoins?.length ?? 0;
  logger.info(
    `Sync sample (${mins}m): isSynced=${state.isSynced} shielded=${shielded} unshielded=${unshielded} dustProg=${dust} coins=${coins}`,
  );
  console.log(
    `  …sync ${mins}m | isSynced=${state.isSynced} shielded=${shielded} unshielded=${unshielded} dust=${dust} coins=${coins}`,
  );
}

/**
 * Wait for full facade sync without a hot wallet.state() subscription.
 * High-frequency state taps were aborting the Node process on Preprod (~1m in).
 * Matches create-mn-app / Degree Verification: waitForSyncedState + sparse progress logs.
 */
async function waitForFacadeSynced(
  logger: Logger,
  walletFacade: WalletFacade,
  timeoutMs = 90 * 60 * 1000,
): Promise<FacadeState> {
  const start = Date.now();
  logger.info('Waiting for wallet.waitForSyncedState() (RPC disconnect noise is normal; can take ~1h)...');
  console.log('  Syncing wallet — leave this running. RPC disconnect lines are normal.');

  const sample = async () => {
    try {
      const state = await Rx.firstValueFrom(
        walletFacade.state().pipe(Rx.take(1), Rx.timeout({ first: 8_000 })),
      );
      logSyncSample(logger, state, start);
    } catch (err) {
      logger.warn(`Sync sample failed (ignored): ${String(err)}`);
    }
  };

  await sample();
  const interval = setInterval(() => {
    void sample();
  }, 15_000);

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const synced = await Promise.race([
      walletFacade.waitForSyncedState(),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new Error(
              `Preprod wallet sync did not complete within ${Math.round(timeoutMs / 60_000)} minutes.`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
    logSyncSample(logger, synced, start);
    logger.info('Wallet isSynced=true');
    return synced;
  } finally {
    clearInterval(interval);
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

export const generateDust = async (
  logger: Logger,
  walletSeed: string,
  _unshieldedState: UnshieldedWalletState,
  walletFacade: WalletFacade,
) => {
  // Fresh synced facade state — do NOT call dust.waitForSyncedState().
  const synced = await waitForFacadeSynced(logger, walletFacade);
  const networkId = getNetworkId();
  const unshieldedKeystore = createKeystore(getUnshieldedSeed(walletSeed), networkId);
  const utxos = synced.unshielded.availableCoins.filter((coin) => !coin.meta.registeredForDustGeneration);

  if (utxos.length === 0) {
    const existing = synced.dust.balance(new Date());
    if (existing > 0n) {
      logger.info(`Dust already available: ${existing}`);
      return;
    }
    logger.info('No unregistered UTXOs found for dust generation.');
    return;
  }

  logger.info(`Generating dust with ${utxos.length} UTXOs...`);
  console.log(`  Registering ${utxos.length} NIGHT UTXOs for DUST...`);

  const recipe = await walletFacade.registerNightUtxosForDustGeneration(
    utxos,
    unshieldedKeystore.getPublicKey(),
    (payload) => unshieldedKeystore.signData(payload),
  );
  const transaction = await walletFacade.finalizeRecipe(recipe);
  const txId = await walletFacade.submitTransaction(transaction);
  logger.info(`Dust registration tx submitted: ${txId}`);
  console.log(`  Dust tx: ${txId}`);

  const dustStart = Date.now();
  const dustBalance = await Rx.firstValueFrom(
    walletFacade.state().pipe(
      Rx.throttleTime(5_000, undefined, { leading: true, trailing: true }),
      Rx.tap((s) => {
        const mins = ((Date.now() - dustStart) / 60_000).toFixed(1);
        const bal = s.dust.balance(new Date());
        logger.info(`Dust wait (${mins}m): balance=${bal} isSynced=${s.isSynced}`);
      }),
      Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      Rx.map((s) => s.dust.balance(new Date())),
      Rx.take(1),
      Rx.timeout({
        first: 45 * 60 * 1000,
        with: () => Rx.throwError(() => new Error('Timed out waiting for dust balance after registration')),
      }),
      Rx.retry({
        delay: (err, retryCount) => {
          if (String(err).includes('Timed out')) {
            return Rx.throwError(() => err);
          }
          logger.warn(`dust balance wait error (retry ${retryCount}): ${String(err)}`);
          return Rx.timer(15_000);
        },
      }),
    ),
  );
  logger.info(`Receiver dust balance after generation: ${dustBalance}`);
  console.log(`  DUST ready: ${dustBalance}`);

  return txId;
};
