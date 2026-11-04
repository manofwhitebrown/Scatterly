#!/usr/bin/env python3
"""Hand-built decor kinds (B) that have no Kenney model: small tops, flat floor pieces, rugRect, and wall mounts.
Non-mount frames: pivot = bottom centre (tops) / centre (flat pieces, rugRect). Mounts: `prop/<kind>` is for the RIGHT wall (gy=0, sheared
down-right), `prop/<kind>_L` its mirror for the LEFT wall; pivot = the wall point P(t, base) (bottom-left corner of the right-wall frame, bottom-right of _L).
Usage: props2.py <room-slice dir>"""
import json, math, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build, col
from props import L
from yard import outline, new
T = {
 'teacup': ["..ww..", ".wwww.", "wcccwo", "wcccwo", ".ddd.."],
 'vase': ["..r..", ".rRr.", "..g..", ".bBb.", "bBBBb", "bBBBb", ".bbb."],
 'photoFrame1': ["nnnnnn", "nbBBbn", "nbggbn", "nbbbbn", "nnnnnn", "..mm.."],
 'photoFrame2': ["nnnnnnnn", "nPpppyPn", "nppyyppn", "nnnnnnnn", "..mmmm.."],
 'bowl': ["..r.y..", ".rRyYy.", "wwwwwwww", "wccccccw", ".dddddd."],
 'cuttingBoard': ["nnnnnnnn", "nNNNNNNn", "nNnNNNNn", "mnnnnnnm"],
 'pan': ["..kkkkk...", "kjjjjjkk..", "kjjjjjkNNNN", "..kkkkk..."],
 'banana': [".yy...", "yYYy..", "yYYYy.", "..yyyz"],
 'magazine': ["rrrrrrr", "rwwwwwr", "rwbbbwr", "rwwwwwr", "rrrrrrr"],
 'desk_lamp': ["..yyy.", ".yYYYy", "..kk..", "..k...", ".k....", "kkkk.."],
 'hat': ["..lll..", ".lLLLl.", "lllllll", "VVVVVVV"],
 'keyring': [".yy.", "y..y", ".yy.", "..k.", ".kk."],
 'towelStack': ["wwwwww", "cccccc", "bbbbbb", "BBBBBB", "wwwwww"],
 'soap': ["ppp", "pPp"],
 'toothbrush': ["b.....", "bwwwwy", "b....."],
}
F = {'shoesPair': (["rr..rr.", "RRrrRRr", "qqqqqqq"], 'ink'), 'slippers': (["tt..tt.", "TTttTTt", "uuuuuuu"], 'ink')}
def disc(w, h, fn):
    im = new(w, h); px = im.load()
    for y in range(h):
        for x in range(w):
            d = abs(x - (w - 1) / 2) / (w / 2) + abs(y - (h - 1) / 2) / (h / 2)
            if d <= 1: px[x, y] = fn(x, y, d)
    return im
def padded(im, pv):
    pd = new(im.width + 2, im.height + 2); pd.alpha_composite(im, (1, 1)); return pd, (pv[0] + 1, pv[1] + 1)
def ellipse(w, h, fn):
    im = new(w, h); px = im.load()
    for y in range(h):
        for x in range(w):
            d = ((x - (w - 1) / 2) / (w / 2)) ** 2 + ((y - (h - 1) / 2) / (h / 2)) ** 2
            if d <= 1: px[x, y] = fn(x, y, d)
    return im
