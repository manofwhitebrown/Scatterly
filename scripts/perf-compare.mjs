// Fails (exit 1) if current perf is more than 20% worse than docs/status/perf-baseline.json.
// Use --update to (re)write the baseline from the current run.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const CUR = 'test-results/perf-current.json';
const BASE = 'docs/status/perf-baseline.json';
const LIMIT = 0.2;

if (!existsSync(CUR)) {
  console.error(`No ${CUR}: run the e2e perf test first.`);
  process.exit(1);
}
const cur = JSON.parse(readFileSync(CUR, 'utf8'));
if (process.argv.includes('--update') || !existsSync(BASE)) {
  writeFileSync(BASE, JSON.stringify(cur, null, 2) + '\n');
  console.log(`Baseline written to ${BASE}:`, cur);
  process.exit(0);
}
const base = JSON.parse(readFileSync(BASE, 'utf8'));
const checks = [
  ['bootMs', cur.bootMs, base.bootMs, 'higher'],
  ['p95Ms', cur.p95Ms, base.p95Ms, 'higher'],
  ['p5Fps', cur.p5Fps, base.p5Fps, 'lower'],
];
let bad = false;
for (const [name, c, b, worse] of checks) {
  const ratio = worse === 'higher' ? c / b : b / c;
  const fail = Number.isFinite(ratio) && ratio > 1 + LIMIT;
  console.log(`${fail ? 'FAIL' : 'ok  '} ${name}: current ${Number(c).toFixed(1)} vs baseline ${Number(b).toFixed(1)}`);
  if (fail) bad = true;
}
if (cur.maxMs > 100) console.log(`warn: max frame ${cur.maxMs.toFixed(0)} ms (> 100, G2 real-phone check applies)`);
process.exit(bad ? 1 : 0);
