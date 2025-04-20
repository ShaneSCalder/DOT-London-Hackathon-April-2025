# 📚 Ledger Structure – CoT Ledger + Memo Schema

This document defines the **data structure** of the CoT Ledger and its associated memo records. It ensures deterministic hashing, proof generation, and seamless interoperability across chains and AI systems.

---

## 🗂️ Ledger Structure

Each CoT Ledger contains:

- A unique `ledger_id`
- A configurable `block_size` (e.g., 10 memos per block)
- A set of template fields
- A structured `sections` object with Part A, B, and C
- A growing array of blocks, each containing anchored memos and proofs

### 🧾 Example: `ledger.json`

```json
{
  "ledger_id": "portfolio_balancer_ledger",
  "block_size": 10,
  "block_timeout": 0,
  "created_at": "2025-03-24T15:35:49.651Z",
  "fields": {
    "transaction_id": "",
    "timestamp": "",
    "network": "",
    "transaction_type": ""
  },
  "sections": {
    "part_a": {
      "transaction_id": "",
      "timestamp": "",
      "asset_from": "",
      "asset_to": "",
      "action": "",
      "reasoning_chain": [],
      "model_used": "",
      "confidence_score": "",
      "agent_id": "",
      "amount": {
        "value": "",
        "asset": "",
        "converted_value": "",
        "converted_asset": "",
        "exchange_rate": ""
      },
      "fee": {
        "value": "",
        "currency": ""
      },
      "reference": "",
      "transaction_status": "",
      "validated": false
    },
    "part_b": {
      "transaction_hash": "",
      "ledger_index": "",
      "timestamp": "",
      "network": "",
      "transaction_type": "",
      "sender": {
        "wallet_address": "",
        "asset": "",
        "balance_before": "",
        "balance_after": ""
      },
      "recipient": {
        "wallet_address": "",
        "asset": "",
        "balance_before": "",
        "balance_after": ""
      },
      "amount_transferred": {
        "value": "",
        "asset": ""
      },
      "converted_amount": {
        "value": "",
        "asset": ""
      },
      "fee": {
        "value": "",
        "currency": ""
      },
      "transaction_result": "",
      "validated": false
    },
    "part_c": {
      "timestamp": "",
      "network": "",
      "transaction_type": "",
      "audit_log": {
        "hash": "",
        "previous_hash": "",
        "logged_by": "",
        "audit_type": "",
        "summary": "",
        "verdict": "",
        "notes": ""
      },
      "validated": false
    }
  },
  "blocks": []
}
```

## 🧾 Memo Structure

Each memo contains:

- The structured memo data (copied from `ledger_template`)
- A unique `memo_id`
- A generated `proof` object
- Optional `nft_id`, `meta_data`, and reference links

---

### 🧠 CoT Example Memo (`memo_ledger.json`)

```json
{
  "data": {
    "memo_NFT_1742830560678_cd1c065ca17273f7f2d18d1e_0c96772ad8662f1c9c79b717": {
      "ledger_transaction_id": "ledger_txn_1001",
      "memo_id": "memo_NFT_...",
      "ledger_id": "portfolio_balancer_ledger",
      "timestamp": "1732422600",
      "network": "Simulated (ETH + XRP)",
      "transaction_type": "AI Portfolio Rebalance",
      "part_a_transaction_id": "AI_DECISION_0001",
      "part_a_section": "Model Reasoning",
      "...": "...",
      "meta_data": "{\"strategy_id\": \"MACD_Balance_Alpha\", \"audit_hash\": \"SHA256(rebalance_audit_log)\"}",
      "nft_id": "NFT_1742830560678_cd1c065ca17273f7f2d18d1e",
      "proof": {
        "merkleRoot": "abc123...",
        "nonce": "ae87eb9ddc...",
        "proofHash": "b8bc88...",
        "proofID": "Proof_GENESIS_a65b48"
      }
    }
  }
}
```

