// Asset integrity (G7, G13, M18): ledger complete, atlas/audio budgets. Passes when no assets exist yet.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const KB = 1024;
const BUDGET = { imagesMB: 8, audioMB: 8, distMB: 18 };
const errors = [];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

// 1. Ledger: every file under assets/ needs a line in docs/art/LICENSES.md.
const ledgerPath = 'docs/art/LICENSES.md';
const ledger = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : '';
const assetFiles = walk('assets');
for (const f of assetFiles) {
  const rel = relative('assets', f).split('\\').join('/');
  const name = rel.split('/').pop();
  if (!ledger.includes(rel) && !ledger.includes(name) && !ledger.includes(rel.split('/')[0] + '/')) {
    errors.push(`ledger: assets/${rel} has no line in ${ledgerPath}`);
  }
}

// 2. Budgets on the build output, when it exists.
const sizeMB = (files) => files.reduce((n, f) => n + statSync(f).size, 0) / KB / KB;
const dist = walk('dist');
if (dist.length) {
  const img = sizeMB(dist.filter((f) => /\.(png|webp|jpg|jpeg|gif|svg)$/i.test(f)));
  const aud = sizeMB(dist.filter((f) => /\.(ogg|mp3|wav|m4a)$/i.test(f)));
  const all = sizeMB(dist);
  if (img > BUDGET.imagesMB) errors.push(`budget: images ${img.toFixed(1)} MB > ${BUDGET.imagesMB}`);
  if (aud > BUDGET.audioMB) errors.push(`budget: audio ${aud.toFixed(1)} MB > ${BUDGET.audioMB}`);
  if (all > BUDGET.distMB) errors.push(`budget: dist ${all.toFixed(1)} MB > ${BUDGET.distMB}`);
  // Atlas pages are at most 2048x2048 (PNG IHDR width/height at byte 16/20).
  for (const f of walk('public/atlas').filter((p) => p.endsWith('.png'))) {
    const b = readFileSync(f);
    const w = b.readUInt32BE(16);
    const h = b.readUInt32BE(20);
    if (w > 2048 || h > 2048) errors.push(`atlas: ${f} is ${w}x${h} (max 2048)`);
  }
}

if (errors.length) {
  console.error('check-assets: FAILED\n' + errors.map((e) => '  ' + e).join('\n'));
  process.exit(1);
}
console.log(`check-assets: ok (${assetFiles.length} asset files, ledger ${ledger ? 'present' : 'absent'})`);
