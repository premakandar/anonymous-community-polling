# Project Proposal: PulseBoard (Anonymous Community Polling)

> **Zero-Knowledge Anonymous Bulletin Board and Community Signals on the Midnight Network**

[![CI](https://github.com/premakandar/anonymous-community-polling/actions/workflows/ci.yaml/badge.svg)](https://github.com/premakandar/anonymous-community-polling/actions/workflows/ci.yaml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=flat-square&logo=vercel)](https://anonymous-community-polling.vercel.app/)
[![Demo Video](https://img.shields.io/badge/Demo_Video-YouTube-FF0000?style=flat-square&logo=youtube)](https://youtu.be/UpCOUF-9nWQ)
[![Compact](https://img.shields.io/badge/Compact-0.31.1-06b6d4?style=flat-square)](https://docs.midnight.network)

---

## Executive Summary

**PulseBoard** is an anonymous community bulletin board built on the **Midnight Network** using **Compact** zero-knowledge smart contracts. Anyone can publish a public pulse or community message, but ownership and take-down rights stay strictly bound to a local secret key witness. Observers see the message content and occupied/vacant status — never who wrote it.

---

## Problem Statement

Traditional community boards and feedback tools force authors to expose public identities:

1. **Durable Public Identity Leakage**: Posting on public blockchains links every message directly to a wallet address or PII.
2. **Lack of Anonymous Take-down Rights**: Proving ownership to edit or delete a post usually requires exposing identity or relying on centralized servers.
3. **No Privacy-Preserving Signal Primitives**: Existing dApps force a trade-off between public transparency and personal privacy.

---

## Solution: Midnight ZK Bulletin Board

Using Midnight's dual-state (public/private) architecture:

- The `localSecretKey` witness is consumed strictly inside private state — `disclose()` is intentionally **never** called on it.
- Ownership is derived as `publicKey(localSecretKey, sequence)` — an opaque commitment stored on the public ledger.
- `takeDown()` succeeds only when the circuit witness regenerates the matching commitment — without disclosing the secret.

### Compact Contract (`contract/src/bboard.compact`)

```compact
export enum State { VACANT, OCCUPIED }

export ledger state: State;
export ledger message: Maybe<Opaque<"string">>;
export ledger sequence: Counter;
export ledger owner: Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  // Binds ownership to localSecretKey witness without disclosing the secret
}

export circuit takeDown(): Opaque<"string"> {
  // Verified only when secret witness regenerates matching owner commitment
}
```

---

## Privacy Model

| Component | State Type | Visibility |
|---|---|---|
| `localSecretKey` | Private Witness | Local browser/session only — never disclosed, never stored on-chain |
| `message` | Public Ledger | On-chain public (disclosed when occupied) |
| `state` & `sequence` | Public Ledger | On-chain status (`VACANT` / `OCCUPIED`) and counter |
| `owner` | Public Ledger | Opaque derived commitment (`Bytes<32>`) |

### What observers CAN learn
- Message content (when occupied)
- Vacant vs occupied state
- Sequence counter and opaque owner commitment bytes

### What observers CANNOT learn
- `localSecretKey` preimage
- Wallet address or identity of the author
- Linkage between wallet accounts and posts

---

## Deployment & Verification

- **Network**: Midnight Preprod Testnet
- **Local Preprod Address**: `02003c94f1b8a72e61a8d052b49c71e839f201d467812e59a03b5478d1f8a2e6`
- **Live Frontend**: [anonymous-community-polling.vercel.app](https://anonymous-community-polling.vercel.app/)
- **Demo Video**: [YouTube](https://youtu.be/UpCOUF-9nWQ)

---

## Level 3 Compliance Checklist

- [x] Compact ZK circuit written in `v0.31.1` with private witness isolation
- [x] Automated contract test suite passing (`npm test`)
- [x] GitHub Actions CI (`ci.yaml`) compiling contract, api, cli, ui, and running tests
- [x] Local Preprod contract address published: `02003c94f1b8a72e61a8d052b49c71e839f201d467812e59a03b5478d1f8a2e6`
- [x] Full-stack web frontend live on Vercel with Lace wallet integration
- [x] Privacy model documented and enforced in contract
- [x] Demo video available: [YouTube](https://youtu.be/UpCOUF-9nWQ)
- [x] Product proposal (this document)
