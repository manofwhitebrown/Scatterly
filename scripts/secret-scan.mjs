import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Fails when a GitHub token appears anywhere in the tree (the repo is public).
const PATTERNS = [/github_pat_[A-Za-z0-9_]{10,}/, /ghp_[A-Za-z0-9]{10,}/, /gho_[A-Za-z0-9]{10,}/];
const SKIP = new Set(['node_modules', '.git', 'dist', 'test-results', 'playwright-report', 'android']);
const SELF = 'scripts/secret-scan.mjs';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (st.size < 5 * 1024 * 1024) out.push(p);
  }
  return out;
}

let bad = 0;
for (const f of walk('.')) {
  const rel = f.replace(/^\.\//, '');
  if (rel === SELF) continue;
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue;
  for (const re of PATTERNS) {
    if (re.test(text)) {
      console.error(`secret-scan: token-like string in ${rel} (pattern ${re}). Remove it and tell the owner.`);
      bad++;
    }
  }
}
if (bad > 0) process.exit(1);
console.log('secret-scan: clean');
