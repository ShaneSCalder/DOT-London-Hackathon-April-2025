// scripts/creatememoledger.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ If you still want to use execSync, use dynamic import
import { execSync } from 'child_process';

// Resolve __dirname and __filename in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const LEDGER_DIR = path.resolve(__dirname, "../ledgerdata");
const LEDGER_FILE = path.join(LEDGER_DIR, "ledger.json");
const CONFIG_FILE = path.resolve(__dirname, "../data/ledger_config.json");

// Ensure ledgerdata exists
if (!fs.existsSync(LEDGER_DIR)) {
  console.log(`⚠️ Ledger directory '${LEDGER_DIR}' not found. Creating it...`);
  fs.mkdirSync(LEDGER_DIR, { recursive: true });
}

// Ensure config exists
if (!fs.existsSync(CONFIG_FILE)) {
  console.error(`❌ Error: Ledger configuration file '${CONFIG_FILE}' not found.`);
  process.exit(1);
}

// Read config
let ledgerConfig;
try {
  ledgerConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
} catch (err) {
  console.error(`❌ Error reading ledger config: ${err.message}`);
  process.exit(1);
}

// Validate
if (!ledgerConfig.ledger_id || ledgerConfig.block_size <= 0 || !ledgerConfig.fields) {
  console.error(`❌ Error: Invalid values in ledger_config.json`);
  process.exit(1);
}

// Add timestamp
ledgerConfig.created_at = new Date().toISOString();

// Write ledger file
fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledgerConfig, null, 2), "utf-8");
console.log(`✅ Ledger successfully created at '${LEDGER_FILE}'`);
