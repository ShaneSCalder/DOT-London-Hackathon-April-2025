document.addEventListener("DOMContentLoaded", () => {
    const memoSelect = document.getElementById("memoSelect");
    const proofSelect = document.getElementById("proofSelect");
    const blockProofSelect = document.getElementById("blockProofSelect");
    const anchoredBlockSelect = document.getElementById("anchoredBlockSelect");
  
    const viewer = document.getElementById("jsonViewer");
  
    const loadBlocksBtn = document.getElementById("loadBlocksBtn");
    const loadLedgerBtn = document.getElementById("loadLedgerBtn");
    const anchorBlockNFTBtn = document.getElementById("anchorBlockNFTBtn");
  
    // ✅ Render JSON in viewer
    async function fetchAndRenderJSON(path) {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        const json = await res.json();
        viewer.textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        viewer.textContent = `❌ Error: ${err.message}`;
      }
    }
  
    // ✅ File list filter
    async function getFileList(folder, startsWith) {
      try {
        const res = await fetch(`/files?folder=${folder}`);
        const files = await res.json();
        return files.filter(name => name.startsWith(startsWith) && name.endsWith(".json"));
      } catch {
        return [];
      }
    }
  
    // ✅ Populate dropdowns
    function populateSelect(select, files, basePath) {
      select.innerHTML = '<option value="">-- Select a file --</option>';
      files.forEach(file => {
        const option = document.createElement("option");
        option.value = basePath + file;
        option.textContent = file;
        select.appendChild(option);
      });
    }
  
    async function populateDropdowns() {
      const memoFiles = await getFileList("/datain", "memo_");
      const proofFiles = await getFileList("/proofs", "memo_");
      const blockProofFiles = await getFileList("/proofs/blocks", "block_");
      const anchoredNFTs = await getFileList("/datain/nftblock", "nft_block_");
  
      populateSelect(memoSelect, memoFiles, "/datain/");
      populateSelect(proofSelect, proofFiles, "/proofs/");
      populateSelect(blockProofSelect, blockProofFiles, "/proofs/blocks/");
      populateSelect(anchoredBlockSelect, anchoredNFTs, "/datain/nftblock/");
    }
  
    // ✅ Dropdown handlers
    memoSelect.addEventListener("change", () => {
      if (memoSelect.value) fetchAndRenderJSON(memoSelect.value);
    });
  
    proofSelect.addEventListener("change", () => {
      if (proofSelect.value) fetchAndRenderJSON(proofSelect.value);
    });
  
    blockProofSelect.addEventListener("change", () => {
      if (blockProofSelect.value) fetchAndRenderJSON(blockProofSelect.value);
    });
  
    anchoredBlockSelect?.addEventListener("change", () => {
      if (anchoredBlockSelect.value) fetchAndRenderJSON(anchoredBlockSelect.value);
    });
  
    loadBlocksBtn.addEventListener("click", () => {
      fetchAndRenderJSON("/ledgerdata/ledgerblocksmemo.json");
    });
  
    loadLedgerBtn.addEventListener("click", () => {
      fetchAndRenderJSON("/ledgerdata/ledger.json");
    });
  
    // 🪙 NFT anchor (preferred path)
    anchorBlockNFTBtn?.addEventListener("click", async () => {
      const selected = blockProofSelect.value;
      if (!selected) return alert("Please select a block proof first.");
  
      try {
        const res = await fetch(selected);
        const data = await res.json();
  
        const fileName = selected.split("/").pop(); // block_block_1_proof.json
        const blockId = fileName.replace("block_", "").replace("_proof.json", "");
  
        const proofHash = data.proofHash;
        if (!blockId || !proofHash) throw new Error("Invalid block proof structure.");
  
        const confirm = window.confirm(`Mint NFT for block "${blockId}" with proof hash:\n${proofHash}\n\nProceed?`);
        if (!confirm) return;
  
        const anchorRes = await fetch("/admin/anchor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId })
        });
  
        const result = await anchorRes.json();
        if (!anchorRes.ok) throw new Error(result.error || "Unknown error");
  
        viewer.textContent = `✅ NFT anchor complete:\n` + JSON.stringify(result, null, 2);
        await populateDropdowns();
      } catch (err) {
        viewer.textContent = `❌ NFT anchor error: ${err.message}`;
      }
    });
  
    // Load data on page ready
    populateDropdowns();
  });
  