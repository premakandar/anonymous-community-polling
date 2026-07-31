/**
 * Non-interactive Preview deploy for PulseBoard.
 * Starts proof-server via testcontainers, faucet-funds a fresh wallet, deploys, prints address.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { BBoardAPI, type BBoardProviders, type PrivateStateId } from '../../../api/src/index';
import { BBoardPrivateState } from '../../../contract/src/witnesses.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { PreviewRemoteConfig } from '../config.js';
import { createLogger } from '../logger-utils.js';
import { MidnightWalletProvider } from '../midnight-wallet-provider.js';
import { syncWallet, waitForUnshieldedFunds } from '../wallet-utils.js';
import { generateDust } from '../generate-dust.js';
import { randomBytes } from '../../../api/src/utils';
import { FaucetClient, StaticProofServerContainer } from '@midnight-ntwrk/testkit-js';

// @ts-expect-error apollo websocket
globalThis.WebSocket = WebSocket;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '..', '..', '..', 'preview-deployment.json');

// Preview faucet /health often exceeds testkit's 1s axios timeout on Windows.
// eslint-disable-next-line @typescript-eslint/unbound-method -- stash prototype method for restore
const originalFaucetHealth = FaucetClient.prototype.health;
FaucetClient.prototype.health = function health(this: void): Promise<never> {
  console.log('Skipping faucet /health (requestTokens still used for funding)');
  return Promise.resolve(undefined as never);
};

async function waitForProofServer(url: string, timeoutMs = 180_000) {
  const axios = (await import('axios')).default;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(`${url.replace(/\/$/, '')}/health`, { timeout: 5_000 });
      if (res.status === 200) return;
    } catch {
      // still warming up / downloading keys
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error(`Proof server not healthy at ${url} after ${timeoutMs}ms`);
}

async function main() {
  const config = new PreviewRemoteConfig();
  const logger = await createLogger(config.logDir);
  const testEnv = config.getEnvironment(logger);
  let walletProvider: MidnightWalletProvider | undefined;

  try {
    await waitForProofServer('http://localhost:6300');
    logger.info('Using local proof server on :6300');
    const envConfiguration = await testEnv.start(new StaticProofServerContainer(6300));
    logger.info(`Environment: ${JSON.stringify(envConfiguration)}`);

    const seed = process.env.PREVIEW_SEED?.trim() || toHex(randomBytes(32));
    if (process.env.PREVIEW_SEED) {
      logger.info('Using PREVIEW_SEED from environment');
    } else {
      logger.info(`Generated preview wallet seed (save securely): ${seed}`);
    }

    walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    await walletProvider.start();
    const walletFacade = walletProvider.wallet;

    logger.info('Requesting Preview faucet funds and waiting for balance...');
    const unshieldedState = await waitForUnshieldedFunds(
      logger,
      walletFacade,
      envConfiguration,
      unshieldedToken(),
      true, // fundFromFaucet
    );
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined || nightBalance === 0n) {
      throw new Error('No NIGHT received from Preview faucet');
    }
    logger.info(`NIGHT balance: ${nightBalance}`);

    if (config.generateDust) {
      const dustTx = await generateDust(logger, seed, unshieldedState, walletFacade);
      if (dustTx) {
        logger.info(`Dust registration tx: ${dustTx}`);
        await syncWallet(logger, walletFacade);
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<'post' | 'takeDown'>(config.zkConfigPath);
    const providers: BBoardProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => 'Bboard-Test-2026!',
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider,
      midnightProvider: walletProvider,
    };

    logger.info('Deploying PulseBoard contract on Preview...');
    const api = await BBoardAPI.deploy(providers, logger);
    const address = api.deployedContractAddress;
    logger.info(`Deployed contract at address: ${address}`);

    const payload = {
      network: 'preview',
      contractAddress: address,
      walletSeed: seed,
      deployedAt: new Date().toISOString(),
      faucet: envConfiguration.faucet,
      indexer: envConfiguration.indexer,
      node: envConfiguration.node,
      explorer: `https://preview.midnightexplorer.com/contracts/0x${address}`,
    };
    writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    logger.info(`Wrote ${outPath}`);
    console.log('\n=== PREVIEW DEPLOY OK ===');
    console.log(JSON.stringify(payload, null, 2));
  } catch (e) {
    logger.error(e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) logger.debug(e.stack);
    process.exitCode = 1;
  } finally {
    FaucetClient.prototype.health = originalFaucetHealth;
    try {
      if (walletProvider) {
        logger.info('Stopping wallet...');
        await walletProvider.stop();
      }
      logger.info('Stopping test environment...');
      await testEnv.shutdown();
    } catch (e) {
      logger.error(e instanceof Error ? e.message : String(e));
    }
  }
}

await main();
