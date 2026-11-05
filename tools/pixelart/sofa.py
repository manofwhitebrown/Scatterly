#!/usr/bin/env python3
"""Hand-built `prop/loungeSofa` (3x1 tiles, faces +gy, back against the gy=0 wall): teal fabric, split seat and back cushions,
rolled arms, four honey feet. Same iso maths as tools/render3d/render.py (origin = footprint top vertex on the ground, 1 art px per z unit),
so the pivot keeps the Kenney convention. Run AFTER the render step. Usage: sofa.py <room-slice dir>"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
OX, OY = 20, 20
def P(gx, gy, z): return (OX + (gx - gy) * 16, OY + (gx + gy) * 8 - z)
def box(d, x0, x1, y0, y1, z0, z1, top, left, right):
    d.polygon([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], fill=left)
    d.polygon([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], fill=right)
    d.polygon([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], fill=top)
def sofa():
    im = Image.new('RGBA', (90, 70), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    def tn(i): return (col(f'teal.{i + 1}'), col(f'teal.{i}'), col(f'teal.{max(0, i - 1)}'))   # top, front-left, front-right
    H = col('teal.4'); T = col('teal.3')
    wd = (col('woodWarm.3'), col('woodWarm.2'), col('woodWarm.1'))
    for fx, fy in ((0.08, 0.08), (2.77, 0.08), (0.08, 0.77), (2.77, 0.77)): box(d, fx, fx + 0.15, fy, fy + 0.15, 0, 3, *wd)   # feet
    box(d, 0, 3, 0, 1, 3, 5, *tn(1))                                           # base frame (darkest)
    box(d, 0.3, 2.7, 0, 0.34, 5, 13, *tn(2))                                   # back
    box(d, 0.34, 1.48, 0.3, 0.6, 5, 11, *tn(3)); box(d, 1.52, 2.66, 0.3, 0.6, 5, 11, *tn(3))   # back cushions (lighter)
    box(d, 0, 0.32, 0, 1, 5, 11, *tn(2))                                       # left arm
    box(d, 0.34, 1.48, 0.55, 1, 5, 8, *tn(3)); box(d, 1.52, 2.66, 0.55, 1, 5, 8, *tn(3))   # seat cushions (lighter)
    box(d, 2.7, 3, 0, 1, 5, 11, *tn(2))                                        # right arm
    px = im.load()
    for x in range(im.width):                                                   # highlight the lit top edge of the arms/cushions
        for y in range(1, im.height):
            if px[x, y][3] and px[x, y - 1][3] == 0 and px[x, y] in (col('teal.3'), col('teal.4')): px[x, y] = H
    out = im.copy(); op = out.load(); ink = col('teal.0')
    for y in range(1, im.height - 1):
        for x in range(1, im.width - 1):
            if px[x, y][3] == 0 and any(px[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): op[x, y] = ink
    return out
if __name__ == '__main__':
    out = sys.argv[1]; piv = json.load(open(os.path.join(out, 'pivots.json')))
    im = sofa(); bb = im.getbbox(); c = Image.new('RGBA', (bb[2] - bb[0] + 2, bb[3] - bb[1] + 2)); c.alpha_composite(im.crop(bb), (1, 1))
    c.save(os.path.join(out, 'prop__loungeSofa.png')); pv = [OX - bb[0] + 1, OY - bb[1] + 1]; piv['prop/loungeSofa'] = {'pivot': pv}
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0); print('sofa done', c.size, pv)
