#!/usr/bin/env node
// Packs assets/frames/<dir>/*.png into public/atlas/<dir>.png + <dir>.json (max 2048x2048, deterministic).
// Same JSON format as tools/pack/pack.py: 'a__b__c.png' -> frame 'a/b/c'; optional pivots.json {name:{pivot,slice}}.
// Usage: node scripts/pack-atlas.mjs [dir ...]   (no args = every directory under assets/frames)
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX = 2048;
const WIDTH = 1024;
const MS = { walk: 100, idle: 400, sleep: 500, react: 150, eat: 200, reach: 120 };

/** 'room-slice' -> 'room:slice', 'puzzle-lights' -> 'puzzle:lights', 'core' -> 'core'. */
export const groupOf = (dir) => dir.replace(/^(room|puzzle)-/, '$1:');

export function packDir(dir, outDir = join(ROOT, 'public', 'atlas')) {
  const src = join(ROOT, 'assets', 'frames', dir);
  const pv = existsSync(join(src, 'pivots.json')) ? JSON.parse(readFileSync(join(src, 'pivots.json'), 'utf8')) : {};
  const items = readdirSync(src)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => ({ name: f.slice(0, -4).replace(/__/g, '/'), png: PNG.sync.read(readFileSync(join(src, f))) }));
  items.sort((a, b) => b.png.height - a.png.height || (a.name < b.name ? -1 : 1));
  let x = 0, y = 0, rowH = 0;
  const pos = new Map();
  for (const it of items) {
    if (x + it.png.width + 1 > WIDTH) { x = 0; y += rowH + 1; rowH = 0; }
    pos.set(it.name, [x, y]);
    x += it.png.width + 1;
    rowH = Math.max(rowH, it.png.height);
  }
  let H = 1;
  while (H < y + rowH) H *= 2;
  if (H > MAX) throw new Error(`${dir}: atlas would be ${WIDTH}x${H} (> ${MAX}); split the folder`);
  const atlas = new PNG({ width: WIDTH, height: H });
  const frames = {};
  const tags = {};
  for (const it of items) {
    const [px, py] = pos.get(it.name);
    PNG.bitblt(it.png, atlas, 0, 0, it.png.width, it.png.height, px, py);
    const p = pv[it.name]?.pivot ?? [Math.floor(it.png.width / 2), it.png.height - 2];
    frames[it.name] = { frame: { x: px, y: py, w: it.png.width, h: it.png.height }, pivot: { x: p[0], y: p[1] } };
    if (pv[it.name]?.slice) frames[it.name].slice = pv[it.name].slice;
    const m = /^(.*)\/(\d+)$/.exec(it.name);
    if (m && (m[1].startsWith('avatar') || m[1].startsWith('pet'))) {
      const t = (tags[m[1]] ??= { from: 99, to: -1 });
      const n = Number(m[2]);
      t.from = Math.min(t.from, n);
      t.to = Math.max(t.to, n);
    }
  }
  const frameTags = Object.keys(tags).sort().map((k) => ({ name: k, from: tags[k].from, to: tags[k].to, ms: MS[k.split('/').pop()] ?? 150 }));
  const out = outDir;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${dir}.png`), PNG.sync.write(atlas));
  writeFileSync(join(out, `${dir}.json`), JSON.stringify({ meta: { image: `${dir}.png`, group: groupOf(dir), size: { w: WIDTH, h: H }, scale: 1, frameTags }, frames }));
  return { dir, frames: items.length, w: WIDTH, h: H };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = join(ROOT, 'assets', 'frames');
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(base).filter((d) => statSync(join(base, d)).isDirectory());
  for (const d of dirs.sort()) console.log(JSON.stringify(packDir(d)));
}
