# Product Proposal

**Product:** PulseBoard (Anonymous Community Polling)  
**Level 3 category:** Anonymous Feedback / Survey  
**Network:** Midnight

## Problem
Communities need a way to publish a short public signal (question, pulse, feedback) without attaching a durable public identity to the author. Traditional boards leak wallet addresses and make take-down rights hard to prove privately.

## Solution
PulseBoard is a one-slot anonymous bulletin:

1. Anyone with Lace can **deploy** or **join** a board contract.
2. A user **posts** a message; ownership is bound to a private secret key witness.
3. The public ledger shows only message + vacant/occupied + sequence.
4. Only the matching private owner can **take down** the message.

## Why Midnight
- Compact circuits prove knowledge of the secret without revealing it
- Public ledger stays auditable for community operators
- Lace provides the browser wallet UX for Level 2

## Users
- Community moderators who want accountable public pulses
- Members who want to speak without doxxing their wallet identity
- Auditors who need proof that posts/take-downs were valid ZK transactions
