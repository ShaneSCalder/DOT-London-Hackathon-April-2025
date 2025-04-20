# CoT Audit Log for AI Portfolio Balancer

## Overview

This repository provides a builder-centric implementation of a **Chain of Thought (CoT) Audit Log** system tailored for an AI-powered portfolio balancer. It logs model reasoning, actions, and validation processes into a structured mini-ledger format using deterministic JSON schemas. Memos are hashed, verified with Merkle trees, and grouped into blocks for trustless auditability.

---

## 🔧 Core Components

### 1. `creatememoledger.js`

- Creates a new **memo entry** from incoming AI model data.
- Applies consistent schema to ensure deterministic hashing.
- Generates a memo file ready for ledger entry.

### 2. `runledger.js`

- Executes ledger functions:
  - Updates the memo ledger.
  - Computes Merkle roots.
  - Generates proof hashes.
  - Appends full blocks when the defined size is reached.

---

## 📄 Memo Structure
Each memo contains `part_a`, `part_b`, and `part_c` sections:

- Part A – Model Reasoning
  - Tracks what the AI decided and why (MACD, volume, confidence, etc.).

- Part B – Execution Details
  - Records transaction simulation details: sender/recipient wallets, value sent, fees.

- Part C – CoT Audit
  - Logs the audit decision by another agent or validator (CoT verified, verdict, notes).

- Metadata
  - Includes strategy references, hashes, URLs, and optional NFT IDs.

---

## 🧱 Ledger Lifecycle

### ➕ Memo Creation
```bash
node creatememoledger.js --input ./input/rebalance_001.json
```
Generates a unique memo file and memo hash.

### 🌀 Run Ledger
```bash
node scripts/runledger.js
```
- Adds memo to `memo_ledger.json`
- Computes Merkle root and proof
- After 10 memos, creates a block
- Appends block to `portfolio_balancer_ledger.json`

---

## 📁 Files

- `memo_ledger.json` – stores all memo entries
- `portfolio_balancer_ledger.json` – stores finalized blocks and state
- `input/` – optional raw inputs for memo creation
- `output/` – proof objects and NFTs

---

## 🔐 Merkle Proofs and Their Role

Each memo and block undergoes deterministic hashing of all fields, which are used as leaves in a Merkle tree. 

### 🔁 Proof Generation Includes:

- Hashing every field (e.g., `ledger_transaction_id`, `memo_id`, `part_a_model_used`, etc.)

- Creating a Merkle root for each memo

- Attaching the root, nonce, and proofHash to the memo

- After 10 memos, grouping them into a block with a new Merkle root over all 10 entries

### ✅ Contribution of Merkle Proofs

- Tamper-Proof: Any change to a field will invalidate the proof.

- Verifiable: Users and auditors can validate a single memo or the entire block independently.

- ZK-Level Assurance: While not using traditional zero-knowledge circuits, this system achieves equivalent verifiability and traceability through deterministic hashing and Merkle tree proofs. It's more flexible, transparent, and suited for real-time audit logging without requiring heavy cryptographic computation.
- **Chain of Custody**: Memos act as signed records in time, allowing AI agents' decisions to be traced back to provable context.

---

## 🌐 Use Cases

- ⚡ Efficient Alternative to ZKPs: Traditional zero-knowledge proofs (ZKPs) are computationally expensive and unsuitable for large or frequently updated datasets. This system provides equivalent verifiability and traceability at scale using Merkle proofs—making it far more appropriate for high-frequency, real-time AI audit logging.

- ✅ Transparent AI trading strategies
- ✅ AI reasoning chain logs (CoT)
- ✅ Validator audit trails for agents
- ✅ Verifiable decision compliance (via hashes/Merkle)

---

## 📦 Example Commands
```bash
# Create a memo with model decision
node scripts/creatememoledger.js 

# Run ledger system (append memos, generate block)
node scripts/runledger.js
```


---

## Polyform License (Commercial)

- A purpose-built license family that supports non-commercial open development but restricts commercial use.

✅ Polyform Noncommercial

- Use allowed only for non-commercial purposes.

✅ Polyform Small Business

- Free use for small teams under a revenue cap.

--- 

📣 Coming Soon

Beta Test

NPM & Binary files access

Block explorer UI

## 📣 Coming Soon

🧪 Beta Test Program – Be the first to explore the CoT Audit Ledger in action

📦 NPM & Binary Access – Lightweight CLI tools and modules for builders

🧭 Block Explorer UI – Visualize your memo blocks and Merkle proofs

👉 Sign up for early access:

[![Join the Beta](https://img.shields.io/badge/Beta%20Signup-Available-blue?style=for-the-badge)](https://www.cotledger.com)

---

## ✨ Built For Builders
This system is modular, hash-consistent, and audit-ready. Whether you’re logging AI thoughts or bridging them cross-chain, CoT auditing begins with truth you can prove.

