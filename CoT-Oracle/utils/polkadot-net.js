// utils/polkadot.js
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import dotenv from "dotenv";
dotenv.config();

const WND_ENDPOINT = "wss://westend-asset-hub-rpc.polkadot.io";

/**
 * Mint an NFT on Westend Asset Hub using an existing collection,
 * and attach metadata using setMetadata in a batch transaction.
 */
export async function mintNFTWithMetadata(walletSeed, metadataUrl, collectionId, itemId) {
  await cryptoWaitReady();

  const provider = new WsProvider(WND_ENDPOINT);
  const api = await ApiPromise.create({ provider });

  const keyring = new Keyring({ type: "sr25519" });
  const sender = keyring.addFromUri(walletSeed.trim());

  console.log("🔗 Connected to Westend Asset Hub");
  console.log("🔐 Using wallet:", sender.address);
  console.log("🎯 Minting NFT in collection:", collectionId);
  console.log("📄 Metadata URL:", metadataUrl);

  // 1. Mint (with witness_data = null)
  const mintTx = api.tx.nfts.mint(collectionId, itemId, sender.address, null);

  // 2. Set metadata
  const metadataTx = api.tx.nfts.setMetadata(collectionId, itemId, metadataUrl);

  // 3. Batch both
  const batch = api.tx.utility.batchAll([mintTx, metadataTx]);

  return new Promise(async (resolve, reject) => {
    let unsub;
    const timeout = setTimeout(() => {
      console.warn("⏳ Transaction timed out after 60s");
      if (unsub) unsub();
      reject(new Error("Transaction timeout"));
    }, 60000); // 60 seconds

    try {
      unsub = await batch.signAndSend(sender, (result) => {
        console.log(`📡 Transaction status: ${result.status.type}`);

        if (result.status.isInBlock || result.status.isFinalized) {
          clearTimeout(timeout);

          const blockHash = result.status.isFinalized
            ? result.status.asFinalized.toHex()
            : result.status.asInBlock.toHex();

          const txHash = result.txHash.toHex();

          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(result.dispatchError.asModule);
              const { section, name, docs } = decoded;
              const message = `${section}.${name}`;
              console.warn(`⚠️ Dispatch error: ${message} — ${docs.join(" ")}`);

              unsub?.();
              return resolve({ error: message, block_hash: blockHash, tx_hash: txHash });
            } else {
              const message = result.dispatchError.toString();
              console.warn("⚠️ Dispatch error:", message);
              unsub?.();
              return resolve({ error: message, block_hash: blockHash, tx_hash: txHash });
            }
          }

          console.log(`✅ NFT minted and metadata set in block: ${blockHash}`);
          unsub?.();
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
      clearTimeout(timeout);
      console.error("❌ Mint failed:", err.message || err);
      reject(err);
    } finally {
      await api.disconnect();
    }
  });
}
