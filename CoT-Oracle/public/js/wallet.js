import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";

export async function connectWallet() {
  const extensions = await web3Enable("CoT Oracle Dashboard");
  if (extensions.length === 0) {
    alert("❌ No wallet extension found. Please install Talisman or Polkadot.js");
    return;
  }

  const accounts = await web3Accounts();
  if (accounts.length === 0) {
    alert("🪪 No accounts found in wallet. Please add one and refresh.");
    return;
  }

  const account = accounts[0]; // Or let the user choose
  const injector = await web3FromAddress(account.address);

  // Save for use in signing later
  window.connectedWallet = {
    address: account.address,
    injector
  };

  document.getElementById("walletAddress").textContent = `✅ Connected: ${account.address}`;
}
