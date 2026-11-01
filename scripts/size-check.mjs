import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const JS_GZIP_BUDGET = 450 * 1024; // warn
const JS_GZIP_LIMIT = 600 * 1024; // fail
const DIST_BUDGET = 2 * 1024 * 1024; // warn
const DIST_LIMIT = 2.5 * 1024 * 1024; // fail

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

let failed = false;
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
