import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { Keyring } from "@polkadot/api";
import { mintNFTWithMetadata } from "../utils/polkadot.js";
import { runLedger } from "./runledger.js";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const memoOutputDir = path.join(__dirname, "../datain/memooutput");
const finalMemoDir = path.join(__dirname, "../datain");

const inputMemoJsonPath = path.join(finalMemoDir, "input_memo.json");
const verificationPath = path.join(finalMemoDir, "last_input_meta.json");

// ✅ Strong, entropy-rich unique hash
function getUniqueMemoHash() {
  const entropy = `${uuidv4()}-${process.hrtime.bigint()}-${randomBytes(32).toString("hex")}-${process.pid}`;
  const hash = createHash("sha256").update(entropy).digest("hex");
  return hash.slice(0, 16);
}

// ✅ Derive numeric item ID from part of the hash
function getItemIdFromHash(hash) {
  return parseInt(hash.slice(0, 8), 16);
}

// ✅ Load the correct wallet seed by matching known address
function getWalletSeedForCollection() {
  const expectedAddress = process.env.COT_COLLECTION_OWNER;
  const knownSeed = process.env.WALLET_COT_MAIN_SEED?.trim();

  if (!expectedAddress || !knownSeed) {
    throw new Error("❌ COT_COLLECTION_OWNER or WALLET_COT_MAIN_SEED not set in .env");
  }

  const keyring = new Keyring({ type: "sr25519" });
  const derived = keyring.addFromUri(knownSeed);

  if (derived.address !== expectedAddress) {
    throw new Error(`❌ Seed does not match COT_COLLECTION_OWNER:
    - Expected: ${expectedAddress}
    - Got:      ${derived.address}`);
  }

  console.log(`🔐 Using verified seed for: ${expectedAddress}`);
  return knownSeed;
}

function getTimestamp() {
  return new Date().toISOString();
}

export async function wrapAndMintMemo(aiData) {
  const memoHash = getUniqueMemoHash();
  const memoFilename = `memo_${memoHash}.json`;
  const metadataUrl = `http://localhost:3005/datain/memooutput/${memoFilename}`;
  const itemId = getItemIdFromHash(memoHash);

  // Step 1: Save raw AI data to memooutput/
  const rawMemoPath = path.join(memoOutputDir, memoFilename);
  fs.writeFileSync(rawMemoPath, JSON.stringify(aiData, null, 2));

  // Step 2: Get wallet + collection ID
  const walletSeed = getWalletSeedForCollection();
  const collectionId = parseInt(process.env.COT_COLLECTION_ID, 10);
  if (isNaN(collectionId)) throw new Error("❌ Invalid COT_COLLECTION_ID in .env");

  // Step 3: Mint NFT using shared collection
  const nftProof = await mintNFTWithMetadata(walletSeed, metadataUrl, collectionId, itemId);

  // Step 4: Build wrapped memo
  const fullMemo = {
    data: {
      ledger_transaction_id: `ledger_txn_${memoHash}`,
      memo_id: `memo_oracle_${memoHash}`,
      ledger_id: "cot_oracle_ledger",
      timestamp: getTimestamp(),
      network: "localhost:3005",
      transaction_type: "AI Oracle Decision",

      agent_id: aiData.agent_id,
      decision: aiData.decision,
      reasoning: aiData.reasoning,
      confidence_score: aiData.confidence_score,
      model_used: aiData.model_used,
      disclaimer: aiData.disclaimer,

      proof: {
        ...nftProof,
        item_id: itemId,
        metadata_url: metadataUrl
      },

      metadata_url: metadataUrl,
      ipfs_cid: "",
      meta_data: JSON.stringify({ source: "cot-oracle-dev", schema: "v1.0" })
    }
  };

  // Step 5: Save wrapped memo to memooutput/
  const wrappedMemoPath = path.join(memoOutputDir, memoFilename);
  fs.writeFileSync(wrappedMemoPath, JSON.stringify(fullMemo, null, 2));

  // Step 6: Save wrapped memo as latest ledger input
  fs.writeFileSync(inputMemoJsonPath, JSON.stringify(fullMemo, null, 2));

  // Step 7: Save a permanent copy in datain/
  const finalMemoPath = path.join(finalMemoDir, memoFilename);
  fs.writeFileSync(finalMemoPath, JSON.stringify(fullMemo, null, 2));

  // Step 8: Save a verification file
  const verification = {
    memo_hash: memoHash,
    memo_id: fullMemo.data.memo_id,
    saved_to: {
      input_memo: inputMemoJsonPath,
      output_raw: wrappedMemoPath,
      final_copy: finalMemoPath
    },
    timestamp: getTimestamp(),
    metadata_url: metadataUrl
  };
  fs.writeFileSync(verificationPath, JSON.stringify(verification, null, 2));

  // Step 9: Run the ledger after memo is saved
  console.log("📦 Running ledger to process input_memo.json...");
  await runLedger();

  // Logs
  console.log(`✅ Wrapped memo saved: ${memoFilename}`);
  console.log(`📥 Ledger input: input_memo.json`);
  console.log(`📄 Final memo copy: datain/${memoFilename}`);
  console.log(`🧪 Verification: last_input_meta.json created`);
  console.log(`🔗 Metadata URL: ${metadataUrl}`);

  return fullMemo;
}

// CLI: node scripts/wrapAndMintMemo.js datain/raw_decision.json
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputPath = process.argv[2] || path.join(__dirname, "../datain/raw_decision.json");
  if (!fs.existsSync(inputPath)) {
    console.error("❌ Input file not found:", inputPath);
    process.exit(1);
  }

  const aiData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  wrapAndMintMemo(aiData).catch(console.error);
}
