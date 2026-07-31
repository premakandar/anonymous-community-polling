# Preprod / Preview Deployment Status

## Working path (browser wallet on Preprod)

Same pattern as accepted Rise-In bboard submissions (e.g. Anonymous Employee Feedback):

1. Proof server on `:6300` (optional when wallet sponsors proving / DUST)
2. Wallet unlocked on **Preprod** with funds (+ DUST or sponsored fees)
3. UI with `.env.preprod` → **Deploy board** → **Post**
4. Copy the `0200…` / hex contract address into README

**Verified:** **1AM** on Preprod (synced, sponsored DUST) deployed and posted successfully.

See [`LACE_PREPROD_DEPLOY.md`](./LACE_PREPROD_DEPLOY.md) for Lace-specific notes (proof server / Generate tDUST can hang).

## Local (undeployed) — working path

- Compile Compact contract
- Start proof server / indexer via Docker
- Run PulseBoard UI: `npm run dev` (default undeployed)
- Unlock wallet → Deploy or Join → Post / Take down

## CLI Preprod attempt

Node SDK Preprod sync (`scripts/preprod-deploy.sh`) can hang on dust / `Wallet.Sync`.
Prefer browser deploy (1AM or Lace) for the published address.

| Target | Status |
| --- | --- |
| Local undeployed | Supported |
| Preview | Configurable via CLI / UI env |
| Preprod (browser) | **1AM verified** — deploy + post |
| Preprod address on file | `5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac` (board message `Hiii`, seq 1) |

**Live demo:** https://pulseboard-ruby.vercel.app/
