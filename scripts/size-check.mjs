import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const JS_GZIP_BUDGET = 520 * 1024; // warn
const JS_GZIP_LIMIT = 600 * 1024; // fail
// Manager decision (4 Nov): budget = hard limit = 2560 KB, no more silent growth. New art and audio must be lazy groups.
const DIST_BUDGET = 2560 * 1024; // warn
const DIST_LIMIT = 2560 * 1024; // fail
const BOOT_LIMIT = 1900 * 1024; // fail: index.html plus everything it loads before the first frame

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

let files;
try {
  files = walk(DIST);
} catch {
  console.error(`size-check: "${DIST}" not found. Run vite build first.`);
  process.exit(1);
}

let jsGzip = 0;
let distBytes = 0;
console.log('JS bundles (gzip):');
for (const f of files) {
  const size = statSync(f).size;
  distBytes += size;
  if (!f.endsWith('.js') || !relative(DIST, f).startsWith('assets')) continue;
  const gz = gzipSync(readFileSync(f)).length;
  jsGzip += gz;
  console.log(`  ${relative(DIST, f).padEnd(40)} ${kb(size).padStart(11)} raw  ${kb(gz).padStart(10)} gzip`);
}
console.log(`Total JS gzip: ${kb(jsGzip)} (budget ${kb(JS_GZIP_BUDGET)}, limit ${kb(JS_GZIP_LIMIT)})`);
console.log(`Total dist:    ${kb(distBytes)} (budget ${kb(DIST_BUDGET)}, limit ${kb(DIST_LIMIT)})`);

// Boot payload: index.html + every script / modulepreload / stylesheet it references. Everything else (dynamic chunks,
// atlases, audio, fonts fetched on demand) is lazy and only counts toward the total.
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const refs = new Set([...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]));
let bootBytes = statSync(join(DIST, 'index.html')).size;
for (const ref of refs) {
  const f = resolve(DIST, ref.replace(/^\.?\//, '').replace(/^[^/]*\/(?=assets\/)/, ''));
  try {
    bootBytes += statSync(f).size;
  } catch {
    // external or already counted
  }
}
console.log(`Boot payload:  ${kb(bootBytes)} (limit ${kb(BOOT_LIMIT)}), lazy: ${kb(distBytes - bootBytes)} (atlases, audio, dynamic chunks)`);

let failed = false;
if (bootBytes > BOOT_LIMIT) {
  console.error('FAIL: boot payload is over the limit: make the new art/audio a lazy group.');
  failed = true;
}
if (jsGzip > JS_GZIP_LIMIT) {
  console.error('FAIL: JS gzip size is over the hard limit.');
  failed = true;
} else if (jsGzip > JS_GZIP_BUDGET) {
  console.warn('WARN: JS gzip size is over budget (still under the hard limit).');
}
if (distBytes > DIST_LIMIT) {
  console.error('FAIL: dist size is over the hard limit.');
  failed = true;
} else if (distBytes > DIST_BUDGET) {
  console.warn('WARN: dist size is over budget (still under the hard limit).');
}
process.exit(failed ? 1 : 0);
