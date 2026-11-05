#!/usr/bin/env python3
"""Hand-built double bed spot (3x2 tiles): headboard at the gx=0 end, pillows, folded blanket, footboard.
Replaces the Kenney bedDouble slab. Pivot = footprint top vertex (same as the other spot frames). Run AFTER spots.py.
Usage: bed.py <room-slice dir>"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from spots import peek_open
M = 3
def P(gx, gy, z): return (32 + (gx - gy) * 16 + M, (gx + gy) * 8 - z + 30 + M)
def box(d, x0, x1, y0, y1, z0, z1, top, left, right):
    d.polygon([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], fill=left)    # front-left face
    d.polygon([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], fill=right)   # front-right face
    d.polygon([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], fill=top)
def bed():
    im = Image.new('RGBA', (84, 78 + M), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    wL, wR, wT = col('woodWarm.2'), col('woodWarm.1'), col('woodWarm.3')
    box(d, 0, 0.3, 0, 2, 0, 24, wT, wL, wR)                                   # headboard
    box(d, 0.3, 3, 0.05, 1.95, 0, 6, wT, wL, wR)                              # frame
    box(d, 0.3, 2.95, 0.12, 1.88, 6, 11, col('plaster.4'), col('plaster.3'), col('plaster.2'))  # mattress
    box(d, 1.15, 2.95, 0.1, 1.9, 11, 13, col('terracotta.3'), col('terracotta.2'), col('terracotta.1'))  # blanket
    box(d, 1.0, 1.35, 0.1, 1.9, 11, 13.5, col('plaster.4'), col('plaster.3'), col('plaster.2'))          # folded-back sheet
    for a, b in ((0.25, 0.95), (1.05, 1.75)):
        box(d, 0.4, 0.95, a, b, 11, 15, col('plaster.4'), col('plaster.3'), col('plaster.2'))             # pillows
    box(d, 2.85, 3, 0.05, 1.95, 0, 10, wT, wL, wR)                            # footboard
    px = im.load(); out = im.copy(); op = out.load(); ink = col('woodDark.0')
    for y in range(1, im.height - 1):
        for x in range(1, im.width - 1):
            if px[x, y][3] == 0 and any(px[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): op[x, y] = ink
    return out, (32 + M, 30 + M - 0)
if __name__ == '__main__':
    out = sys.argv[1]; piv = json.load(open(os.path.join(out, 'pivots.json')))
    im, pv = bed(); bb = im.getbbox(); pv = (pv[0] - bb[0] + 1, pv[1] - bb[1] + 1)
    c = Image.new('RGBA', (bb[2] - bb[0] + 2, bb[3] - bb[1] + 2)); c.alpha_composite(im.crop(bb), (1, 1))
    c.save(os.path.join(out, 'spot__bed__closed.png'))
    peek_open(os.path.join(out, 'spot__bed__closed.png')).save(os.path.join(out, 'spot__bed__open.png'))
    for s in ('closed', 'open'): piv[f'spot/bed/{s}'] = {'pivot': list(pv)}
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0); print('bed done', c.size, pv)
