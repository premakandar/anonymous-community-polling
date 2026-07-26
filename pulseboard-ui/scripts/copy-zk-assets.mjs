import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '..', '..', 'contract', 'src', 'managed', 'bboard');
const publicDir = path.resolve(__dirname, '..', 'public');

if (!fs.existsSync(src)) {
  console.warn(`[copy-zk-assets] Missing ${src} — run: npm run compact -w @midnight-ntwrk/bboard-contract`);
  process.exit(0);
}

for (const name of ['keys', 'zkir']) {
  const from = path.join(src, name);
  const to = path.join(publicDir, name);
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[copy-zk-assets] ${from} -> ${to}`);
}
