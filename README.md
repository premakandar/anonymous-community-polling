# PulseBoard — Midnight ZK Anonymous Community Board

An anonymous community bulletin board and survey-style signal board on the **[Midnight Network](https://midnight.network)**. Anyone can publish a single public pulse; ownership and take-down rights stay bound to a local secret key witness. Observers see the message, vacant/occupied status, and sequence — never who wrote it.

[![CI](https://github.com/premakandar/anonymous-community-polling/actions/workflows/ci.yaml/badge.svg)](https://github.com/premakandar/anonymous-community-polling/actions/workflows/ci.yaml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=flat-square&logo=vercel)](https://pulseboard-ruby.vercel.app/)
[![Demo Video](https://img.shields.io/badge/Demo_Video-YouTube-FF0000?style=flat-square&logo=youtube)](https://youtu.be/UpCOUF-9nWQ)
[![Network](https://img.shields.io/badge/Network-Preview-0ea5e9?style=flat-square)](docs/PREVIEW_STATUS.md)
[![Midnight](https://img.shields.io/badge/Midnight-ZK-1c7a4c?style=flat-square)](https://midnight.network)
[![Level 3](https://img.shields.io/badge/Rise--In-Anonymous%20Feedback%20%2F%20Survey-0f766e?style=flat-square)](PROPOSAL.md)
[![license](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](./package.json)

<p>
  <a href="https://pulseboard-ruby.vercel.app/"><img src="https://img.shields.io/badge/Open_Live_App-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Open Live App" /></a>
  <a href="https://youtu.be/UpCOUF-9nWQ"><img src="https://img.shields.io/badge/Watch_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo" /></a>
  <a href="https://preview.midnightexplorer.com/contracts/0x6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05"><img src="https://img.shields.io/badge/View_on_Explorer-0ea5e9?style=for-the-badge" alt="View on Explorer" /></a>
  <a href="https://github.com/premakandar/anonymous-community-polling/actions/workflows/ci.yaml"><img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" /></a>
</p>

---

## Live Demo & Deployment

| Resource | Link / value |
| --- | --- |
| **Live Web Application** | [https://pulseboard-ruby.vercel.app/](https://pulseboard-ruby.vercel.app/) |
| **Local App UI** | [http://localhost:5176/](http://localhost:5176/) (`npm run dev` with `.env.preview`) |
| **Preview Compact Contract** | `6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05` |
| **Explorer** | [Preview contract](https://preview.midnightexplorer.com/contracts/0x6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05) |
| **Preprod Compact Contract (historical)** | `5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac` |
| **Demo Video** | [https://youtu.be/UpCOUF-9nWQ](https://youtu.be/UpCOUF-9nWQ) |
| **GitHub** | [premakandar/anonymous-community-polling](https://github.com/premakandar/anonymous-community-polling) |
| **Product Proposal** | [PROPOSAL.md](PROPOSAL.md) |
| **Preview notes** | [docs/PREVIEW_STATUS.md](docs/PREVIEW_STATUS.md) |

**Verified on Midnight Preview:** deployed via **1AM**. Prefer **Board → Join** with the Preview address below (faster than Deploy). Preprod address is historical only.

**Preview contract:** `6e9e311e392ae783311ba68b622c0458a969b298fd5fa991e56d945e63a96b05`

---

## Screenshots & UI Showcase

### 1. Landing
Product entry and live public-ledger preview for the anonymous community board.

![Landing](pulseboard-ui/public/landing.png)

### 2. Dashboard
Session status, network badge, current public message, and board sequence.

![Dashboard](pulseboard-ui/public/dashboard.png)

### 3. Board
Deploy or join on Preview, anonymous post, and owner-only take-down.

![Board](pulseboard-ui/public/board.png)

### 4. History
Local browser activity trail for deploy, join, post, and take-down.

![History](pulseboard-ui/public/history.png)

### 5. Settings
Contract address (auto-filled after Deploy/Join), indexer, and proof-server endpoints.

![Settings](pulseboard-ui/public/settings.png)

---

## Product Proposal & Category

- **Category**: `Anonymous Feedback / Survey` (Rise-In Level 3)
- **Problem**: Community boards and surveys usually leak a durable public identity with every post. Authors hesitate to speak honestly when take-down or authorship is tied to a wallet address or centralized admin.
- **Solution**: PulseBoard uses Midnight Compact circuits so a public message can sit on-chain while ownership is a ZK claim. Authors keep a `localSecretKey` witness off-ledger; take-down succeeds only when the circuit regenerates the same `owner` commitment — without disclosing the secret.

Full write-up: [PROPOSAL.md](PROPOSAL.md) · [docs/PRODUCT_PROPOSAL.md](./docs/PRODUCT_PROPOSAL.md)

---

## Privacy Model & On-Chain vs Private State

### 1. What observers CAN learn (public ledger)

| Field | Meaning |
| --- | --- |
| `message` | Current public pulse text (when occupied) |
| `state` | `VACANT` or `OCCUPIED` |
| `sequence` | Board sequence counter |
| `owner` | Opaque derived commitment (`Bytes<32>`) — not a wallet address |

### 2. What observers CANNOT learn (private witness / local state)

- **Author identity**: `mn_addr_…` is not written as “author” on the board ledger
- **`localSecretKey` preimage**: never disclosed, never stored on-chain
- **Linkage** between fee-paying wallet activity and board authorship beyond network-layer metadata

### 3. Deliberate disclosures (`disclose()`)

In [`contract/src/bboard.compact`](./contract/src/bboard.compact), `disclose()` is used only for intentional public values (message, state, owner commitment, sequence effects). The secret witness is **never** disclosed.

Ownership: `publicKey(localSecretKey, sequence)`. Take-down regenerates that commitment in-circuit.

More detail: [docs/PRIVACY_MODEL.md](./docs/PRIVACY_MODEL.md)

---

## System Requirements & Prerequisites

- **OS**: Windows / macOS / Linux (WSL2 recommended for Compact / Docker on Windows)
- **Node.js**: **24.11+** (see [`.nvmrc`](./.nvmrc))
- **npm**: 10+
- **Docker**: Active daemon for a local proof server on port **6300** (local undeployed / Lace proving)
- **Compact**: `compactc` **0.31.x** (language 0.23)
- **Wallet**: [1AM](https://1am.xyz/) (verified on Preprod) and/or [Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk)

---

## Quick Start & Installation

### 1. Clone & install

```bash
git clone https://github.com/premakandar/anonymous-community-polling.git
cd anonymous-community-polling
npm install
```

### 2. Compile Compact contract

Generates ZK keys / zkir under `contract/src/managed/bboard`:

```bash
npm run compile
```

### 3. Run tests

```bash
npm test
```

### 4. Build packages (optional)

```bash
npm run build
```

---

## Running Locally (UI + proof server)

### 1. Proof server (Docker)

```bash
cd pulseboard-cli
docker compose -f proof-server-local.yml up -d
cd ..
```

Health check: [http://localhost:6300/health](http://localhost:6300/health)

### 2. Launch web UI

```bash
# Local undeployed (default .env.example values)
npm run dev

# Or Preprod against public indexer:
Copy-Item pulseboard-ui/.env.preprod pulseboard-ui/.env -Force   # PowerShell
npm run dev --workspace=@midnight-ntwrk/pulseboard-ui
```

Open **[http://localhost:5173/](http://localhost:5173/)**.

1. Unlock **1AM** or **Lace** on the matching network (`undeployed` or **Preprod**).
2. Prefer **Join** with the published Preprod address below, or **Deploy board** (ZK prove can take several minutes).
3. **Post** / **Take down** and approve wallet popups.

**Preprod contract address:**

`5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac`

### Environment (`pulseboard-ui/.env.example` / `.env.preprod`)

| Variable | Purpose |
| --- | --- |
| `VITE_NETWORK_ID` | `undeployed` / `preview` / `preprod` |
| `VITE_CONTRACT_ADDRESS` | Default join address |
| `VITE_INDEXER_URI` | Indexer GraphQL |
| `VITE_INDEXER_WS_URI` | Indexer websocket |
| `VITE_PROOF_SERVER_URL` | Local `http://127.0.0.1:6300` or Preprod remote |
| `VITE_LOGGING_LEVEL` | `info` / `trace` |

### CLI (optional)

```bash
npm run preprod-remote --workspace=@midnight-ntwrk/pulseboard-cli
# or
npm run preview-remote --workspace=@midnight-ntwrk/pulseboard-cli
```

Fund the printed `mn_addr_…` from the [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/).

---

## Preview / Preprod Deployment Status

| Item | Status |
| --- | --- |
| **Vercel production** | [pulseboard-ruby.vercel.app](https://pulseboard-ruby.vercel.app/) |
| **Preprod contract** | `5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac` |
| **Browser deploy path** | **Verified with 1AM** (Preprod, sponsored DUST) — deploy + post |
| **Lace path** | Supported; local proof server / Generate tDUST can hang on some setups |
| **CLI Node sync** | Optional / fragile on Preprod (`Wallet.Sync` / dust) |

### Vercel production env (baked at build)

| Variable | Value |
| --- | --- |
| `VITE_NETWORK_ID` | `preprod` |
| `VITE_CONTRACT_ADDRESS` | `5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac` |
| `VITE_INDEXER_URI` | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| `VITE_INDEXER_WS_URI` | `wss://indexer.preprod.midnight.network/api/v4/graphql/ws` |
| `VITE_PROOF_SERVER_URL` | `https://proof-server.preprod.midnight.network` |

Deploy note: Deploy on Preprod builds a ZK proof and can take **2–5+ minutes**. Use **Join** with the published address for a quick demo.

More detail: [`docs/PREPROD_STATUS.md`](./docs/PREPROD_STATUS.md) · [`docs/LACE_PREPROD_DEPLOY.md`](./docs/LACE_PREPROD_DEPLOY.md)

---

## Circuits

| Circuit | Does | Discloses |
| --- | --- | --- |
| `post` | Posts when vacant; binds ownership to secret-derived key | Message, occupied state, owner commitment |
| `takeDown` | Clears board when witness matches `owner` | Vacant state; bumps `sequence` |
| `publicKey` | Derives ownership bytes from secret + sequence | Helper only |

---

## Monorepo layout

```
contract/         Compact board, witnesses, managed ZK artifacts
api/              Shared deploy / join / post / takeDown Midnight.js API
pulseboard-cli/   Node CLI (standalone / preview / preprod)
pulseboard-ui/    Vite + React UI
docs/             Privacy, proposal, checklist, preprod, demo notes
.github/          CI workflow
vercel.json       Deploy config
```

---

## Submission Checklists

### Level 1

- [x] Compact contract with public ledger state & private witness
- [x] Deliberate `disclose()` only for public values
- [x] Contract compiles via `npm run compile`
- [x] Generated `contract/src/managed/bboard` with ZK circuits & keys
- [x] Local deployment & CLI / UI paths functional
- [x] README: setup, compile, run, public vs private state
- [x] Preprod contract address published: `5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac`

### Level 2

- [x] Browser wallet connect (1AM / Lace) & network status in UI
- [x] Contract / network via env (`.env.example`) and Settings override
- [x] Call ZK circuits from frontend with loading / error handling
- [x] Private secret never rendered as public UI content
- [x] Vercel-ready static UI bundle (`vercel.json`)

### Level 3

- [x] Automated contract tests (`npm test`)
- [x] GitHub Actions CI (`.github/workflows/ci.yaml`)
- [x] Polished PulseBoard UI (landing, dashboard, board, history, settings)
- [x] Privacy model + product proposal for Level 3 `Anonymous Feedback / Survey`
- [x] Demo video: [YouTube](https://youtu.be/UpCOUF-9nWQ)
- [x] Live demo: [Vercel](https://pulseboard-ruby.vercel.app/)
- [x] Screenshots in README
- [x] Preprod deploy + post verified (1AM)

Also see [`docs/SUBMISSION_CHECKLIST.md`](./docs/SUBMISSION_CHECKLIST.md).

---

## Built with

compactc **0.31.x** · Midnight.js **4.1.x** · DApp Connector **4.x** · proof server `midnightntwrk/proof-server` (local `:6300` or Preprod remote)

Useful docs: [bulletin-board example](https://docs.midnight.network/examples/dapps/bboard) · [support matrix](https://docs.midnight.network/relnotes/support-matrix) · [Compact](https://docs.midnight.network/compact/writing)

---

## License

MIT (workspace). Compact sources retain Midnight Foundation Apache-2.0 headers where present.
