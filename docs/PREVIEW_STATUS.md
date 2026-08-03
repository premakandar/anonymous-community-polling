# PulseBoard — Preview status

## Target network

**Preview** via **1AM** (Rise-In July migration — Preprod down).

```powershell
Copy-Item pulseboard-ui/.env.preview pulseboard-ui/.env -Force
npm run dev --workspace=@midnight-ntwrk/pulseboard-ui
```

Open **http://localhost:5176/** (or the printed Vite port).

## Contract address

**`6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05`**

- Network: Preview  
- Deployed via **1AM** (Board → Deploy)  
- Indexer: verified `ContractDeploy`  
- Explorer: https://preview.midnightexplorer.com/contracts/0x6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05

Settings now auto-fills / saves the address after Deploy or Join.

## Vercel production env

```
VITE_NETWORK_ID=preview
VITE_CONTRACT_ADDRESS=6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05
VITE_INDEXER_URI=https://indexer.preview.midnight.network/api/v4/graphql
VITE_INDEXER_WS_URI=wss://indexer.preview.midnight.network/api/v4/graphql/ws
VITE_PROOF_SERVER_URL=https://proof-server.preview.midnight.network
```

Faucet: https://faucet.preview.midnight.network/
