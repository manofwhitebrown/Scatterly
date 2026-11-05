#!/usr/bin/env python3
"""Upper-floor slab frames (house atlas) so upper rooms do not float: `prop/slabEdgeL` and `prop/slabEdgeR` are the front-left and
front-right faces of a floor slab for ONE half-tile step (16 px wide, 6 px thick); tile them along the room's front edges, one per 16 px.
`prop/slabShadow` is a 32x16 iso-diamond of checker-dithered palette `shade` to lay under the slab on the ground floor or yard.
Pivot = the face's top-left art pixel for the edges, centre for the shadow. Usage: slab.py <house dir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
T = 6
def edge(left):
    im = Image.new('RGBA', (16, 8 + T + 1), (0, 0, 0, 0)); px = im.load()
    for x in range(16):
        top = (x // 2) if left else (7 - x // 2)
        for y in range(top, top + T + 1):
            d = y - top
            px[x, y] = col('ink') if d == 0 or d == T else col('woodWarm.4') if d == 1 else col('woodWarm.3') if d < 4 else col('woodWarm.2')
        if x in (0, 15): px[x, top + 1] = col('ink')
    return im
def shadow():
    im = Image.new('RGBA', (32, 16), (0, 0, 0, 0)); px = im.load()
    for y in range(16):
        for x in range(32):
            if abs(x + 0.5 - 16) / 16 + abs(y + 0.5 - 8) / 8 <= 1 and (x + y) % 2 == 0: px[x, y] = col('shade')
    return im
if __name__ == '__main__':
    d = sys.argv[1]; piv = json.load(open(os.path.join(d, 'pivots.json')))
    for name, im, pv in (('slabEdgeL', edge(True), (0, 0)), ('slabEdgeR', edge(False), (0, 0)), ('slabShadow', shadow(), (16, 8))):
        pd = Image.new('RGBA', (im.width + 2, im.height + 2), (0, 0, 0, 0)); pd.alpha_composite(im, (1, 1))   # 1 px transparent padding
        pd.save(os.path.join(d, f'prop__{name}.png')); piv[f'prop/{name}'] = {'pivot': [pv[0] + 1, pv[1] + 1]}
    json.dump(piv, open(os.path.join(d, 'pivots.json'), 'w'), indent=0); print('slab done')
