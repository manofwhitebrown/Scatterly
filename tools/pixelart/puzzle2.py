#!/usr/bin/env python3
"""AI-6 puzzle skin extras (additive to puzzles.py; run AFTER it). Usage: puzzle2.py <assets/frames dir> [kind ...]
Adds states and markers per kind into assets/frames/puzzle-<kind>/ and merges pivots.json. Frame names are saved keys: additive only."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import col
from yard import new
from puzzles import tilec, put_all, disc, blob
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
def pipe_mark(dirs, water=None, valve=False):
    box = {'u': (5, 0, 8, 8), 'd': (5, 5, 8, 13), 'l': (0, 5, 8, 8), 'r': (5, 5, 13, 8)}
    def m(px):
        for k in dirs:
            x0, y0, x1, y1 = box[k]; put_all(px, [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)], 'teal.1')
        for k in dirs:
            x0, y0, x1, y1 = box[k]; ix, iy = (6, 7) if k in 'ud' else (6, 7)
            put_all(px, [(x, y) for x in range(max(x0, 6) if k in 'ud' else x0 + (1 if k == 'r' else 0), min(x1, 7) + 1 if k in 'ud' else x1 + 1 - (1 if k == 'l' and False else 0)) for y in range(max(y0, 6) if k in 'lr' else y0, min(y1, 7) + 1 if k in 'lr' else y1 + 1)], water or 'teal.3')
        if valve: put_all(px, [(x, y) for x in range(5, 9) for y in range(5, 9)], 'butter.3'); put_all(px, [(6, 6), (7, 6)], 'butter.4')
    return m
def pipes():
    t = lambda d, w=None, v=False: (tilec('stone', pipe_mark(d, w, v)), (7, 7))
    return {'pipe_tee': t('urd'), 'pipe_end': t('u'), 'pipe_source': t('u', None, True),
            'pipe_straight_on': t('ud', 'sky.4'), 'pipe_elbow_on': t('ur', 'sky.4'), 'pipe_tee_on': t('urd', 'sky.4'), 'pipe_end_on': t('u', 'sky.4')}
def slide():
    star = lambda px: put_all(px, [(7, 4), (6, 5), (7, 5), (8, 5), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (6, 7), (7, 7), (8, 7), (6, 8), (8, 8)], 'butter.4')
    return {'tile_ok': (tilec('woodWarm', star), (7, 7)), 'tile_down': (tilec('woodWarm', lambda px: put_all(px, [(x, 12) for x in range(2, 12)], 'woodWarm.1')), (7, 7))}
SHAPES = [lambda px, c='paper': put_all(px, [(x, y) for x in range(5, 9) for y in range(5, 9)], c),
          lambda px, c='paper': put_all(px, [(7, 4), (6, 5), (7, 5), (8, 5), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (6, 8), (7, 8), (8, 8), (7, 9)], c),
          lambda px, c='paper': put_all(px, [(7, 4), (6, 5), (7, 5), (8, 5), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7)], c),
          lambda px, c='paper': put_all(px, [(x, y) for x in range(4, 11) for y in range(4, 11) if (x - 7) ** 2 + (y - 7) ** 2 <= 9], c)]
def sort():
    out = {f'token_{i}': (tilec(r, SHAPES[i]), (7, 7)) for i, r in enumerate(('terracotta', 'sky', 'butter', 'sage'))}
    out['bin'] = (tilec('plaster', well('plaster.1')), (7, 7)); out['bin_ok'] = (tilec('sage', well('sage.3')), (7, 7))
    return out
def lights():
    return {'tile_on_glow': (tilec('butter', lambda px: put_all(px, [(x, y) for x in range(2, 12) for y in range(2, 12) if x in (2, 11) or y in (2, 11)], 'butter.4')), (7, 7))}
def mastermind():
    return {'fb_exact': (disc(8, 'woodDark.2', 'woodDark.3', 'woodDark.1'), (4, 4)), 'fb_near': (disc(8, 'plaster.1', 'paper', 'plaster.3'), (4, 4))}
def sequence():
    out = {}
    for i, r in enumerate(('terracotta', 'sky', 'butter', 'sage')):
        out[f'pad_{i}'] = (tilec('stone', lambda px, i=i: SHAPES[i](px, 'stone.3')), (7, 7)); out[f'pad_lit_{i}'] = (tilec(r, SHAPES[i]), (7, 7))
    return out
def untangle():
    link = blob(16, lambda x, y: col('woodWarm.2') if y in (5, 6, 7) and x < 14 else (0, 0, 0, 0))
    return {'link': (link, (8, 8))}
KINDS = {'code': code, 'memory': memory, 'pipes': pipes, 'slide': slide, 'sort': sort, 'lights': lights, 'mastermind': mastermind, 'sequence': sequence, 'untangle': untangle}
def save(d, kind, name, im, pv, piv):
    pd = new(im.width + 2, im.height + 2); pd.alpha_composite(im, (1, 1))
    pd.save(os.path.join(d, f'puzzle__{kind}__{name}.png')); piv[f'puzzle/{kind}/{name}'] = {'pivot': [pv[0] + 1, pv[1] + 1]}
if __name__ == '__main__':
    root = sys.argv[1]
    for kind in (sys.argv[2:] or KINDS):
        d = os.path.join(root, 'puzzle-' + kind); pj = os.path.join(d, 'pivots.json'); piv = json.load(open(pj))
        for name, (im, pv) in KINDS[kind]().items(): save(d, kind, name, im, pv, piv)
        json.dump(piv, open(pj, 'w'), indent=0); print('puzzle2:', kind)
