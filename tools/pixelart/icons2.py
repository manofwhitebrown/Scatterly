#!/usr/bin/env python3
"""Silhouette variants of the 8 item icons for undiscovered items: `icon/<item>_sil`. Same size as the discovered icon, flat stone
fill with a lighter top-left rim and a darker outline, so the shape reads on the dark tray plate (no dark blobs).
Usage: icons2.py <core dir>"""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
ITEMS = ('bag', 'keys', 'wallet', 'phone', 'earbuds', 'glasses', 'officeId', 'shoes')
def sil(im):
    w, h = im.size; src = im.load(); out = Image.new('RGBA', (w, h), (0, 0, 0, 0)); o = out.load()
    on = lambda x, y: 0 <= x < w and 0 <= y < h and src[x, y][3] > 0
    for y in range(h):
        for x in range(w):
            if not on(x, y): continue
            edge = not (on(x - 1, y) and on(x + 1, y) and on(x, y - 1) and on(x, y + 1))
            rim = not on(x - 1, y) or not on(x, y - 1) or (not on(x - 1, y - 1))
            o[x, y] = col('stone.1') if edge and not rim else col('stone.4') if rim else col('stone.3') if (x + y) % 5 == 0 else col('stone.2')
    return out
if __name__ == '__main__':
    d = sys.argv[1]
    for n in ITEMS:
        sil(Image.open(os.path.join(d, f'icon__{n}.png')).convert('RGBA')).save(os.path.join(d, f'icon__{n}_sil.png'))
    print('icons2 done')
