#!/usr/bin/env python3
"""AI-6: palette-family recolour of existing prop/spot PNGs (tone-for-tone ramp swap, palette-exact, idempotent). Used because the Kenney OBJs
are not in the repo, so the 3D frames cannot be re-rendered. Usage: recolor.py <room-slice dir> [--report]. Run BEFORE tools/pack/pack.py."""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import PAL, hx
RAMP = {tuple(hx(c)): (n, i) for n, r in PAL['ramps'].items() for i, c in enumerate(r)}
# one palette family per room: warm wood + cream neutrals + ONE accent (sage). frame -> [(from ramp, to ramp)]
MAP = {
    'prop__loungeSofa': [('teal', 'sage')], 'prop__loungeChair': [('rose', 'sage')], 'prop__chairDesk': [('sky', 'sage')],
    'prop__bookcaseClosed': [('sage', 'woodWarm')], 'prop__bench': [('sage', 'woodWarm')], 'prop__sideTableDrawers': [('sage', 'woodWarm')],
    'prop__cabinetTelevision': [('slate', 'woodDark')], 'prop__speaker': [('slate', 'woodDark')],
    'spot__sofa__closed': [('teal', 'sage')], 'spot__sofa__open': [('teal', 'sage')],
    'prop__catBed': [('terracotta', 'sage')], 'prop__catBowl': [('rose', 'plaster')], 'prop__pottedPlant': [('teal', 'sage')],
    'prop__rugDoormat': [('woodWarm', 'sage'), ('woodDark', 'sage')],
}
def report(path):
    im = Image.open(path).convert('RGBA'); c = {}
    for p in im.getdata():
        if p[3] and tuple(p) in RAMP: c[RAMP[tuple(p)][0]] = c.get(RAMP[tuple(p)][0], 0) + 1
    return c
def apply(path, swaps):
    im = Image.open(path).convert('RGBA'); px = im.load(); inv = {(n, i): hx(c) for n, r in PAL['ramps'].items() for i, c in enumerate(r)}; n = 0
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and tuple(p) in RAMP:
                r, i = RAMP[tuple(p)]
                for a, b in swaps:
                    if r == a: px[x, y] = inv[(b, i)]; n += 1; break
    im.save(path); return n
if __name__ == '__main__':
    d = sys.argv[1]
    for name, swaps in MAP.items():
        f = os.path.join(d, name + '.png')
        if not os.path.exists(f): print('skip', name); continue
        print(name, report(f) if '--report' in sys.argv else apply(f, swaps))
