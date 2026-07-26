# PulseBoard UI notes (Level 2)

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Full-bleed SaaS landing |
| `/dashboard` | Network, session, vacant/occupied, sequence |
| `/board` | Deploy / join / post / take-down |
| `/history` | Local activity trail |
| `/settings` | Contract override + env endpoints |

## Env (`bboard-ui/.env.example`)

```
VITE_NETWORK_ID=undeployed
VITE_LOGGING_LEVEL=info
VITE_CONTRACT_ADDRESS=
VITE_INDEXER_URI=http://127.0.0.1:8088/api/v4/graphql
VITE_INDEXER_WS_URI=ws://127.0.0.1:8088/api/v4/graphql/ws
VITE_PROOF_SERVER_URL=http://127.0.0.1:6300
```

## Run

```bash
# from repo root
npm install
npm run compile   # or: npm run compact -w @midnight-ntwrk/bboard-contract
npm run dev       # http://localhost:5173
```

Unlock Lace before Deploy/Join. ZK keys are copied to `bboard-ui/public/{keys,zkir}` on predev/prebuild.
