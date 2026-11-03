#!/usr/bin/env python3
"""Pixel sprite DSL: rows of characters + legend 'char -> ramp.tone' (tone 0..4 = outline,shadow,base,light,highlight).
'.' is transparent. Outline is added automatically (ramp[0] of the neighbouring fill) unless outline=False. Pivot defaults to bottom-centre."""
import json, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
PAL = json.load(open(os.path.join(HERE, '..', '..', 'docs', 'art', 'palette.json')))
def hx(s): return tuple(int(s[i:i+2], 16) for i in (1, 3, 5)) + (255,)
def col(spec):
    if spec in PAL['specials']: return hx(PAL['specials'][spec])
    r, t = spec.split('.'); return hx(PAL['ramps'][r][int(t)])
def build(rows, legend, outline=True):
    h, w = len(rows), max(len(r) for r in rows)
    P = 2  # 1 px outline + 1 px transparent padding
    grid = [[None] * (w + 2 * P * P) for _ in range(h + 2 * P * P)]
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.': grid[y + P][x + P] = col(legend[ch])
    if outline:
        src = [row[:] for row in grid]
        for y in range(h + 2 * P):
            for x in range(w + 2 * P):
                if src[y][x] is None:
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h + 2 * P and 0 <= nx < w + 2 * P and src[ny][nx] is not None and (nx, ny) != (x, y):
                            grid[y][x] = ramp_dark(src[ny][nx]); break
    img = Image.new('RGBA', (w + 2 * P, h + 2 * P), (0, 0, 0, 0))
    for y in range(h + 2 * P):
        for x in range(w + 2 * P):
            if grid[y][x]: img.putpixel((x, y), grid[y][x])
    return img
DARK = {}
for rn, rr in PAL['ramps'].items():
    for c in rr: DARK[hx(c)] = hx(rr[0])
def ramp_dark(c): return DARK.get(c, hx(PAL['specials']['ink']))
def mirror(rows): return [r[::-1] for r in rows]
