#!/usr/bin/env python3
"""FX particle frames `fx/<FxName>/<0..2>` for the 16 names in src/fx/names.ts -> core atlas. Tiny (<= 12 px), pale neutrals so the spec
tints still work (coin and buy keep gold). Pivot = centre. Usage: fx.py <core dir>"""
import json, os, sys, math
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
W, L, G = col('paper'), col('plaster.3'), col('plaster.2')
GOLD, GOLD_HI, GOLD_LO = col('butter.3'), col('butter.4'), col('butter.2')
def grid(n): return Image.new('RGBA', (n, n), (0, 0, 0, 0))
def bm(rows, pal):
    im = Image.new('RGBA', (max(len(r) for r in rows), len(rows)), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in pal: px[x, y] = pal[ch]
    return im
def puff(r):
    n = 2 * r + 3; im = grid(n); px = im.load(); c = (n - 1) / 2
    for y in range(n):
        for x in range(n):
            d = math.hypot(x - c, y - c)
            if d <= r - 0.5: px[x, y] = W if x + y < n else L
            elif d <= r + 0.7 and (x + y) % 2 == 0: px[x, y] = G
    return im
def spark(a):
    n = 2 * a + 3; im = grid(n); px = im.load(); c = a + 1
    for i in range(-a, a + 1):
        px[c + i, c] = W if abs(i) <= a // 2 else L; px[c, c + i] = W if abs(i) <= a // 2 else L
    px[c, c] = W
    if a >= 3:
        for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)): px[c + dx, c + dy] = L
    return im
STAR = [["..W..", "WWWWW", ".WWW.", "WW.WW", "....."], ["...W...", "...W...", "WWWWWWW", ".WWWWW.", "..WWW..", ".WW.WW.", ".W...W."],
        ["...W...", "..WWW..", "WWWWWWW", ".WWWWW.", "..WWW..", ".WW.WW.", "WW...WW"]]
def star(i): return bm(STAR[i], {'W': W, 'L': L})
def ring(r):
    n = 2 * r + 3; im = grid(n); px = im.load(); c = (n - 1) / 2
    for y in range(n):
        for x in range(n):
            d = math.hypot(x - c, y - c)
            if r - 0.9 <= d <= r + 0.5: px[x, y] = W if (x + y) % 3 else L
    return im
def streak(n_):
    im = Image.new('RGBA', (n_, 3), (0, 0, 0, 0)); px = im.load()
    for x in range(n_):
        if x > n_ // 4: px[x, 1] = W
        elif x % 2 == 0: px[x, 1] = L
        if x > (n_ * 2) // 3: px[x, 0] = L; px[x, 2] = L
    return im
def conf(i):
    w, h = ((4, 2), (3, 3), (2, 4))[i]; im = Image.new('RGBA', (w, h), W); px = im.load()
    for x in range(w): px[x, h - 1] = L
    return im
def drop(i):
    return bm([["..L..", ".LWL.", "LWWWL", "LWWWL", ".LLL."], ["..L..", ".LWL.", "LWWWL", "LWWWL", "LWWWL", ".LLL."], [".L.", "LWL", "LWL", ".L."]][i], {'W': W, 'L': L})
def coin(i):
    w = (6, 4, 2)[i]; im = Image.new('RGBA', (w, 7), (0, 0, 0, 0)); px = im.load()
    for y in range(7):
        for x in range(w):
            if (x in (0, w - 1) and y in (0, 6)) and w > 2: continue
            px[x, y] = GOLD_LO if x == w - 1 or y == 6 else GOLD_HI if x == 0 and y < 3 else GOLD
    return im
def bang(i):
    return bm([["W", "W", "W", "W", ".", "W"], ["WW", "WW", "WW", "WW", "..", "WW"], ["L", "L", "L", "L", ".", "L"]][i], {'W': W, 'L': L})
def tick(i):
    return bm([["....W", "...W.", "W.W..", ".W..."], [".....W", "....WW", "W..WW.", "WWWW..", ".WW..."], ["......W", ".....WW", "W...WW.", "WW.WW..", ".WWW...", "..W...."]][i], {'W': W})
def dots(i):
    return bm([[".W.", "WWW", ".W."], [".L.", "LWL", "WWW", "LWL", ".L."], ["W"]][i], {'W': W, 'L': L})
def qmark(i):
    return bm([["WW.", "..W", ".W.", "...", ".W."], ["WWW.", "...W", "..W.", ".W..", "....", ".W.."], ["LL.", "..L", ".L.", "...", ".L."]][i], {'W': W, 'L': L})
def comp(base, over, dx, dy):
    w, h = max(base.width, dx + over.width), max(base.height, dy + over.height); im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); im.alpha_composite(base, (0, 0)); im.alpha_composite(over, (dx, dy)); return im
FRAMES = {
 'tap': lambda i: puff((1, 2, 2)[i]), 'open': lambda i: spark((1, 2, 1)[i]), 'empty': lambda i: puff((1, 1, 2)[i]),
 'found': star, 'take': dots, 'clue': qmark,
 'hint': lambda i: ring((3, 5, 7)[i]), 'room': lambda i: streak((5, 8, 11)[i]), 'urgent': bang,
 'win': conf, 'lose': drop, 'coin': coin, 'star': star, 'buy': lambda i: comp(coin(i), spark(1), 4, 0),
 'unlock': lambda i: comp(ring((2, 3, 4)[i]), spark(1), 0, 0), 'puzzleOk': tick,
}
if __name__ == '__main__':
    d = sys.argv[1]; piv = json.load(open(os.path.join(d, 'pivots.json')))
    for name, fn in FRAMES.items():
        for i in range(3):
            im = fn(i); pd = Image.new('RGBA', (im.width + 2, im.height + 2), (0, 0, 0, 0)); pd.alpha_composite(im, (1, 1))
            pd.save(os.path.join(d, f'fx__{name}__{i}.png')); piv[f'fx/{name}/{i}'] = {'pivot': [pd.width // 2, pd.height // 2]}
    json.dump(piv, open(os.path.join(d, 'pivots.json'), 'w'), indent=0); print('fx done', len(FRAMES) * 3)
