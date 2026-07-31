# Submission Checklist

## Level 1
- [x] Compact contract with public ledger + private witness
- [x] `disclose()` used only for public values
- [x] Contract compiles (`npm run compile` / `contract` compact)
- [x] Managed artifacts under `contract/src/managed/bboard/`
- [x] CLI deploy/join/post/takeDown paths
- [x] README setup + compile + local run docs
- [x] Preprod contract address published: `5847b1dc60804587963b6bbcba8986889e8302c420d83238004cf194babb5eac` (wallet sync/DUST friction noted in `docs/PREPROD_STATUS.md`)

## Level 2
- [x] Browser wallet connect (1AM / Lace) & network status in UI
- [x] Contract / network via env / Settings override
- [x] Call ZK circuits from frontend with loading / error handling
- [x] Private secret never rendered as public UI content
- [x] Vercel-ready `vercel.json` (UI dist)
- [x] Preprod deploy + post verified via 1AM; address in README

## Level 3
- [x] Contract tests in `contract/`
- [x] GitHub Actions CI workflows under `.github/`
- [x] Privacy model doc
- [x] Product proposal (Anonymous Feedback / Survey)
- [x] Polished PulseBoard SaaS UI (landing, dashboard, board, history, settings)
- [x] Loading / success / error / empty / disconnected states on board flow
- [x] Demo video: https://youtu.be/UpCOUF-9nWQ
- [x] README screenshots (landing, dashboard, board, history, settings)
