# Submission Checklist

## Level 1
- [x] Compact contract with public ledger + private witness
- [x] `disclose()` used only for public values
- [x] Contract compiles (`npm run compile` / `contract` compact)
- [x] Managed artifacts under `contract/src/managed/bboard/`
- [x] CLI deploy/join/post/takeDown paths
- [x] README setup + compile + local run docs
- [x] Preprod contract address published: `02003c94f1b8a72e61a8d052b49c71e839f201d467812e59a03b5478d1f8a2e6` (wallet sync/DUST friction noted in `docs/PREPROD_STATUS.md`)

## Level 2
- [x] Lace connect path (unlock Lace, then deploy/join)
- [x] Network + contract address from env / Settings override
- [x] Call `post` / `takeDown` from UI
- [x] Show public ledger state (message, status, sequence)
- [x] Private secret never rendered as public UI content
- [x] `.env.example` with `VITE_NETWORK_ID`, `VITE_CONTRACT_ADDRESS`, indexer/proof URLs
- [x] Vercel-ready `vercel.json` (UI dist)

## Level 3
- [x] Contract tests in `contract/`
- [x] GitHub Actions CI workflows under `.github/`
- [x] Privacy model doc
- [x] Product proposal (Anonymous Feedback / Survey)
- [x] Polished PulseBoard SaaS UI (landing, dashboard, board, history, settings)
- [x] Loading / success / error / empty / disconnected states on board flow
- [x] Demo video: https://youtu.be/UpCOUF-9nWQ
- [x] README screenshots (landing, dashboard, board, history, settings)
