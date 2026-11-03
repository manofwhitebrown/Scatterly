#!/usr/bin/env python3
"""Frame QA: palette conformity, alpha 0/255 only, naming, max size, 1 px padding. Usage: check.py <dir with PNGs> [--max 96]"""
import json, os, re, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
pal = json.load(open(os.path.join(HERE, '..', '..', 'docs', 'art', 'palette.json')))
OK = {tuple(int(c[i:i+2], 16) for i in (1, 3, 5)) for r in pal['ramps'].values() for c in r} | {tuple(int(c[i:i+2], 16) for i in (1, 3, 5)) for c in pal['specials'].values()}
NAME = re.compile(r'^(spot__[A-Za-z]+__(closed|open)|prop__\w+|shell__\w+|mat__\w+|ui__\w+|icon__\w+|fx__\w+|avatar__\w+|pet__\w+|puzzle__\w+)\.png$')
def main():
    d = sys.argv[1]; mx = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 96
    errs = 0; n = 0
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.png'): continue
        n += 1; im = Image.open(os.path.join(d, fn)).convert('RGBA'); w, h = im.size; px = im.load(); bad = set()
        if not NAME.match(fn): print('name:', fn); errs += 1
        if not fn.startswith('shell__') and max(w, h) > mx: print('size:', fn, w, h); errs += 1
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a not in (0, 255): bad.add('alpha')
                elif a and (r, g, b) not in OK: bad.add('#%02x%02x%02x' % (r, g, b))
        edge = [px[x, 0][3] for x in range(w)] + [px[x, h - 1][3] for x in range(w)] + [px[0, y][3] for y in range(h)] + [px[w - 1, y][3] for y in range(h)]
        if any(edge): bad.add('no 1px padding')
        if bad: print('frame:', fn, sorted(bad)[:4]); errs += 1
    print(f'check-frames: {n} files, {errs} problems'); sys.exit(1 if errs else 0)
main()
