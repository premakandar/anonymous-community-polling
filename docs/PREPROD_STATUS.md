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

| Target | Status |
| --- | --- |
| Local undeployed | Supported |
| Preview | Configurable via CLI / UI env |
| Preprod (local) | ✅ Published: `02003c94f1b8a72e61a8d052b49c71e839f201d467812e59a03b5478d1f8a2e6` |

**Preprod contract address (local):** `02003c94f1b8a72e61a8d052b49c71e839f201d467812e59a03b5478d1f8a2e6`
