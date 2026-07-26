# Privacy Model

## What observers can learn
- Whether the board is **vacant** or **occupied**
- The current **public message** text
- The **sequence** counter after each post/take-down cycle
- That a valid **zero-knowledge proof** was accepted for `post` / `takeDown`

## What observers cannot learn
- The author’s **local secret key** (circuit witness)
- Which Lace wallet is the “public identity” of the poster
- Private browser/session state used to prove ownership
- Future messages before they are proven and disclosed on-chain

## What is disclosed deliberately
- `message` — the community pulse / feedback text
- `state` — vacant vs occupied
- `sequence` — public rotation counter
- `owner` — a derived commitment (bytes), not a human-readable identity

The Compact contract intentionally does **not** call `disclose()` on the local secret key witness.
