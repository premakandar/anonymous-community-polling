#!/usr/bin/env bash
# PulseBoard — Preprod deploy from WSL native filesystem (friend flow).
# Wallet sync is unreliable on /mnt/d with Windows node_modules.
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 24 >/dev/null 2>&1 || true

WIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WSL_ROOT="${HOME}/midnight-projects/anonymous-community-polling"

echo "==> Sync project to WSL home (Linux-native node_modules)"
mkdir -p "$(dirname "$WSL_ROOT")"
rsync -a --delete \
  --exclude node_modules \
  --exclude '*/node_modules' \
  --exclude .git \
  --exclude logs \
  --exclude midnight-level-db \
  --exclude '*/midnight-level-db' \
  --exclude dist \
  --exclude '*/dist' \
  --exclude .midnight-wallet-state \
  --exclude preprod-deployment.json \
  --exclude .preprod-wallet.env \
  "$WIN_ROOT/" "$WSL_ROOT/"

# Prefer Windows-side checkpoints if present
if [ -d "$WIN_ROOT/.midnight-wallet-state" ]; then
  mkdir -p "$WSL_ROOT/.midnight-wallet-state"
  rsync -a "$WIN_ROOT/.midnight-wallet-state/" "$WSL_ROOT/.midnight-wallet-state/"
  echo "    restored .midnight-wallet-state from Windows"
fi

cd "$WSL_ROOT"

INSTALLED_SDK="$(node -p "require('./node_modules/@midnight-ntwrk/wallet-sdk/package.json').version" 2>/dev/null || echo none)"
INSTALLED_UTIL="$(node -p "require('./node_modules/@midnight-ntwrk/wallet-sdk-utilities/package.json').version" 2>/dev/null || echo none)"
if [ ! -d node_modules ] || [ -f node_modules/@esbuild/win32-x64/package.json ] 2>/dev/null; then
  echo "==> npm install (Linux) — fresh Linux node_modules"
  rm -rf node_modules
  npm install --legacy-peer-deps
elif [ "$INSTALLED_SDK" != "1.2.0" ] || [ "$INSTALLED_UTIL" != "1.2.1" ]; then
  echo "==> Aligning wallet-sdk packages (sdk=${INSTALLED_SDK} util=${INSTALLED_UTIL} → 1.2.0 / 1.2.1)"
  npm install --legacy-peer-deps @midnight-ntwrk/wallet-sdk@1.2.0 @midnight-ntwrk/wallet-sdk-utilities@1.2.1
fi
echo "    wallet-sdk=$(node -p "require('./node_modules/@midnight-ntwrk/wallet-sdk/package.json').version")"
echo "    utilities=$(node -p "require('./node_modules/@midnight-ntwrk/wallet-sdk-utilities/package.json').version")"

echo "==> Proof server on :6300"
if ! curl -sf "http://127.0.0.1:6300/health" >/dev/null 2>&1; then
  if [ -f "$WIN_ROOT/pulseboard-cli/proof-server-local.yml" ]; then
    docker compose -f "$WIN_ROOT/pulseboard-cli/proof-server-local.yml" up -d || true
  fi
  echo "    waiting for proof server..."
  for _ in $(seq 1 120); do
    curl -sf "http://127.0.0.1:6300/health" >/dev/null 2>&1 && break
    sleep 5
  done
fi
curl -sf "http://127.0.0.1:6300/health" >/dev/null || {
  echo "ERROR: proof server not healthy on :6300"
  echo "On Windows PowerShell: docker compose -f pulseboard-cli/proof-server-local.yml up -d"
  exit 1
}
echo "    proof server OK"

if [ ! -d contract/src/managed/bboard ]; then
  echo "==> Compiling Compact contract"
  npm run compile
fi

if [ -z "${PREPROD_SEED:-}" ]; then
  echo "WARN: PREPROD_SEED not set — a new wallet will be created (you must faucet-fund again)."
else
  echo "==> Reusing PREPROD_SEED (funded wallet)"
