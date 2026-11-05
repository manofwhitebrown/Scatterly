#!/usr/bin/env python3
"""AI-6 puzzle skin extras (additive to puzzles.py; run AFTER it). Usage: puzzle2.py <assets/frames dir> [kind ...]
Adds states and markers per kind into assets/frames/puzzle-<kind>/ and merges pivots.json. Frame names are saved keys: additive only."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from yard import new
from puzzles import tilec, put_all
CHECK = [(4, 8), (5, 9), (6, 10), (7, 9), (8, 8), (9, 7), (10, 6), (11, 5)]
CROSS = [(x, x) for x in range(4, 12)] + [(x, 15 - x) for x in range(4, 12)]
def check(c='paper'):
    return lambda px: (put_all(px, CHECK, c), put_all(px, [(x, y + 1) for x, y in CHECK], c))
def cross(c='paper'):
    return lambda px: (put_all(px, CROSS, c), put_all(px, [(x + 1, y) for x, y in CROSS if x < 11], c))
def well(inner):
    return lambda px: put_all(px, [(x, y) for x in range(3, 11) for y in range(3, 11)], inner)
def keycap(pressed):
    def m(px):
        put_all(px, [(x, 12 if pressed else 11) for x in range(2, 12)], 'stone.1')
        put_all(px, [(x, 3) for x in range(3, 11)], 'stone.1' if pressed else 'stone.3')
        put_all(px, [(x, y) for x in range(5, 9) for y in range(5, 9)], 'stone.3' if pressed else 'stone.1')
    return m
def code():
    return {'key': (tilec('stone', keycap(False)), (7, 7)), 'key_down': (tilec('stone', keycap(True)), (7, 7)),
            'slot': (tilec('plaster', well('plaster.1')), (7, 7)), 'slot_ok': (tilec('sage', well('sage.3')), (7, 7)),
            'slot_bad': (tilec('terracotta', well('terracotta.3')), (7, 7)), 'btn_ok': (tilec('sage', check()), (7, 7))}
def memory():
    def pair(px):
        put_all(px, [(x, y) for x in range(4, 8) for y in range(4, 8)], 'sage.4'); put_all(px, [(x, y) for x in range(8, 12) for y in range(8, 12)], 'sage.4')
    return {'card_match': (tilec('sage', pair), (7, 7)), 'card_miss': (tilec('terracotta', cross('plaster.1')), (7, 7)),
            'card_face': (tilec('plaster', lambda px: put_all(px, [(x, 12) for x in range(3, 11)], 'plaster.3')), (7, 7))}
KINDS = {'code': code, 'memory': memory}
def save(d, kind, name, im, pv, piv):
    pd = new(im.width + 2, im.height + 2); pd.alpha_composite(im, (1, 1))
    pd.save(os.path.join(d, f'puzzle__{kind}__{name}.png')); piv[f'puzzle/{kind}/{name}'] = {'pivot': [pv[0] + 1, pv[1] + 1]}
if __name__ == '__main__':
    root = sys.argv[1]
    for kind in (sys.argv[2:] or KINDS):
        d = os.path.join(root, 'puzzle-' + kind); pj = os.path.join(d, 'pivots.json'); piv = json.load(open(pj))
        for name, (im, pv) in KINDS[kind]().items(): save(d, kind, name, im, pv, piv)
        json.dump(piv, open(pj, 'w'), indent=0); print('puzzle2:', kind)
