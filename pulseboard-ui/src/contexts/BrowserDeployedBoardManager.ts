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

import {
  BBoardAPI,
  type BBoardCircuitKeys,
  type BBoardProviders,
  type DeployedBBoardAPI,
} from '../../../api/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type BBoardPrivateState } from '../../../contract/src/witnesses';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

/**
 * An in-progress bulletin board deployment.
 */
export interface InProgressBoardDeployment {
  readonly status: 'in-progress';
}

/**
 * A deployed bulletin board deployment.
 */
export interface DeployedBoardDeployment {
  readonly status: 'deployed';

  /**
   * The {@link DeployedBBoardAPI} instance when connected to an on network bulletin board contract.
   */
  readonly api: DeployedBBoardAPI;
}

/**
 * A failed bulletin board deployment.
 */
export interface FailedBoardDeployment {
  readonly status: 'failed';

  /**
   * The error that caused the deployment to fail.
   */
  readonly error: Error;
}

/**
 * A bulletin board deployment.
 */
export type BoardDeployment = InProgressBoardDeployment | DeployedBoardDeployment | FailedBoardDeployment;

/**
 * Provides access to bulletin board deployments.
 */
export interface DeployedBoardAPIProvider {
  /**
   * Gets the observable set of board deployments.
   *
   * @remarks
   * This property represents an observable array of {@link BoardDeployment}, each also an
   * observable. Changes to the array will be emitted as boards are resolved (deployed or joined),
   * while changes to each underlying board can be observed via each item in the array.
   */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /**
   * Joins or deploys a bulletin board contract.
   *
   * @param contractAddress An optional contract address to use when resolving.
   * @returns An observable board deployment.
   *
   * @remarks
   * For a given `contractAddress`, the method will attempt to find and join the identified bulletin board
   * contract; otherwise it will attempt to deploy a new one.
   */
  readonly resolve: (contractAddress?: ContractAddress) => Observable<BoardDeployment>;
}

/**
 * A {@link DeployedBoardAPIProvider} that manages bulletin board deployments in a browser setting.
 *
 * @remarks
 * {@link BrowserDeployedBoardManager} configures and manages a connection to the Midnight Lace
 * wallet, along with a collection of additional providers that work in a web-browser setting.
 */
export class BrowserDeployedBoardManager implements DeployedBoardAPIProvider {
  readonly #boardDeploymentsSubject: BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>;
  #initializedProviders: Promise<BBoardProviders> | undefined;

  /**
   * Initializes a new {@link BrowserDeployedBoardManager} instance.
   *
   * @param logger The `pino` logger to for logging.
   */
  constructor(private readonly logger: Logger) {
    this.#boardDeploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>([]);
    this.boardDeployments$ = this.#boardDeploymentsSubject;
  }

