#!/usr/bin/env python3
"""Staircase (B): prop/stairsUp, 1x3 tiles, 12 steps of 6 art px climbing toward -gy (the far wall), plus shell/house/stairwell
(2x1 tile hole in the upper floor with a cream rim). Pivot = footprint top vertex (gx=0, gy=0 at floor level). Usage: stairs.py <outdir>"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from yard import outline, new
def P(gx, gy, z, ox, oy): return (round((gx - gy) * 16) + ox, round((gx + gy) * 8 - z) + oy)
def stairs(w=1, d=3, n=12, rise=6):
    top = n * rise; ox, oy = d * 16 + 4, top + 4
    im = new(int((w + d) * 16) + 8, int((w + d) * 8) + top + 8); dr = ImageDraw.Draw(im); step = d / n
    for i in range(n - 1, -1, -1):
        y0, y1, z = d - (i + 1) * step, d - i * step, (i + 1) * rise
        f = lambda gx, gy, zz: P(gx, gy, zz, ox, oy)
        dr.polygon([f(0, y1, 0), f(w, y1, 0), f(w, y1, z), f(0, y1, z)], fill=col('plaster.3'))                # riser (faces +gy)
        dr.polygon([f(w, y0, 0), f(w, y1, 0), f(w, y1, z), f(w, y0, z)], fill=col('woodDark.3'))             # side (+gx)
        dr.polygon([f(0, y0, z), f(w, y0, z), f(w, y1, z), f(0, y1, z)], fill=col('woodWarm.4' if i % 2 else 'woodWarm.3'))   # tread
    return outline(im), (ox, oy)
def stairwell():
    ox, oy = 36, 4; im = new(80, 40); dr = ImageDraw.Draw(im); f = lambda gx, gy: P(gx, gy, 0, ox, oy)
    dr.polygon([f(0, 0), f(2, 0), f(2, 1), f(0, 1)], fill=col('plaster.4'))
    dr.polygon([f(0.12, 0.2), f(1.88, 0.2), f(1.88, 0.88), f(0.12, 0.88)], fill=col('shade'))
    return outline(im), (ox, oy)
if __name__ == '__main__':
    out = sys.argv[1]; piv = json.load(open(os.path.join(out, 'pivots.json'))) if os.path.exists(os.path.join(out, 'pivots.json')) else {}
    for key, (im, pv) in (('prop/stairsUp', stairs()), ('shell/house/stairwell', stairwell())):
        im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pv)}; print(key, im.size, pv)
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0)
