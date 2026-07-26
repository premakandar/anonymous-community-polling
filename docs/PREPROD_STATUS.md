# Preprod / Preview Deployment Status

## Local (undeployed) — working path
- Compile Compact contract
- Start proof server / indexer via Docker (`pulseboard-cli` compose / proof-server yml)
- Run PulseBoard UI: `npm run dev`
- Unlock Lace → Deploy or Join → Post / Take down

## Preprod attempt
Preprod wallet sync can hang before deploy completes (known Midnight testnet friction).

When blocked:
1. Confirm RPC/indexer endpoints respond
2. Fund only the `mn_addr_preprod…` address printed by the CLI
3. Do **not** delete funded `.midnight-state.json` / wallet state after faucet
4. Prefer full-stack local submission per mentor guidance if sync remains blocked

## Current status
| Target | Status |
| --- | --- |
| Local undeployed | Supported |
| Preview | Configurable via CLI / UI env |
| Preprod | Sync may block — document address here when successful |

**Preprod contract address:** _TBD — add when deploy succeeds_