fi

# Stuck incomplete dust.json prevents dust sync forever — always start dust fresh.
rm -f "$WSL_ROOT/.midnight-wallet-state/preprod/dust.json" \
      "$WIN_ROOT/.midnight-wallet-state/preprod/dust.json" 2>/dev/null || true
echo "==> Cleared stuck dust checkpoint (shielded/unshielded kept)"

echo "==> Preprod deploy (chunked sync + dust + deploy; can take ~1h)"
echo "    Fund address (if needed): https://midnight-tmnight-preprod.nethermind.dev/"
echo "    Using 4096MB Node heap (WSL ~8Gi; 12GB heap was OOM-killing sync at ~50s)."
echo ""

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "==> Phase 1: wallet sync with long checkpoints (survives crashes)"
# 20-minute continuous chunks — 35s restarts prevented shielded sync from advancing.
MAX_SYNC_ROUNDS="${PREPROD_SYNC_ROUNDS:-30}"
export PREPROD_SYNC_CHUNK_MS="${PREPROD_SYNC_CHUNK_MS:-1200000}"
echo "    chunk=${PREPROD_SYNC_CHUNK_MS}ms (~$((PREPROD_SYNC_CHUNK_MS / 60000)) min), max rounds=${MAX_SYNC_ROUNDS}"
synced=0
SYNC_NODE=(node --experimental-specifier-resolution=node --loader ts-node/esm src/launcher/preprod-sync-chunk.ts)
for round in $(seq 1 "$MAX_SYNC_ROUNDS"); do
  echo ""
  echo "── sync round ${round}/${MAX_SYNC_ROUNDS} ──"
  set +e
  (
    cd pulseboard-cli
    "${SYNC_NODE[@]}"
  )
  code=$?
  set -e
  if [ "${code}" -eq 0 ]; then
    echo "==> Wallet synced"
    synced=1
    break
  fi
  if [ "${code}" -eq 2 ]; then
    echo "    checkpoint OK — continuing next long chunk"
    if [ -d .midnight-wallet-state ]; then
      mkdir -p "$WIN_ROOT/.midnight-wallet-state"
      rsync -a .midnight-wallet-state/ "$WIN_ROOT/.midnight-wallet-state/"
    fi
    continue
  fi
  echo "    sync round exited ${code} — retry from checkpoint in 5s"
  if [ -d .midnight-wallet-state ]; then
    mkdir -p "$WIN_ROOT/.midnight-wallet-state"
    rsync -a .midnight-wallet-state/ "$WIN_ROOT/.midnight-wallet-state/"
  fi
  sleep 5
done

if [ "${synced}" -ne 1 ]; then
  echo "ERROR: wallet did not finish syncing after ${MAX_SYNC_ROUNDS} rounds"
  exit 1
fi

if [ -d .midnight-wallet-state ]; then
  mkdir -p "$WIN_ROOT/.midnight-wallet-state"
  rsync -a .midnight-wallet-state/ "$WIN_ROOT/.midnight-wallet-state/"
  echo "==> Copied .midnight-wallet-state back to Windows"
fi

echo ""
echo "==> Phase 2: dust + contract deploy"
set +e
npm run preprod-deploy --workspace=@midnight-ntwrk/pulseboard-cli
code=$?
set -e
echo ""
echo "==> preprod-deploy exit code: ${code}"

if [ -f preprod-deployment.json ]; then
  cp -f preprod-deployment.json "$WIN_ROOT/preprod-deployment.json"
  echo "==> Copied preprod-deployment.json back to Windows project"
fi
if [ -f .preprod-wallet.env ]; then
  cp -f .preprod-wallet.env "$WIN_ROOT/.preprod-wallet.env"
fi
if [ -d .midnight-wallet-state ]; then
  mkdir -p "$WIN_ROOT/.midnight-wallet-state"
  rsync -a .midnight-wallet-state/ "$WIN_ROOT/.midnight-wallet-state/"
fi
exit "${code}"
