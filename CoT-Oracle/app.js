// app.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateGPTDecision } from './utils/gpt.js';
import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/datain', express.static(path.join(__dirname, 'datain')));
app.use('/proofs', express.static(path.join(__dirname, 'proofs')));
app.use('/ledgerdata', express.static(path.join(__dirname, 'ledgerdata')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// === Routes ===

// Home
app.get('/', (req, res) => {
  res.render('index');
});

// Dashboard
app.get('/admin/dashboard', (req, res) => {
  res.render('admin/dashboard');
});

// Anchor to chain page
app.get('/admin/anchortochain', (req, res) => {
  res.render('admin/anchortochain');
});

// File list API
app.get('/files', (req, res) => {
  const folder = req.query.folder;
  if (!folder || folder.includes("..")) {
    return res.status(400).json({ error: "Invalid folder path" });
  }

  const absolutePath = path.join(__dirname, folder);
  try {
    const files = fs.readdirSync(absolutePath).filter(f => f.endsWith('.json'));
    return res.json(files);
  } catch (err) {
    console.error(`❌ Failed to list files in ${absolutePath}:`, err.message);
    return res.status(500).json({ error: 'Could not read directory' });
  }
});

// 📦 Anchor block proof via smart contract
app.post('/admin/anchor-contract', async (req, res) => {
  const { blockId, proofHash } = req.body;

  if (!blockId || !proofHash) {
    return res.status(400).json({ error: 'Missing blockId or proofHash' });
  }

  const scriptPath = path.join(__dirname, 'scripts/anchorBlockProof.js');
  console.log(`🚀 Contract Anchor requested for blockId: ${blockId}`);

  try {
    const child = spawn('node', [scriptPath, blockId, proofHash]);

    child.stdout.on('data', data =>
      process.stdout.write(`[ANCHOR-CONTRACT STDOUT] ${data.toString().trim()}\n`)
    );
    child.stderr.on('data', data =>
      process.stderr.write(`[ANCHOR-CONTRACT STDERR] ${data.toString().trim()}\n`)
    );

    child.on('close', (code) => {
      if (code !== 0) {
        console.error("❌ Contract anchor script failed with exit code:", code);
        return res.status(500).json({ error: 'Contract anchor process failed' });
      }

      try {
        const outPath = path.join(__dirname, `datain/blocks/block_${blockId}_anchor.json`);
        const result = JSON.parse(fs.readFileSync(outPath));
        console.log(`✅ Contract Anchor complete. File: block_${blockId}_anchor.json`);
        return res.json(result);
      } catch (readErr) {
        console.error("❌ Could not load contract anchor result:", readErr.message);
        return res.status(500).json({ error: 'Contract anchor completed but file not found' });
      }
    });
  } catch (err) {
    console.error('❌ Failed to run contract anchor script:', err.message);
    res.status(500).json({ error: 'Internal error', message: err.message });
  }
});

// 🪙 NFT anchor
app.post('/admin/anchor', async (req, res) => {
  const { blockId } = req.body;
  if (!blockId) {
    return res.status(400).json({ error: 'Missing blockId' });
  }

  const scriptPath = path.join(__dirname, 'scripts/anchorBlockProofNFT.js');
  console.log(`🚀 NFT Anchor requested for blockId: ${blockId}`);

  try {
    const child = spawn('node', [scriptPath, blockId]);

    child.stdout.on('data', data =>
      process.stdout.write(`[ANCHOR-NFT STDOUT] ${data.toString().trim()}\n`)
    );
    child.stderr.on('data', data =>
      process.stderr.write(`[ANCHOR-NFT STDERR] ${data.toString().trim()}\n`)
    );

    child.on('close', (code) => {
      if (code !== 0) {
        console.error("❌ NFT anchor script failed with exit code:", code);
        return res.status(500).json({ error: 'NFT anchor process failed' });
      }

      try {
        const file = path.join(__dirname, `datain/nftblock/nft_block_${blockId}.json`);
        const result = JSON.parse(fs.readFileSync(file));
        console.log(`✅ NFT Anchor complete. File: nft_block_${blockId}.json`);
        return res.json(result);
      } catch (readErr) {
        console.error("❌ Could not load NFT anchor result:", readErr.message);
        return res.status(500).json({ error: 'NFT anchor completed but file not found' });
      }
    });
  } catch (err) {
    console.error('❌ Failed to run NFT anchor script:', err.message);
    res.status(500).json({ error: 'Internal error', message: err.message });
  }
});

// GPT API
app.post('/api/ask', async (req, res) => {
  const { question, context } = req.body;

  if (!question || question.trim() === '') {
    return res.status(400).json({ error: 'Missing question input' });
  }

  try {
    const decision = await generateGPTDecision(question, context);
    res.json(decision);
  } catch (error) {
    console.error('❌ GPT Error:', error.message);
    res.status(500).json({ error: 'Failed to generate decision' });
  }
});

// Decision NFT minting
import mintRouter from './api/mint.js';
app.use('/api/mint', mintRouter);

export default app;

