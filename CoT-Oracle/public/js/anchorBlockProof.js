document.addEventListener("DOMContentLoaded", () => {
    const blockProofSelect = document.getElementById("blockProofSelect");
    const compileDeployBtn = document.getElementById("compileDeployBtn");
    const viewContractBtn = document.getElementById("viewContractBtn");
    const contractResult = document.getElementById("contractResult");
  
    async function fetchAndRenderJSON(path) {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        const json = await res.json();
        contractResult.textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        contractResult.textContent = `❌ Error: ${err.message}`;
      }
    }
  
    async function getFileList(folder, startsWith) {
      try {
        const res = await fetch(`/files?folder=${folder}`);
        const files = await res.json();
        return files.filter(name => name.startsWith(startsWith) && name.endsWith(".json"));
      } catch {
        return [];
      }
    }
  
    async function populateBlockProofDropdown() {
      const files = await getFileList("/proofs/blocks", "block_");
      blockProofSelect.innerHTML = '<option value="">-- Select a file --</option>';
      files.forEach(file => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file;
        blockProofSelect.appendChild(option);
      });
    }
  
    compileDeployBtn?.addEventListener("click", async () => {
      const selected = blockProofSelect.value;
      if (!selected) return alert("Please select a block proof file first.");
  
      try {
        const res = await fetch(`/proofs/blocks/${selected}`);
        const data = await res.json();
        const blockId = data.leaves?.block_id || "unknown";
        const proofHash = data.proofHash;
        if (!blockId || !proofHash) throw new Error("Invalid block proof structure");
  
        const confirm = window.confirm(`Deploy smart contract for block:\n${blockId}\n\nProceed?`);
        if (!confirm) return;
  
        const anchorRes = await fetch("/admin/anchor-contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId, proofHash })
        });
  
        const result = await anchorRes.json();
        if (!anchorRes.ok) throw new Error(result.error || "Unknown error");
  
        contractResult.textContent = `✅ Contract deployed:\n` + JSON.stringify(result, null, 2);
      } catch (err) {
        contractResult.textContent = `❌ Deploy error: ${err.message}`;
      }
    });
  
    viewContractBtn?.addEventListener("click", async () => {
      const selected = blockProofSelect.value;
      if (!selected) return alert("Please select a block proof file.");
  
      const blockId = selected.replace("block_", "").replace("_proof.json", "");
      const filePath = `/datain/blocks/block_${blockId}_anchor.json`;
      fetchAndRenderJSON(filePath);
    });
  
    populateBlockProofDropdown();
  });
  
  
  
  