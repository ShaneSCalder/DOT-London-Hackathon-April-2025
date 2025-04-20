// scripts/checkHubWallets.js
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import dotenv from "dotenv";
dotenv.config();

const ASSET_HUB_ENDPOINT = "wss://westend-asset-hub-rpc.polkadot.io";

const seedKeys = Object.entries(process.env).filter(([k]) =>
  k.startsWith("HUB_") && k.endsWith("_WALLET_SEED")
);

if (seedKeys.length === 0) {
  console.error("❌ No HUB_*_WALLET_SEED entries found in .env");
  process.exit(1);
}

async function checkBalances() {
  await cryptoWaitReady();
  const provider = new WsProvider(ASSET_HUB_ENDPOINT);
  const api = await ApiPromise.create({ provider });

  const keyring = new Keyring({ type: "sr25519" });

  console.log("🔍 Checking Asset Hub balances:\n");

  for (const [key, seed] of seedKeys) {
    try {
      const pair = keyring.addFromUri(seed.trim());
      const { data: balance } = await api.query.system.account(pair.address);

      console.log(`${key.replace("_WALLET_SEED", "")} (${pair.address}) → 💰 ${balance.free.toHuman()}`);
    } catch (err) {
      console.error(`❌ Failed to check ${key}: ${err.message}`);
    }
  }

  process.exit(0);
}

checkBalances().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
  process.exit(1);
});
