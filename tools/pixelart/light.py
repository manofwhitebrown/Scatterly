#!/usr/bin/env python3
"""Window glow overlays (B): `fx/windowGlow/0` right wall (gy=0, sheared down-right), `/1` left wall (mirror), day = warm pane light with a dithered
halo; `/2`,`/3` the same at night (brighter, butter panes). Size = a 2-tile window (32 art px wide, 20 tall). Pivot = window's bottom-left wall point
(right wall) / bottom-right (left wall), same convention as mount props. Also `fx/lampGlow/0` (round dithered glow, pivot centre).
Usage: light.py <house dir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from yard import new
from props2 import shear, padded
def pane(night):
    W, H, m = 32, 20, 4
    im = new(W + 2 * m, H + 2 * m); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            dx, dy = max(m - x, 0, x - (m + W - 1)), max(m - y, 0, y - (m + H - 1))
            d = max(dx, dy)
            if d == 0:
                edge = x in (m, m + W - 1) or y in (m, m + H - 1)
                mun = (x - m) % 16 == 8 or y == m + H // 2
                px[x, y] = col('plaster.4') if edge or mun else col('butter.4') if (night or (x + y) % 5 == 0) else col('butter.3')
            elif d <= m and ((x + y) % 2 == 0 if d <= 2 else (x % 2 == 0 and y % 2 == 0)): px[x, y] = col('glow')
    return im
def lamp():
    im = new(30, 30); px = im.load()
    import math
    for y in range(30):
        for x in range(30):
            d = math.hypot(x - 14.5, y - 14.5)
            if d < 4 or (d < 14 and x % 2 == 0 and y % 2 == 0) or (d < 9 and (x + y) % 2 == 0): px[x, y] = col('glow')
    return im
if __name__ == '__main__':
    out = sys.argv[1]; piv = json.load(open(os.path.join(out, 'pivots.json')))
    def save(key, im, pv):
        im, pv = padded(im, pv); im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pv)}
    for n, night in ((0, False), (2, True)):
        for left in (False, True):
            im, pv = shear(pane(night), left); save(f'fx/windowGlow/{n + left}', im, (pv[0] + (0 if left else 4), pv[1] - 4 if not left else pv[1] - 4))
    save('fx/lampGlow/0', lamp(), (15, 15))
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0); print('light done')
