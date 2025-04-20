import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Wallet,
  ContractFactory,
  JsonRpcProvider,
  keccak256,
  toUtf8Bytes
} from "ethers";
import solc from "solc";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://westend-asset-hub-eth-rpc.polkadot.io";
const WALLET_SEED = process.env.WALLET_COT_MAIN_SEED?.trim();
const OWNER_ADDRESS = process.env.COT_COLLECTION_OWNER?.trim();

const contractsDir = path.join(__dirname, "../contracts");
const outputDir = path.join(__dirname, "../datain/blocks");
if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function generateContractSource(proofHash) {
  return `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract MerkleRootStatic {
    bytes32 public predefinedMerkleRoot;
    mapping(uint256 => bytes32) private _roots;

    event MerkleRootAdded(uint256 indexed itemId, bytes32 indexed root);

    constructor() {
        predefinedMerkleRoot = keccak256(abi.encodePacked("${proofHash}"));
    }

    function addMerkleRoot(uint256 itemId, bytes32 root) external {
        require(_roots[itemId] == bytes32(0), "Already set");
        _roots[itemId] = root;
        emit MerkleRootAdded(itemId, root);
    }

    function getMerkleRoot(uint256 itemId) external view returns (bytes32) {
        return _roots[itemId];
    }
}
`.trim();
}

function compileContract(source) {
  const input = {
    language: "Solidity",
    sources: { "MerkleRootStatic.sol": { content: source } },
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts?.["MerkleRootStatic.sol"]?.["MerkleRootStatic"];
  if (!contract) {
    console.error("❌ Solidity compilation failed:", output.errors || "Unknown error");
    process.exit(1);
  }

  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

function toBytes32(value) {
  if (value.startsWith("0x") && value.length === 66) return value;
  const clean = value.replace(/^0x/, "").padStart(64, "0").slice(0, 64);
  return "0x" + clean;
}

export async function anchorBlockProof(blockId, proofHash) {
  if (!WALLET_SEED || !OWNER_ADDRESS) throw new Error("❌ WALLET_COT_MAIN_SEED or COT_COLLECTION_OWNER missing in .env");
  if (!blockId || !proofHash) throw new Error("❌ Missing blockId or proofHash");

  const provider = new JsonRpcProvider(RPC_ENDPOINT);
  const wallet = Wallet.fromPhrase(WALLET_SEED, provider);
  const signerAddress = await wallet.getAddress();

  console.log(`🔐 EVM Wallet: ${signerAddress}`);
  console.log(`🌐 RPC: ${RPC_ENDPOINT}`);

  const contractSource = generateContractSource(proofHash);
  const { abi, bytecode } = compileContract(contractSource);
  if (!bytecode || bytecode === "0x") throw new Error("❌ Bytecode is empty. Compilation failed.");

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const basePath = path.join(contractsDir, `MerkleRootStatic_${ts}`);
  fs.writeFileSync(`${basePath}.sol`, contractSource);
  fs.writeFileSync(`${basePath}.abi.json`, JSON.stringify(abi, null, 2));
  fs.writeFileSync(`${basePath}.bytecode.json`, JSON.stringify({ bytecode }, null, 2));

  const rawHash = toBytes32(proofHash);
  const itemId = parseInt(blockId.slice(0, 8), 16);

  console.log("🚀 Deploying contract with predefined hash...");
  let contract;
  try {
    const factory = new ContractFactory(abi, bytecode, wallet);
    contract = await factory.deploy({ gasLimit: 2_000_000 });
    console.log(`📡 Deployment tx: ${contract.deploymentTransaction().hash}`);
    await contract.waitForDeployment();
  } catch (err) {
    console.error("❌ Deployment failed:", err.reason || err.message || err);
    process.exit(1);
  }

  const deployedAddress = await contract.getAddress();

  let anchorTx;
  try {
    anchorTx = await contract.addMerkleRoot(itemId, rawHash, {
      gasLimit: 500_000
    });
    const anchorReceipt = await anchorTx.wait();

    const timestamp = new Date().toISOString();
    const anchorData = {
      block_id: blockId,
      item_id: itemId,
      merkle_root: proofHash,
      contract_address: deployedAddress,
      anchor_tx_hash: anchorTx.hash,
      anchored_at_block: anchorReceipt.blockHash,
      anchored_by: signerAddress,
      timestamp,
      subscan_url: `https://westend.subscan.io/extrinsic/${anchorTx.hash}`
    };

    const outPath = path.join(outputDir, `block_${blockId}_anchor.json`);
    fs.writeFileSync(outPath, JSON.stringify(anchorData, null, 2));

    console.log("✅ Anchor complete:");
    console.log(`   ↳ Block: ${anchorReceipt.blockHash}`);
    console.log(`   ↳ Tx:    ${anchorTx.hash}`);
    console.log(`   ↳ Contract: ${deployedAddress}`);
    console.log(`   ↳ Saved: ${outPath}`);
    console.log(`🔗 Subscan: ${anchorData.subscan_url}`);
  } catch (err) {
    console.error("❌ Anchoring failed:", err.reason || err.message || err);
    process.exit(1);
  }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const blockId = process.argv[2];
  const proofHash = process.argv[3];

  anchorBlockProof(blockId, proofHash)
    .then(() => process.exit(0))
    .catch(err => {
      console.error("❌ Anchor failed:", err.message || err);
      process.exit(1);
    });
}
