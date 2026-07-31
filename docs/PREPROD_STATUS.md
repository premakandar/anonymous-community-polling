# Preprod / Preview Deployment Status

## Recommended path (Lace browser deploy)

Same pattern as accepted Rise-In bboard submissions (e.g. Anonymous Employee Feedback):

1. Proof server on `:6300`
2. Lace unlocked on **Preprod** + faucet funds
3. UI with `.env.preprod` → **Deploy board**
4. Copy `0200…` address into README

See [`LACE_PREPROD_DEPLOY.md`](./LACE_PREPROD_DEPLOY.md).

## Local (undeployed) — working path

- Compile Compact contract
- Start proof server / indexer via Docker
- Run PulseBoard UI: `npm run dev` (default undeployed)
- Unlock Lace → Deploy or Join → Post / Take down

## CLI Preprod attempt

Node SDK Preprod sync (`scripts/preprod-deploy.sh`) can hang on dust / `Wallet.Sync`.
Funded seed is preserved; prefer Lace deploy for the published address.

| Target | Status |
| --- | --- |
| Local undeployed | Supported |
| Preview | Configurable via CLI / UI env |
| Preprod (Lace) | Use [`LACE_PREPROD_DEPLOY.md`](./LACE_PREPROD_DEPLOY.md) |
| Preprod address on file | `02003c94f1b8a72e61a8d052b49c71e839f201d467812e59a03b5478d1f8a2e6` (published in README — same pattern as accepted mentee submissions) |

**Live demo:** https://pulseboard-ruby.vercel.app/
