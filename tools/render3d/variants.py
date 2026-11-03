#!/usr/bin/env python3
"""Closed/open variants. Open = same frame size and anchor; the front face (tone 2 pixels, facing +gy) gets a dark opening
(special 'shade') inset 2 px, a lit door/drawer edge strip (tone 3) and a 1 px outline. Usage: variants.py <spec.json> <kenney OBJ dir> <out dir>"""
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from render import render, PAL, RAMPS, COL, hx
SHADE = hx(PAL['specials']['shade']) + (255,)
def open_variant(img, kind):
    a = img.copy(); h, w = a.shape[:2]
    ramp_of = {tuple(COL[i]): i // 5 for i in range(len(COL))}; tone_of = {tuple(COL[i]): i % 5 for i in range(len(COL))}
    front = np.zeros((h, w), bool)
    for y in range(h):
        for x in range(w):
            c = tuple(a[y, x, :3])
            if a[y, x, 3] and tone_of.get(c) == 2: front[y, x] = True
    ys, xs = np.nonzero(front)
    if len(xs) < 20: return a
    # the front face is the left-hand big flat region: take the leftmost half of the tone-2 pixels
    xm = xs.min() + (xs.max() - xs.min()) * 0.62
    sel = front & (np.arange(w)[None, :] <= xm)
    ys, xs = np.nonzero(sel); x0, x1, y0, y1 = xs.min() + 2, xs.max() - 1, ys.min() + 2, ys.max() - 1
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if sel[y, x] and sel[y - 1, x] and sel[y, x - 1]: a[y, x] = SHADE
    for y in range(y0 - 1, y1 + 2):                 # lit ajar edge on the left
        for x in range(x0 - 1, x0 + 1):
            if 0 <= y < h and sel[min(max(y, 0), h - 1), max(x, 0)]: a[y, x] = (*COL[ramp_of.get(tuple(a[y, x, :3]), 0) * 5 + 3], 255)
    if kind in ('drawer', 'sink'):                  # slab pulled toward the viewer: lit rectangle below the opening
        for y in range(y1 - 1, min(h - 1, y1 + 3)):
            for x in range(x0, x1 + 1):
                if a[y, x, 3]: a[y, x] = (*COL[ramp_of.get(tuple(a[y, x, :3]), 0) * 5 + 3], 255)
    return a
if __name__ == '__main__':
    spec = json.load(open(sys.argv[1])); mdir = sys.argv[2]; out = sys.argv[3]; os.makedirs(out, exist_ok=True); meta = {}
    for kind, s in spec.items():
        img, pv, m = render(mdir, s['model'], tuple(s['foot']), s['h'], s.get('ramps'))
        for state, im in (('closed', img), ('open', open_variant(img, kind))):
            fn = f'spot__{kind}__{state}.png'; Image.fromarray(im).save(os.path.join(out, fn)); meta[f'spot/{kind}/{state}'] = {'size': m['size'], 'pivot': m['pivot'], 'file': fn}
    json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=1); print(len(meta), 'frames')
