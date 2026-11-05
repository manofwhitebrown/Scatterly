#!/usr/bin/env python3
"""Puzzle skins (B) for untangle, lights, mastermind -> assets/frames/puzzle-<kind>/. `puzzle/<kind>/panel` is a 32x32 nine-slice (slice 8) of cream paper
in a honey-wood trim with corner rivets; each kind has its own trim accent. Extras (not wired yet, see Requests): lights `tile_on|off` (16x16),
mastermind `peg_<colour>` + `peg_empty` (12x12), untangle `bead_<n>` + `bead_hot` (12x12). Usage: puzzles.py <assets/frames dir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from yard import new, outline
ACCENT = {'untangle': 'sky', 'lights': 'butter', 'mastermind': 'rose', 'sort': 'sage', 'word': 'terracotta', 'code': 'navy', 'target': 'teal', 'sequence': 'slate', 'slide': 'stone', 'pipes': 'woodDark', 'memory': 'plum' if False else 'rose'}
def panel(accent):
    n = 32; im = new(n, n); px = im.load()
    for y in range(n):
        for x in range(n):
            d = min(x, y, n - 1 - x, n - 1 - y)
            if d == 0: c = col('ink')
            elif d == 1: c = col('woodWarm.4') if (x < n / 2 and y < n / 2) or d == 1 and (x == 1 or y == 1) else col('woodWarm.2')
            elif d == 2: c = col('woodWarm.3')
            elif d == 3: c = col(f'{accent}.2') if True else col('woodWarm.3')
            elif d == 4: c = col(f'{accent}.3')
            else: c = col('paper')
            px[x, y] = c
    for cx, cy in ((3, 3), (n - 4, 3), (3, n - 4), (n - 4, n - 4)): px[cx, cy] = col(f'{accent}.4')
    return im
def blob(w, fn):
    return outline(Image.frombytes('RGBA', (w - 2, w - 2), bytes(sum(([*fn(x, y)] for y in range(w - 2) for x in range(w - 2)), []))))
def disc(w, base, hi, lo):
    def f(x, y):
        c = (w - 3) / 2; d = ((x - c) ** 2 + (y - c) ** 2) ** 0.5
        if d > (w - 2) / 2: return (0, 0, 0, 0)
        k = hi if (x - c) + (y - c) < -c * 0.5 and d < c else lo if (x - c) + (y - c) > c * 0.7 else base
        return col(k)
    return blob(w, f)
def tile(on):
    def f(x, y):
        edge = x in (0, 13) or y in (0, 13)
        if (x, y) in ((0, 0), (13, 0), (0, 13), (13, 13)): return (0, 0, 0, 0)
        if on: return col('butter.2') if edge else col('butter.4') if x < 5 and y < 5 else col('butter.3')
        return col('stone.1') if edge else col('stone.3') if x < 4 and y < 4 else col('stone.2')
    return blob(16, f)
def tilec(ramp, mark=None):
    """16x16 chip: ramp.1 edge, ramp.2 body, ramp.4 corner shine; `mark(px)` draws a 14x14 detail."""
    def f(x, y):
        edge = x in (0, 13) or y in (0, 13)
        if (x, y) in ((0, 0), (13, 0), (0, 13), (13, 13)): return (0, 0, 0, 0)
        return col(f'{ramp}.1') if edge else col(f'{ramp}.4') if x < 4 and y < 4 else col(f'{ramp}.2')
    im = blob(16, f)
    if mark: mark(im.load())
    return im
def put_all(px, pts, c):
    for x, y in pts: px[x, y] = col(c)
def pipe(kind):
    def m(px):
        c = 'teal.3'; sq = [(x, y) for x in range(5, 9) for y in range(0, 14)] if kind == 'straight' else [(x, y) for x in range(5, 9) for y in range(0, 9)] + [(x, y) for x in range(5, 14) for y in range(5, 9)]
        put_all(px, sq, 'teal.1'); put_all(px, [(x + 1, y) for x, y in sq if (x + 1, y) in sq or True][:0], c)
        inner = [(x, y) for x in range(6, 8) for y in range(0, 14)] if kind == 'straight' else [(x, y) for x in range(6, 8) for y in range(0, 8)] + [(x, y) for x in range(6, 14) for y in range(6, 8)]
        put_all(px, inner, c)
    return tilec('stone', m)
def ring():
    def f(x, y):
        c = 7.5; d = ((x - c) ** 2 + (y - c) ** 2) ** 0.5
        return col('terracotta.2') if d > 6.2 and d <= 7.5 else col('paper') if 4.2 < d <= 6.2 else col('terracotta.3') if 2.2 < d <= 4.2 else col('terracotta.2') if d <= 2.2 else (0, 0, 0, 0)
    return blob(18, f)
def brand(px):
    put_all(px, [(6, 4), (7, 4), (5, 5), (8, 5), (4, 6), (9, 6), (4, 7), (9, 7), (5, 8), (8, 8), (6, 9), (7, 9)], 'rose.4')
def key(px): put_all(px, [(x, 11) for x in range(2, 12)], 'stone.1')
def slot(px): put_all(px, [(x, y) for x in range(3, 11) for y in range(3, 11)], 'plaster.1')
if __name__ == '__main__':
    root = sys.argv[1]
    for kind, acc in ACCENT.items():
        d = os.path.join(root, 'puzzle-' + kind); os.makedirs(d, exist_ok=True); piv = {}
        def save(name, im, pv, extra=None):
            pd = new(im.width + 2, im.height + 2) if name != 'panel' else im
            if name != 'panel': pd.alpha_composite(im, (1, 1)); pv = (pv[0] + 1, pv[1] + 1)
            pd.save(os.path.join(d, f'puzzle__{kind}__{name}.png')); piv[f'puzzle/{kind}/{name}'] = {'pivot': list(pv), **(extra or {})}
        save('panel', panel(acc), (0, 0), {'slice': [8, 8, 8, 8]})
        if kind == 'lights': [save(f'tile_{s}', tile(s == 'on'), (8, 8)) for s in ('on', 'off')]
        if kind == 'mastermind':
            for nm, r in (('red', 'terracotta'), ('yellow', 'butter'), ('green', 'sage'), ('blue', 'sky'), ('pink', 'rose'), ('teal', 'teal')): save(f'peg_{nm}', disc(12, f'{r}.2', f'{r}.4', f'{r}.1'), (6, 6))
            save('peg_empty', disc(12, 'plaster.2', 'plaster.1', 'plaster.3'), (6, 6))
        if kind == 'untangle':
            for i, r in enumerate(('terracotta', 'sky', 'butter', 'rose')): save(f'bead_{i}', disc(12, f'{r}.2', f'{r}.4', f'{r}.1'), (6, 6))
            save('bead_hot', disc(12, 'butter.3', 'butter.4', 'butter.2'), (6, 6))
        if kind == 'sort': [save(f'token_{i}', tilec(r), (7, 7)) for i, r in enumerate(('terracotta', 'sky', 'butter', 'sage'))]
        if kind == 'word': [save(n, tilec(r), (7, 7)) for n, r in (('tile', 'plaster'), ('tile_ok', 'sage'), ('tile_near', 'butter'), ('tile_miss', 'stone'))]
        if kind == 'code': save('key', tilec('stone', key), (7, 7)); save('slot', tilec('plaster', slot), (7, 7))
        if kind == 'target': save('ring', ring(), (8, 8)); save('ring_hit', disc(12, 'sage.2', 'sage.4', 'sage.1'), (6, 6))
        if kind == 'sequence':
            for i, r in enumerate(('terracotta', 'sky', 'butter', 'sage')): save(f'pad_{i}', tilec('stone'), (7, 7)); save(f'pad_lit_{i}', tilec(r), (7, 7))
        if kind == 'slide': save('tile', tilec('woodWarm'), (7, 7)); save('tile_blank', tilec('woodDark'), (7, 7))
        if kind == 'pipes': save('pipe_straight', pipe('straight'), (7, 7)); save('pipe_elbow', pipe('elbow'), (7, 7))
        if kind == 'memory': save('card_back', tilec('rose', brand), (7, 7)); save('card_face', tilec('paper' if False else 'plaster'), (7, 7))
        json.dump(piv, open(os.path.join(d, 'pivots.json'), 'w'), indent=0)
    print('puzzle skins done')
