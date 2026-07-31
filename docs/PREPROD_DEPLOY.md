# Preprod deploy (PulseBoard)

Friend’s flow adapted for this monorepo. **CLI deploy can take ~1 hour** (wallet sync + faucet + tDUST + deploy). Agents should prepare files/Docker, then hand you one command — do not leave agents blocking on the full deploy.

## Prep (already done in repo)

- `pulseboard-cli/src/launcher/preprod-deploy.ts` — non-interactive Preprod deploy
- `npm run preprod-deploy` — package script
- `scripts/preprod-deploy.sh` — WSL one-shot (proof server + deploy)
- Output: `preprod-deployment.json` + `.preprod-wallet.env` (gitignored)

## Your command (WSL)

```bash
cd /mnt/d/Projects/Rise-In/MidNight/anonymous-community-polling && bash scripts/preprod-deploy.sh
```

When it prints `mn_addr_preprod…`, fund it at https://midnight-tmnight-preprod.nethermind.dev/ then wait for deploy to finish.

Success looks like:

```text
=== PREPROD DEPLOY OK ===
"contractAddress": "<64-hex>"
```

Then paste that address (or the JSON) back so README can be updated.

## Reuse same wallet

```bash
cd /mnt/d/Projects/Rise-In/MidNight/anonymous-community-polling
PREPROD_SEED=<your-hex-seed> bash scripts/preprod-deploy.sh
```

## Notes

- Prefer **WSL** + Linux `node_modules` if you hit esbuild/native binary errors (`rm -rf node_modules && npm install` inside WSL).
- Proof server only needs `:6300` for Preprod (reuse if already healthy).
- Preview faucet was down; Preprod faucet is the working path for funding.