  /** @inheritdoc */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /** @inheritdoc */
  resolve(contractAddress?: ContractAddress): Observable<BoardDeployment> {
    const deployments = this.#boardDeploymentsSubject.value;
    let deployment = deployments.find(
      (deployment) =>
        deployment.value.status === 'deployed' && deployment.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<BoardDeployment>({
      status: 'in-progress',
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment);
    }

    this.#boardDeploymentsSubject.next([...deployments, deployment]);

    return deployment;
  }

  private getProviders(): Promise<BBoardProviders> {
    // We use a cached `Promise` to hold the providers. This will:
    //
    // 1. Cache and re-use the providers (including the configured connector API), and
    // 2. Act as a synchronization point if multiple contract deploys or joins run concurrently.
    //    Concurrent calls to `getProviders()` will receive, and ultimately await, the same
    //    `Promise`.
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(deployment: BehaviorSubject<BoardDeployment>): Promise<void> {
    try {
      const providers = await this.getProviders();
      this.logger.info('Starting contract deploy (ZK prove can take several minutes on Preprod)…');
      const api = await BBoardAPI.deploy(providers, this.logger);
      this.logger.info({ address: api.deployedContractAddress }, 'Deploy finished');

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      this.logger.info({ contractAddress }, 'Joining existing board via indexer…');
      const api = await BBoardAPI.join(providers, contractAddress, this.logger);
      this.logger.info({ address: api.deployedContractAddress }, 'Join finished');

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

/** @internal */
const initializeProviders = async (logger: Logger): Promise<BBoardProviders> => {
  const networkId = import.meta.env.VITE_NETWORK_ID || (import.meta.env.PROD ? 'preview' : 'undeployed');
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<BBoardCircuitKeys>(zkConfigPath, fetch.bind(window));

  let config: { indexerUri: string; indexerWsUri: string; proverServerUri?: string };
  try {
    config = await connectedAPI.getConfiguration();
  } catch (e) {
    logger.warn({ error: e }, 'Lace getConfiguration failed — using env URI overrides if set');
    config = {
      indexerUri: '',
      indexerWsUri: '',
      proverServerUri: undefined,
    };
  }

  const indexerUri = import.meta.env.VITE_INDEXER_URI?.trim() || config.indexerUri;
  const indexerWsUri = import.meta.env.VITE_INDEXER_WS_URI?.trim() || config.indexerWsUri;
  let proverUri = import.meta.env.VITE_PROOF_SERVER_URL?.trim() || config.proverServerUri || '';

  // Remote proof server blocks browser CORS — use Vite/Vercel same-origin proxy.
  if (
    typeof window !== 'undefined' &&
    /proof-server\.(preprod|preview)\.midnight\.network/i.test(proverUri)
  ) {
    proverUri = `${window.location.origin}/proof-server`;
  }

  if (!indexerUri || !indexerWsUri || !proverUri) {
    throw new Error(
      'Missing indexer/prover URIs. Unlock 1AM/Lace or set VITE_INDEXER_URI, VITE_INDEXER_WS_URI, and VITE_PROOF_SERVER_URL.',
    );
  }

  const inMemoryBBoardPrivateStateProvider = inMemoryPrivateStateProvider<string, BBoardPrivateState>();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  try {
    const dust = await connectedAPI.getDustBalance();
    logger.info({ dustBalance: dust.balance.toString(), dustCap: dust.cap.toString() }, 'Lace DUST balance');
    if (dust.balance <= 0n) {
      logger.warn('DUST is 0 — Lace cannot pay deploy fees until Generate tDUST completes');
    }
  } catch (e) {
    logger.warn({ error: formatWalletError(e) }, 'Could not read Lace DUST balance');
  }

  return {
    privateStateProvider: inMemoryBBoardPrivateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(proverUri, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(indexerUri, indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          logger.info({ tx, ttl }, 'Balancing transaction via wallet');

          const dust = await connectedAPI.getDustBalance();
          // 1AM may sponsor fees while reported balance is 0 — still attempt balanceTx.
          if (dust.balance <= 0n) {
            logger.warn(
              { dustBalance: dust.balance.toString() },
              'Reported DUST is 0; continuing (wallet may sponsor fees)',
            );
          }

          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx, { payFees: true });
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (e) {
          const message = formatWalletError(e);
          logger.error({ error: message, raw: e }, 'Error balancing transaction via wallet');
          throw e instanceof Error ? e : new Error(message);
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0]; // Return the first transaction ID
        logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
        return txId;
      },
    },
  };
};

/** Flatten Lace / APIError objects into a readable string for the UI. */
const formatWalletError = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message) return record.message;
    const cause = record.cause as Record<string, unknown> | undefined;
    if (cause?.message && typeof cause.message === 'string') return cause.message;
    try {
      return JSON.stringify(error);
    } catch {
      /* ignore */
    }
  }
  return String(error);
};

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

const isCompatibleWallet = (wallet: unknown): wallet is InitialAPI =>
  !!wallet &&
  typeof wallet === 'object' &&
  'apiVersion' in wallet &&
  semver.satisfies((wallet as InitialAPI).apiVersion, COMPATIBLE_CONNECTOR_API_VERSION);

/**
 * Prefer a non-Lace connector when several are installed (1AM Preprod + sponsored DUST
 * worked for deploy/post here; Lace often stalls on local proof server / tDUST).
 */
const getPreferredCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  const entries = Object.entries(window.midnight).filter((entry): entry is [string, InitialAPI] =>
    isCompatibleWallet(entry[1]),
  );
  const nonLace = entries.find(([key]) => key !== 'mnLace');
  if (nonLace) return nonLace[1];
  return entries[0]?.[1];
};

/** @internal */
const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> => {
  const requestedNetwork = (networkId || 'preview').toLowerCase();
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getPreferredCompatibleWallet()),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => {
        logger.info(
          { name: connectorAPI.name, apiVersion: connectorAPI.apiVersion, networkId: requestedNetwork },
          'Compatible wallet connector API found. Connecting.',
        );
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');

            return new Error('Could not find Midnight Lace wallet. Extension installed?');
          }),
      }),
      concatMap(async (initialAPI) => {
        // Lace shows a permission popup; do not race this with a short timeout.
        logger.info('Waiting for wallet authorization popup — approve this site');
        const connectedAPI = await initialAPI.connect(requestedNetwork);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        logger.info(connectionStatus, 'Wallet connector API enabled status');
        return connectedAPI;
      }),
      timeout({
        // User must click Approve in Lace; 5s was causing false "failed to respond".
        first: 120_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');

            return new Error(
              'Lace did not approve in time. Click Deploy board, then Approve the Lace popup within 2 minutes.',
            );
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to enable connector API' + error);
              const message = error instanceof Error ? error.message : String(error);
              if (/network/i.test(message)) {
                return new Error(
                  `Network mismatch (app wants ${requestedNetwork}). Set Lace Midnight to Preprod, Confirm, disable 1AM, retry.`,
                );
              }
              if (/approve|respond|time/i.test(message)) {
                return new Error(message);
              }
              return new Error('Application is not authorized — approve the Lace connection popup for localhost:5173');
            })
          : apis,
      ),
    ),
  );
};
