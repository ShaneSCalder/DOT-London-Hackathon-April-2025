import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import dotenv from "dotenv";
dotenv.config();

const WND_ENDPOINT = "wss://westend-asset-hub-rpc.polkadot.io";

/**
 * Mint a real NFT on Polkadot Asset Hub testnet (WND).
 * @param {string} walletSeed - The seed phrase or mnemonic from .env
 * @param {string} metadataUrl - The URL pointing to your metadata JSON
 */
export async function mintNFTWithMetadata(walletSeed, metadataUrl) {
  await cryptoWaitReady();

  const provider = new WsProvider(WND_ENDPOINT);
  const api = await ApiPromise.create({ provider });

  const keyring = new Keyring({ type: "sr25519" });
  const sender = keyring.addFromUri(walletSeed);

  const collectionSymbol = "COTD";
  const collectionId = Math.floor(Math.random() * 1000000);

  // Create a unique item ID
  const itemId = Math.floor(Math.random() * 100000000);

  console.log("🔗 Connecting to Westend Asset Hub...");
  console.log("🎯 Minting NFT with metadata:", metadataUrl);

  // Create collection if needed (you may skip this if you already have one)
  const collectionTx = api.tx.uniques.create(collectionId, sender.address);
  const setMetadataTx = api.tx.uniques.setCollectionMetadata(collectionId, metadataUrl, false);

  const mintTx = api.tx.uniques.mint(collectionId, itemId, sender.address);

  const batch = api.tx.utility.batchAll([
    collectionTx,
    setMetadataTx,
    mintTx
  ]);

  return new Promise(async (resolve, reject) => {
    const unsub = await batch.signAndSend(sender, ({ status, events, dispatchError }) => {
      if (dispatchError) {
        reject(dispatchError.toString());
      }

      if (status.isInBlock || status.isFinalized) {
        const blockHash = status.asFinalized?.toHex?.() || status.asInBlock?.toHex?.();
        const txHash = batch.hash.toHex();

        console.log(`✅ NFT minted in block ${blockHash}`);

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
  });
}

