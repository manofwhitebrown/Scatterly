#!/usr/bin/env python3
"""AI-6 extra WALL decor mounts (same shear/mirror/pivot rules as props2.py): prop/<kind> for the right wall, prop/<kind>_L for the left.
Width is along the wall: 16 px = 1 tile, 32 px = 2 tiles. Usage: wall2.py <assets/frames/room-slice>"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from props import L
from props2 import shear, padded
from yard import outline, new
class Cv:
    def __init__(self, w, h): self.im = new(w, h); self.px = self.im.load(); self.w, self.h = w, h
    def r(self, x, y, w, h, ch):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < self.w and 0 <= yy < self.h: self.px[xx, yy] = col(L[ch])
def shelf(c, y):
    c.r(0, y, c.w, 1, 'N'); c.r(0, y + 1, c.w, 1, 'n'); c.r(1, y + 2, 2, 1, 'm'); c.r(c.w - 3, y + 2, 2, 1, 'm')
def shelfBooks():
    c = Cv(16, 11)
    for x, h, a, b in ((1, 6, 'v', 'V'), (3, 7, 'r', 'R'), (5, 5, 'y', 'Y'), (7, 7, 'g', 'G'), (9, 6, 'b', 'B'), (11, 5, 'p', 'P'), (13, 6, 'v', 'V')):
        c.r(x, 8 - h, 2, h, a); c.r(x + 1, 8 - h, 1, h, b); c.r(x, 8 - h + 1, 2, 1, 'o')
    shelf(c, 8); return c.im
def shelfPlants():
    c = Cv(16, 12)
    c.r(1, 6, 4, 2, 'r'); c.r(2, 8, 2, 0, 'r'); c.r(1, 3, 4, 3, 'g'); c.r(2, 2, 2, 2, 'G'); c.r(3, 1, 1, 1, 'G')
    c.r(7, 5, 2, 3, 'w'); c.r(7, 4, 2, 1, 'y'); c.r(8, 3, 1, 1, 'Y')
    c.r(11, 6, 4, 2, 'b'); c.r(11, 4, 1, 2, 'g'); c.r(13, 3, 1, 3, 'G'); c.r(14, 4, 1, 2, 'g'); c.r(12, 2, 1, 2, 'G')
    shelf(c, 8); return c.im
def pictureWide():
    c = Cv(30, 16); c.r(0, 0, 30, 16, 'n'); c.r(1, 1, 28, 14, 'N'); c.r(2, 2, 26, 12, 'b'); c.r(2, 2, 26, 5, 'B')
    c.r(21, 3, 3, 3, 'Y'); c.r(2, 9, 26, 5, 'g'); c.r(2, 11, 26, 3, 'G'); c.r(6, 8, 8, 2, 'g'); c.r(5, 9, 10, 1, 'g'); c.r(18, 10, 2, 1, 'h')
    c.r(11, 11, 4, 2, 'w'); c.r(12, 10, 2, 1, 'w'); return c.im
def pictureTriptych():
    c = Cv(30, 12)
    for x, a, b in ((0, 'g', 'G'), (10, 'p', 'P'), (20, 'b', 'B')):
        c.r(x, 0, 10, 12, 'n'); c.r(x + 1, 1, 8, 10, 'w'); c.r(x + 2, 2, 6, 8, a); c.r(x + 2, 6, 6, 4, b); c.r(x + 4, 4, 2, 2, 'o')
    return c.im
def towelRail():
    c = Cv(16, 13); c.r(1, 1, 14, 1, 'k'); c.r(0, 0, 2, 3, 'K'); c.r(14, 0, 2, 3, 'K')
    c.r(3, 2, 10, 9, 'b'); c.r(3, 4, 10, 1, 'o'); c.r(3, 7, 10, 1, 'o'); c.r(12, 2, 1, 9, 'B'); c.r(3, 11, 10, 1, 'B')
    for x in range(3, 13, 2): c.r(x, 12, 1, 1, 'B')
    return c.im
def coatHooks():
    c = Cv(16, 14); c.r(0, 0, 16, 3, 'n'); c.r(0, 0, 16, 1, 'N'); c.r(0, 2, 16, 1, 'm')
    for x in (2, 7, 12): c.r(x, 3, 1, 2, 'j')
    c.r(5, 5, 6, 0, 'r'); c.r(1, 5, 3, 7, 'v'); c.r(1, 5, 1, 7, 'V'); c.r(2, 9, 2, 1, 'o')
    c.r(6, 5, 3, 3, 'y'); c.r(5, 7, 5, 1, 'Y'); c.r(11, 5, 3, 8, 'r'); c.r(13, 5, 1, 8, 'R'); c.r(11, 8, 3, 1, 'o')
    return c.im
KINDS = {'shelfBooks': shelfBooks, 'shelfPlants': shelfPlants, 'pictureWide': pictureWide, 'pictureTriptych': pictureTriptych, 'towelRail': towelRail, 'coatHooks': coatHooks}
if __name__ == '__main__':
    out = sys.argv[1]; pj = os.path.join(out, 'pivots.json'); piv = json.load(open(pj))
    for k, fn in KINDS.items():
        flat = fn()
        for left in (False, True):
            im, pv = shear(flat, left); im, pv = padded(outline(padded(im, pv)[0]), (pv[0] + 1, pv[1] + 1))
            key = f'prop/{k}' + ('_L' if left else ''); im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pv)}
    json.dump(piv, open(pj, 'w'), indent=0); print('wall2 done', len(KINDS) * 2)
