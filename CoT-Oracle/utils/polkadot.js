// utils/polkadot.js
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import dotenv from "dotenv";
dotenv.config();

const WND_ENDPOINT = "wss://westend-asset-hub-rpc.polkadot.io";

/**
 * Mint a real NFT on Westend Asset Hub using an existing collection.
 * @param {string} walletSeed - Seed/mnemonic of the minting wallet (must own the collection)
 * @param {string} metadataUrl - Metadata JSON URL (used to reference decision/memo)
 * @param {number} collectionId - The ID of the existing collection (from .env)
 * @returns {Promise<Object>} NFT proof payload
 */
export async function mintNFTWithMetadata(walletSeed, metadataUrl, collectionId) {
  await cryptoWaitReady();

  const provider = new WsProvider(WND_ENDPOINT);
  const api = await ApiPromise.create({ provider });

  const keyring = new Keyring({ type: "sr25519" });
  const sender = keyring.addFromUri(walletSeed.trim());

  const itemId = Math.floor(Math.random() * 1_000_000_000);

  console.log("🔗 Connected to Westend Asset Hub");
  console.log("🔐 Using wallet:", sender.address);
  console.log("🎯 Minting NFT in collection:", collectionId);
  console.log("📄 Metadata URL:", metadataUrl);

  const mintTx = api.tx.uniques.mint(collectionId, itemId, sender.address);

  return new Promise(async (resolve, reject) => {
    try {
      const unsub = await mintTx.signAndSend(sender, ({ status, dispatchError }) => {
        if (dispatchError) {
          console.error("❌ Dispatch error:", dispatchError.toString());
          reject(dispatchError.toString());
        }

        if (status.isInBlock || status.isFinalized) {
          let blockHash = null;
          if (status.isFinalized) {
            blockHash = status.asFinalized.toHex();
          } else if (status.isInBlock) {
            blockHash = status.asInBlock.toHex();
          }

          const txHash = mintTx.hash.toHex();

          console.log(`✅ NFT minted in block: ${blockHash}`);
          unsub?.();
          api.disconnect();

          resolve({
            nft_id: `${collectionId}-${itemId}`,
            collection_id: collectionId,
            item_id: itemId,
            owner: sender.address,
            block_hash: blockHash,
            tx_hash: txHash,
            minted_at: new Date().toISOString()
          });
        }
      });
    } catch (err) {
      console.error("❌ Mint failed:", err);
      api.disconnect();
      reject(err);
    }
  });
}