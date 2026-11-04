#!/usr/bin/env python3
"""Puzzle skins (B) for untangle, lights, mastermind -> assets/frames/puzzle-<kind>/. `puzzle/<kind>/panel` is a 32x32 nine-slice (slice 8) of cream paper
in a honey-wood trim with corner rivets; each kind has its own trim accent. Extras (not wired yet, see Requests): lights `tile_on|off` (16x16),
mastermind `peg_<colour>` + `peg_empty` (12x12), untangle `bead_<n>` + `bead_hot` (12x12). Usage: puzzles.py <assets/frames dir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from yard import new, outline
ACCENT = {'untangle': 'sky', 'lights': 'butter', 'mastermind': 'rose'}
def panel(accent):
    n = 32; im = new(n, n); px = im.load()
    for y in range(n):
        for x in range(n):
            d = min(x, y, n - 1 - x, n - 1 - y)
            if d == 0: c = col('ink')
            elif d == 1: c = col('woodWarm.4') if (x < n / 2 and y < n / 2) or d == 1 and (x == 1 or y == 1) else col('woodWarm.2')
            elif d == 2: c = col('woodWarm.3')
            elif d == 3: c = col(f'{accent}.2') if True else col('woodWarm.3')
            elif d == 4: c = col('plaster.1')
            else: c = col('paper')
            px[x, y] = c
    for cx, cy in ((3, 3), (n - 4, 3), (3, n - 4), (n - 4, n - 4)): px[cx, cy] = col('woodWarm.1')
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
        json.dump(piv, open(os.path.join(d, 'pivots.json'), 'w'), indent=0)
    print('puzzle skins done')
