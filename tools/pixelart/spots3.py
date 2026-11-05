#!/usr/bin/env python3
"""Restyles two spot kinds the player actually sees: `spot/sofa/*` (hand-built teal sofa from sofa.py) and `spot/rug/*` (the old saturated red
diamond becomes the thin woven cream rug, same footprint mask and pivot). Run AFTER spots.py and sofa.py. Usage: spots3.py <room-slice dir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from spots import peek_open
import sofa as S
def rug_from_mask(path):
    old = Image.open(path).convert('RGBA'); w, h = old.size; src = old.load(); out = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o = out.load()
    on = lambda x, y: 0 <= x < w and 0 <= y < h and src[x, y][3] > 0
    for y in range(h):
        for x in range(w):
            if not on(x, y): continue
            if not (on(x - 1, y) and on(x + 1, y) and on(x, y - 1) and on(x, y + 1)): o[x, y] = col('plaster.1'); continue
            e = 1 - (abs(x + 0.5 - w / 2) / (w / 2) + abs(y + 0.5 - h / 2) / (h / 2))
            if e < 0.16: o[x, y] = col('rose.3') if (x + y) % 4 else col('rose.2')
            elif e < 0.23: o[x, y] = col('plaster.4')
            elif e > 0.3 and (x // 3 + y // 2) % 4 == 0 and (x + y) % 3 == 0: o[x, y] = col('butter.3')
            else: o[x, y] = col('plaster.3') if (x // 2 + y) % 2 else col('plaster.2')
    return out
def save(d, piv, kind, closed, pv):
    p = os.path.join(d, f'spot__{kind}__closed.png'); closed.save(p); peek_open(p).save(os.path.join(d, f'spot__{kind}__open.png'))
    for s in ('closed', 'open'): piv[f'spot/{kind}/{s}'] = {'pivot': list(pv)}
if __name__ == '__main__':
    d = sys.argv[1]; piv = json.load(open(os.path.join(d, 'pivots.json')))
    save(d, piv, 'rug', rug_from_mask(os.path.join(d, 'spot__rug__closed.png')), piv['spot/rug/closed']['pivot'])
    im = S.sofa(); bb = im.getbbox(); c = Image.new('RGBA', (bb[2] - bb[0] + 2, bb[3] - bb[1] + 2)); c.alpha_composite(im.crop(bb), (1, 1))
    save(d, piv, 'sofa', c, [S.OX - bb[0] + 1, S.OY - bb[1] + 1])
    json.dump(piv, open(os.path.join(d, 'pivots.json'), 'w'), indent=0); print('spots3 done')
