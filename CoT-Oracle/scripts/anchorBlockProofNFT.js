// scripts/anchorBlockProofNFT.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto"; // ✅ REQUIRED for WASM
import { mintNFTWithMetadata } from "../utils/polkadot.js";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputProofsDir = path.join(__dirname, "../proofs/blocks");
const outputDir = path.join(__dirname, "../datain/nftblock");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function getItemIdFromBlock(blockId) {
  return parseInt(blockId.slice(0, 8), 16);
}

function getTimestamp() {
  return new Date().toISOString();
}

function getWalletSeed() {
  const expected = process.env.COT_COLLECTION_OWNER;
  const seed = process.env.WALLET_COT_MAIN_SEED?.trim();

  if (!expected || !seed) throw new Error("❌ Missing wallet or owner in .env");

  const keyring = new Keyring({ type: "sr25519" });
  const derived = keyring.addFromUri(seed);
  if (derived.address !== expected) {
    throw new Error(`❌ Wallet mismatch.\nExpected: ${expected}\nGot: ${derived.address}`);
  }

  console.log(`🔐 Using verified seed for: ${derived.address}`);
  return seed;
}

export async function anchorBlockAsNFT(blockId) {
  await cryptoWaitReady(); // ✅ ensures WASM crypto is initialized

  const filePath = path.join(inputProofsDir, `block_${blockId}_proof.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ Block proof not found: ${filePath}`);
  }

  const proofData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const proofHash = proofData.proofHash;
  const metadataFilename = `nft_block_${blockId}.json`;
  const metadataUrl = `http://localhost:3005/datain/nftblock/${metadataFilename}`;
  const itemId = getItemIdFromBlock(blockId);

  const metadata = {
    name: `Block Anchor: ${blockId}`,
    block_id: blockId,
    proof_hash: proofHash,
    proof_id: proofData.proofID,
    merkle_root: proofData.merkleRoot,
    timestamp: getTimestamp(),
    network: "Westend Asset Hub",
    format: "cot-block-proof-v1",
    metadata_url: metadataUrl,
    source: "cot-oracle"
  };

  const jsonOutPath = path.join(outputDir, metadataFilename);
  fs.writeFileSync(jsonOutPath, JSON.stringify(metadata, null, 2));
  console.log(`📄 Metadata created: ${jsonOutPath}`);
  console.log(`📎 URL: ${metadataUrl}`);

  const walletSeed = getWalletSeed();
  const collectionId = parseInt(process.env.COT_COLLECTION_ID, 10);
  if (isNaN(collectionId)) throw new Error("❌ Invalid COT_COLLECTION_ID");

  console.log(`🎯 Minting NFT in collection: ${collectionId}`);
  console.log(`📄 Metadata URL: ${metadataUrl}`);

  const nft = await mintNFTWithMetadata(walletSeed, metadataUrl, collectionId, itemId);

  const result = {
    ...metadata,
    item_id: itemId,
    nft_id: nft.nft_id,
    collection_id: nft.collection_id,
    owner: nft.owner,
    anchor_tx_hash: nft.tx_hash,
    anchored_at_block: nft.block_hash,
    minted_at: nft.minted_at,
    subscan_url: `https://westend.subscan.io/nft/${nft.collection_id}/${nft.item_id}`
  };

  fs.writeFileSync(jsonOutPath, JSON.stringify(result, null, 2));

  // 🎉 FINAL LOG OUTPUT
  console.log("✅ NFT anchor complete:");
  console.log(`   ↳ Block ID:         ${blockId}`);
  console.log(`   ↳ Item ID:          ${itemId}`);
  console.log(`   ↳ Collection ID:    ${nft.collection_id}`);
  console.log(`   ↳ NFT ID:           ${nft.nft_id}`);
  console.log(`   ↳ Owner:            ${nft.owner}`);
  console.log(`   ↳ Minted At:        ${nft.minted_at}`);
  console.log(`   ↳ Block Hash:       ${nft.block_hash}`);
  console.log(`   ↳ Tx Hash:          ${nft.tx_hash}`);
  console.log(`   ↳ Metadata:         ${metadataUrl}`);
  console.log(`   ↳ Saved File:       ${jsonOutPath}`);
  console.log(`🔗 View on Subscan:    ${result.subscan_url}`);

  return result;
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const blockId = process.argv[2];
  if (!blockId) {
    console.error("❌ Usage: node anchorBlockProofNFT.js <blockId>");
    process.exit(1);
  }

  anchorBlockAsNFT(blockId)
    .then(() => process.exit(0))
    .catch(err => {
      console.error("❌ Anchor NFT failed:", err.message || err);
      process.exit(1);
    });
}
