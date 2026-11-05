#!/usr/bin/env python3
"""Atlas packer (AI-4; AI-1's scripts/pack-atlas.mjs did not exist). assets/frames/<dir>/*.png (+ optional pivots.json) ->
public/atlas/<group>.png + <group>.json (Aseprite-style: frames{name:{frame,pivot}}, meta.frameTags). Filename 'a__b__c.png' -> frame 'a/b/c'.
Usage: pack.py  (packs every dir below). Shelf packing, max width 1024. Output PNG is RGBA (palette-exact pixels; PNG8 conversion left to AI-1's pipeline)."""
import json, os, re, sys
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
GROUPS = {'core': 'core', 'room-slice': 'room:slice', 'house': 'house'}
for _k in ('untangle', 'lights', 'mastermind'): GROUPS['puzzle-' + _k] = 'puzzle:' + _k   # puzzle skin atlases
for _r in ('entrance', 'living', 'kitchen', 'bathroom', 'bedroom', 'study'): GROUPS['room-' + _r] = 'room:' + _r   # one shell atlas per room
def floor_kinds():
    """Floor-standing prop kinds (not flat/top/mount) parsed from src/content/worldKinds.ts: these get a baked contact shadow."""
    t = open(os.path.join(ROOT, 'src', 'content', 'worldKinds.ts')).read()
    return {m.group(1) for m in re.finditer(r'(\w+): B\(([^)]*)\)', t) if not re.search(r'flat|top|mount', m.group(2))}
SHADE = (0x3a, 0x2a, 0x4a, 255)
def with_shadow(im):
    """Checker-dithered palette 'shade' ellipse behind the sprite base (2 px extra canvas at the bottom, pivot unchanged). Source PNGs stay clean."""
    bb = im.getbbox()
    if not bb: return im
    w = bb[2] - bb[0]; cx = (bb[0] + bb[2] - 1) / 2; rx = max(5, w * 0.5); ry = max(3, min(6, rx / 2.2)); cy = bb[3] - 2
    out = Image.new('RGBA', (im.width, im.height + 2), (0, 0, 0, 0)); px = out.load()
    for y in range(max(0, int(cy - ry)), min(out.height, int(cy + ry) + 1)):
        for x in range(out.width):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 and (x + y) % 2 == 0: px[x, y] = SHADE
    out.alpha_composite(im, (0, 0)); return out
MS = {'walk': 100, 'idle': 400, 'sleep': 500, 'react': 150, 'eat': 200, 'reach': 120}
def pack(d, group):
    src = os.path.join(ROOT, 'assets', 'frames', d); pv = {}
    if os.path.exists(os.path.join(src, 'pivots.json')): pv = json.load(open(os.path.join(src, 'pivots.json')))
    items = []; fk = floor_kinds() if d == 'room-slice' else set()
    for fn in sorted(os.listdir(src)):
        if fn.endswith('.png'):
            name = fn[:-4].replace('__', '/'); im = Image.open(os.path.join(src, fn)).convert('RGBA')
            if name.startswith('prop/') and name[5:] in fk: im = with_shadow(im)
            items.append((name, im))
    items.sort(key=lambda t: (-t[1].height, t[0]))
    x = y = rowh = 0; W = 1024; pos = {}
    for name, im in items:
        if x + im.width + 1 > W: x, y, rowh = 0, y + rowh + 1, 0
        pos[name] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
    H = 1
    while H < y + rowh: H *= 2
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); frames = {}; tags = {}
    for name, im in items:
        px, py = pos[name]; atlas.paste(im, (px, py))
        p = pv.get(name, {}).get('pivot', [im.width // 2, im.height - 2])
        frames[name] = {'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height}, 'pivot': {'x': p[0], 'y': p[1]}}
        if 'slice' in pv.get(name, {}): frames[name]['slice'] = pv[name]['slice']
        m = re.match(r'^(.*)/(\d+)$', name)
        if m and (m.group(1).startswith('avatar') or m.group(1).startswith('pet')):
            t = tags.setdefault(m.group(1), {'from': 99, 'to': -1}); n = int(m.group(2)); t['from'] = min(t['from'], n); t['to'] = max(t['to'], n)
    ft = [{'name': k, 'from': v['from'], 'to': v['to'], 'ms': MS.get(k.split('/')[-1], 150)} for k, v in sorted(tags.items())]
    out = os.path.join(ROOT, 'public', 'atlas'); os.makedirs(out, exist_ok=True)
    atlas.save(os.path.join(out, d + '.png'))
    json.dump({'meta': {'image': d + '.png', 'group': group, 'size': {'w': W, 'h': H}, 'scale': 1, 'frameTags': ft}, 'frames': frames}, open(os.path.join(out, d + '.json'), 'w'))
    return len(items), W, H
if __name__ == '__main__':
    for d, g in GROUPS.items(): print(d, pack(d, g))
