# Preprod via Lace (recommended — matches accepted Rise-In submissions)

CLI wallet sync on Preprod (Node SDK) often stalls on dust / `Wallet.Sync`. Accepted
bboard-style submissions (e.g. [Anonymous-Employee-Feedback](https://github.com/SHREEJIT-DEV/Anonymous-Employee-Feedback))
deploy the contract from the **browser with Lace**, then paste the address into the README.

PulseBoard already has this path: `BrowserDeployedBoardManager` + Board page **Deploy board**.

## Prerequisites

1. Docker Desktop running  
2. Local proof server on `:6300`:

```powershell
docker compose -f pulseboard-cli/proof-server-local.yml up -d
```

3. [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) unlocked on **Preprod**, with faucet funds  
   - Faucet: https://midnight-tmnight-preprod.nethermind.dev/
4. If **1AM** is also installed: **disable 1AM** (or keep Lace preferred — the UI picks `mnLace` first). 1AM Preprod sync often sticks at 99% with a zswap tree error.

## Deploy steps

```powershell
cd D:\Projects\Rise-In\MidNight\anonymous-community-polling\pulseboard-ui
Copy-Item .env.preprod .env -Force
npm run dev
```

1. Open http://localhost:5173/  
2. Lace → network settings → Midnight **Preprod** → **Confirm** → unlock  
3. Dashboard or Board → **Deploy board**  
4. Approve txs in Lace (can take several minutes for proofs; wait until Lace sync finishes before Approve)  
5. **tDUST required:** faucet gives tNight only. In Lace → **Tokens** → **Generate tDUST**, wait until DUST > 0, then Deploy. Balancing fails with 0 DUST.  
6. Copy the contract address shown in the UI (`0200…`)  
7. Paste it here and in README / `docs/PREPROD_STATUS.md`

## Vercel (live demo)

Set project env vars:

| Variable | Value |
| --- | --- |
| `VITE_NETWORK_ID` | `preprod` |
| `VITE_INDEXER_URI` | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| `VITE_INDEXER_WS_URI` | `wss://indexer.preprod.midnight.network/api/v4/graphql/ws` |
| `VITE_PROOF_SERVER_URL` | Lace-provided or your reachable proof server |
| `VITE_CONTRACT_ADDRESS` | (optional) default join address after deploy |

Redeploy Vercel after changing env.

## CLI Preprod (optional / fragile)

`scripts/preprod-deploy.sh` remains for Node SDK experiments. Prefer Lace for submission
addresses — same approach as accepted intensive projects.
