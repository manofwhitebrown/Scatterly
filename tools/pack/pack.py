#!/usr/bin/env python3
"""Atlas packer (AI-4; AI-1's scripts/pack-atlas.mjs did not exist). assets/frames/<dir>/*.png (+ optional pivots.json) ->
public/atlas/<group>.png + <group>.json (Aseprite-style: frames{name:{frame,pivot}}, meta.frameTags). Filename 'a__b__c.png' -> frame 'a/b/c'.
Usage: pack.py  (packs every dir below). Shelf packing, max width 1024. Output PNG is RGBA (palette-exact pixels; PNG8 conversion left to AI-1's pipeline)."""
import json, os, re, sys
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
GROUPS = {'core': 'core', 'room-slice': 'room:slice'}
MS = {'walk': 100, 'idle': 400, 'sleep': 500, 'react': 150, 'eat': 200, 'reach': 120}
def pack(d, group):
    src = os.path.join(ROOT, 'assets', 'frames', d); pv = {}
    if os.path.exists(os.path.join(src, 'pivots.json')): pv = json.load(open(os.path.join(src, 'pivots.json')))
    items = []
    for fn in sorted(os.listdir(src)):
        if fn.endswith('.png'): items.append((fn[:-4].replace('__', '/'), Image.open(os.path.join(src, fn)).convert('RGBA')))
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
