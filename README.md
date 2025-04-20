# DOT-London-Hackathon-April-2025

Mini Ledger and CoT Ledger fun Oracle to demonstrate use and implimentation
--- 

MiniLedger offers a tamper-evident audit trail for AI and Web3 applications, staying true to its ethos of minimalism and trust: no new chain, no new token – just reliable memory.

---

# 🧠 CoT Oracle — Chain of Thought Anchoring on Polkadot Asset Hub

## Overview

**CoT Oracle** (Chain of Thought Oracle) is a trust-minimized reasoning engine that generates AI decisions, logs them, and anchors their proofs on-chain using **NFTs on Polkadot Asset Hub**.

Built for transparency and verifiability, the system integrates:
- GPT-generated decisions,
- structured Merkle proofs,
- NFT minting,
- and a real-time visual dashboard.

> 🔐 All NFTs are minted and verified on-chain using the Polkadot Asset Hub testnet (Westend), use of dynamic .sol contracts to anchor blocks.

---

## ✨ Features

### 🧠 GPT Oracle
- Generates AI decisions using GPT-3.5.
- Stores decisions as memos with context, metadata, and disclaimers.

### 🧾 Proof & Ledger System
- Each decision is converted into a **Merkle leaf**.
- A custom ledger groups memos into **Merkle-rooted blocks**.
- Each block gets a unique ID and proofHash.

### 🪙 NFT Anchoring (Smart Contract Free)
- The **block proof** is wrapped into structured metadata.
- An NFT is minted **directly on Westend Asset Hub** with that metadata link.
- This acts as an immutable, verifiable anchor for the Merkle proof.

### 📊 Real-Time Dashboard
- Visual explorer to inspect:
  - AI memos
  - Individual memo proofs
  - Block-level proofs
  - NFT-anchored records
- One-click minting for anchoring blocks as NFTs.

---

## 💻 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML + EJS + JS |
| Backend | Node.js + Express |
| AI | OpenAI GPT-3.5 |
| Blockchain | Polkadot Asset Hub (Westend) |
| Anchoring | NFT-based via `remarkWithEvent` alternative |
| Ledger | Custom Merkle ledger for memo grouping |
| Storage | Local JSON structure (can be expanded to IPFS) |

---

## 🧩 How This Fits the Polkadot Asset Hub Track

This project directly aligns with the open track, and we’ve prioritized:

### ✅ Smart Contracts / NFTs on Asset Hub
- Every Merkle block is **anchored using an NFT**.
- Uses `@polkadot/api` to interact with **Westend Asset Hub**.
- Metadata is structured per Polkadot NFT specs.

### ✅ DeFi-Ready Architecture
- Designed for extension:
  - Replace memo inputs with **DeFi risk assessments**
  - Log transactions or protocol decisions
  - Anchor arbitrage strategy outputs, etc.

### ✅ Gaming Use Case Potential
- Anchor **in-game events** (loot drops, outcomes, user actions).
- Create NFTs representing **game state snapshots** or **proof-of-play**.

> ⚙️ The NFT metadata is modular — you can repurpose it for DeFi, gaming, voting, etc.

---

## 🛠️ Run Locally

```bash
git clone https://github.com/your-username/cot-oracle
cd cot-oracle
npm install
npm run dev
```

---

## 🧪 Minted NFT Example

![nft-example](https://subscan.io/nft_example.png)

🔗 View NFT:  
`https://westend.subscan.io/nft/3049915/XXXXXXXX`

---

## 📁 Folder Structure

```
cot-oracle/
├── datain/
│   ├── memooutput/         ← raw memo JSONs
│   ├── nftblock/           ← anchored NFT block files
│   └── ...
├── proofs/
│   └── blocks/             ← block-level proof JSONs
├── scripts/
│   └── anchorBlockProofNFT.js
├── views/
│   └── admin/dashboard.ejs ← main dashboard UI
```

---

## 🚀 What’s Next?

- [ ] IPFS-based metadata pinning  
- [ ] Ledger syncing across chains (via XCM)  
- [ ] Modular decision agents for gaming / DeFi  
- [ ] DAO governance hooks for oracle curation

---