## 📦 Block Structure (After 10 Memos)

When the number of memos reaches the defined `block_size` (e.g., 10), a new block is created. This block aggregates memo proof hashes and generates its own Merkle proof, which can optionally be anchored on-chain.

---

### 🧱 Example Block (Simplified)

```json
{
  "block_id": "block_1",
  "timestamp": "2025-03-24T15:48:30.235Z",
  "proof": {
    "leaves": {
      "memo_1_proofHash": "e8024d4baf91ac88c9eb14c119fe37b6c77a8eee6e61f537345790f0808c177e",
      "memo_2_proofHash": "4cc25291b39a8f87d8ceb1db658bd5301abd0e17d689b5bc1d313fe26037a8d7",
      "memo_3_proofHash": "9ff29737f699c07b3af2b17310b99fb36f8169b25d94201f56292dd4adee7abd",
      "...": "...",
      "block_id": "f7cf0423f116a29c18407b0bf13bc61f85f45076e65ceb7577dfd444826c3db0"
    },
    "merkleRoot": "52ee18ac8824dc48e4ac130ae4853e99edbfc2a63029cce390fdf1a1208bfda2",
    "nonce": "855e9edeb6ccabddbe641dd7",
    "proofHash": "60eeeb02a4175e87519f619464c7df53827ed319d8c53ccb13624ef0ac9b6e74",
    "proofID": "Proof_GENESIS_4a1fc9"
  }
}
```

### 🧠 Key Fields

| Field        | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `block_id`   | Unique identifier for the block (can be hash or UUID)                       |
| `timestamp`  | Time the block was created                                                  |
| `leaves`     | All `proofHash` values from the 10 memos, plus any associated metadata      |
| `merkleRoot` | Root hash calculated from the ordered list of `memo_proofHash` values       |
| `nonce`      | Randomized value added to ensure unique `proofHash` generation              |
| `proofHash`  | Final hash of `merkleRoot + nonce`, used for verification or anchoring      |
| `proofID`    | Optional tag (e.g., `Proof_GENESIS_xyz789`) to categorize or trace the block|

---

✅ This structure ensures each block:
- Is tamper-evident
- Can be verified independently
- Can optionally be anchored on-chain
- Is linked to all of its child memos by hash, not by content

Each block’s proof can be verified even without access to the full original data — as long as the `memo_proofHash` values and their Merkle structure are available.

## 🔐 Determinism & Hashing Rules

To ensure reliable and verifiable Merkle proofs, all memo and block data must follow **deterministic hashing** rules:

### 📏 Rules

- Fields must be inserted in predefined order  
  → Hashes are order-sensitive. Use consistent field order across all memos and blocks.

- All values must be stringified before hashing  
  → Convert numbers, booleans, and objects to strings before applying the hash function.

- Optional fields must be present  
  → For example, `meta_data` should be included as `""` if unused, not omitted entirely.

- Use SHA-256 or a configurable hashing algorithm  
  → SHA-256 is the default and recommended. If custom, document the hash function used per `ledger_id`.

---

## 🧠 Why This Matters

| Benefit                              | Impact                                                                 |
|--------------------------------------|------------------------------------------------------------------------|
| Enables `merkleRoot`-based proofing  | All memo and block content can be compressed to a single verifiable hash |
| Supports lightweight zk-alternative validation | Provides ZK-like trust guarantees without computational overhead        |
| Integrates with blockchain anchoring | `proofHash` and `merkleRoot` can be stored on-chain                    |
| Tamper-evident auditability          | Even minor changes to memo fields will produce a different hash        |
| Agent traceability & replayability   | Consistent structure enables replaying reasoning with full fidelity    |

---

## 📁 Related Docs

- [`workflow.md`](./workflow.md) – Full CoT Ledger lifecycle  
- [`proofs.md`](./proofs.md) – How proofs are generated and verified  
- [`interoperability.md`](./interoperability.md) – Solana, XRP, and DeFi integration  