def rug_rect():
    def f(x, y, d):
        if d > 0.86: return col('teal.2')
        if d > 0.76: return col('plaster.4')
        if d > 0.66: return col('terracotta.2')
        return col('butter.3') if (x // 4 + y // 2) % 2 else col('plaster.3')
    return disc(80, 40, f)
def shear(flat, left):
    w, h = flat.size; im = new(w, h + w // 2 + 1)
    for x in range(w): im.alpha_composite(flat.crop((x, 0, x + 1, h)), (x, x // 2))
    pv = (0, h - 1 + 1)
    if left: im = im.transpose(Image.FLIP_LEFT_RIGHT); pv = (w - 1, pv[1])
    return im, pv
M = {
 'poster1': ["nnnnnnnnnn", "nbbbbbbbbn", "nbbBBbbbbn", "nbbbbbbbbn", "nggggggggn", "nGgGgGgGgn", "nggggggggn", "nnnnnnnnnn"],
 'poster2': ["nnnnnnnnnn", "nPPPPPPPPn", "nPyyYyyPPn", "nppyYYypPn", "nrrrrrrrrn", "nRrRrRrRrn", "nnnnnnnnnn"],
 'poster3': ["nnnnnnnnnn", "nwwwwwwwwn", "nwtttwrrwn", "nwtTtwrRwn", "nwtttwrrwn", "nwwwwyyywn", "nwwwwyYywn", "nnnnnnnnnn"],
 'calendar': ["rrrrrrrr", "rrrrrrrr", "wwwwwwww", "wkwkwkww", "wwwwwwww", "wkwkwkrw", "wwwwwwww", "wkwkwkww", "cccccccc"],
 'mirrorWall': ["nnnnnnnn", "nBbBbBbn", "nbBbBbBn", "nBbBbbbn", "nbBbbbbn", "nBbbbbbn", "nbbbbbbn", "nbbbbbbn", "nnnnnnnn"],
 'hangingPlant': ["....ii....", "...i..i...", "..i....i..", "...rrrr...", "..rRRRRr..", ".gGgGgGgg.", "gGgGhGgGgG", "g.gG..Gg.g", "..g....g.."],
 'bunting': ["iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii", "rrrr.yyyy.bbbb.pppp.gggg.tttt.rrrr.", ".rr...yy...bb...pp...gg...tt...rr..", "..r....y....b....p....g....t....r..."],
}
def clock():
    return disc(12, 12, lambda x, y, d: col('nN'[0:0] or 'woodWarm.2') if d > 0.8 else col('plaster.4') if not (x in (5, 6) and y < 7 or y in (5, 6) and x > 5 and x < 9) else col('ink'))
if __name__ == '__main__':
    out = sys.argv[1]; piv = json.load(open(os.path.join(out, 'pivots.json')))
    def save(key, im, pv, pad=True):
        if pad: im, pv = padded(im, pv)
        im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pv)}
    for k, rows in T.items():
        im = build(rows, L); save(f'prop/{k}', im, (im.width // 2, im.height - 2), pad=False)
    for k, (rows, _) in F.items():
        im = build(rows, L); save(f'prop/{k}', im, (im.width // 2, im.height // 2), pad=False)
    cat = disc(26, 13, lambda x, y, d: col('terracotta.0') if d > 0.88 else col('plaster.3') if d < 0.5 else col('terracotta.2'))
    save('prop/catBed', outline(cat), (14, 7))  # save() pads
    save('prop/bathMat', outline(disc(24, 12, lambda x, y, d: col('sky.1') if d > 0.85 else col('sky.3') if (x + y) % 6 < 3 else col('sky.2'))), (13, 7))
    rv = ellipse(14, 8, lambda x, y, d: col('stone.1') if d > 0.8 else col('plaster.2') if (x, y) != (9, 3) else col('rose.3')); save('prop/robotVacuum', outline(rv), (8, 5))
    save('prop/rugRect', outline(rug_rect()), (41, 21))
    for k, rows in M.items():
        flat = build(rows, L, outline=False) if False else None
        flat = new(max(len(r) for r in rows), len(rows)); px = flat.load()
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch != '.': px[x, y] = col(L[ch])
        for left in (False, True):
            im, pv = shear(flat, left); im, pv = padded(outline(padded(im, pv)[0]), (pv[0] + 1, pv[1] + 1)); save(f'prop/{k}' + ('_L' if left else ''), im, pv, pad=False)
    c = clock()
    for left in (False, True):
        im, pv = shear(c, left); im, pv = padded(outline(padded(im, pv)[0]), (pv[0] + 1, pv[1] + 1)); save('prop/clockWall' + ('_L' if left else ''), im, pv, pad=False)
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0); print('props2 done')
