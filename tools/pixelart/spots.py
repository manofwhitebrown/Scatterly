#!/usr/bin/env python3
"""Hand-built spot frames (B): closed/open pairs for bagSpot, basket, bin, charger, jacket, papers, shoeRack, rug, plus a generic
'peek' open state for kinds whose Kenney closed frame has no door (sofa, bed, tv, plant). Pivot: bottom centre (rug/Kenney: unchanged).
Usage: spots.py <room-slice dir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build, col
from props import L
S = {
 'basket': (["..nnnnnnnn..", ".nNNNNNNNNn.", "nNnNnNnNnNnn", "nnNnNnNnNnNn", "nNnNnNnNnNnn", ".nmnmnmnmnm.", "..mmmmmmmm.."],
            ["..nnnnnnnn..", ".nmmmmmmmmn.", "nmiiiggiiiimn", "nmiGgGgiirrmn", "nNnNnNnNnNnn", ".nmnmnmnmnm.", "..mmmmmmmm.."]),
 'bin': (["..kKKKKKk..", ".kKKKKKKKk.", "kkkkkkkkkkk", ".kKkKkKkKk.", ".kkKkKkKkk.", ".kKkKkKkKk.", ".kkKkKkKkk.", "..jjjjjjj.."],
         ["KKKK.......", "kKKKkKKKk..", ".kkkk.kKKk.", ".iiiiiiiik.", ".iwiiiiiik.", ".kKkKkKkKk.", ".kkKkKkKkk.", "..jjjjjjj.."]),
 'charger': (["..kkkkkkkk..", ".kKKKKKKKKk.", "kkkkkkkkkkkk", ".jjjjjjjjjj.", "......y....."],
             ["..kkkkkkkk..", ".kKKKKKKKKk.", "kkbBBBBBBkkk", ".kbBiBBBBjk.", "kkkkkkkkkkkk", ".jjjjjjjjjj.", "......y....."]),
 'jacket': (["....ll....", "...llLl...", "..llLLll..", ".llLLLLll.", "llLLLLLLll", "llLlLLlLll", "llLlLLlLll", "llLLLLLLll", "llLLLLLLll", "llLLLLLLll", ".lllllllll."],
            ["....ll....", "...llLl...", "..llLLll..", ".llLLLLll.", "llLLLLLLll", "llLiiiiLll", "llLioowLll", "llLLoowLll", "llLLLLLLll", "llLLLLLLll", ".lllllllll."]),
 'papers': (["..wwwwwww..", ".wcccccccw.", "wwwwwwwwww.", "wddddddddw.", "wwwwwwwwww.", ".ccccccccc."],
            ["...wwwwww..", "..wcccccw...", ".wwwwwwwwwo.", "wwddddddddwo", "wwwwwwwwwwo.", "wddddddddw..", "wwwwwwwwww..", ".ccccccccc."]),
 'shoeRack': (["..rrr....rrr..", ".rRRRr..rRRRr.", "rRRRRRrrRRRRRr", "rrrrrrrrrrrrrr", "nNnNnNnNnNnNnN", "mmmmmmmmmmmmmm"],
              ["..rrr.....rr..", ".rRRRr..rRRRrr", "rRRRRRr.rRRRRr", "rrrrrrrrrrrrr.", "nNnNnNnNnNnNnN", "mmmmmmmmmmmmmm"]),
 'bagSpot': (["...nnnn...", "..n....n..", "..n....n..", ".gggggggg.", "gGGGGGGGGg", "gGggggggGg", "gGyyggggGg", "gGGGGGGGGg", "gggggggggg", ".hhhhhhhh."],
             ["...nnnn...", "..n....n..", "..n....n..", ".gggggggg.", "gGiiiiiiGg", "gGiiwwiiGg", "gGiiooiiGg", "gGGGGGGGGg", "gggggggggg", ".hhhhhhhh."]),
}
PEEK = [".yyyyy.", "yowwwwy", "yowYwwy", "yowwwwy", ".yyyyy."]
def diamond(w, h, lift):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load(); ramp = ['terracotta', 'butter']
    for y in range(h):
        for x in range(w):
            if abs(x - (w - 1) / 2) / (w / 2) + abs(y - (h - 1) / 2) / (h / 2) <= 1:
                edge = abs(x - (w - 1) / 2) / (w / 2) + abs(y - (h - 1) / 2) / (h / 2) > 0.86
                inner = abs(x - (w - 1) / 2) / (w / 2) + abs(y - (h - 1) / 2) / (h / 2) < 0.55
                px[x, y] = col('terracotta.0') if edge else col('butter.3') if inner else col('terracotta.2')
                if lift and x + 2 * y < 30 and px[x, y][3]: px[x, y] = col('terracotta.4') if x + 2 * y > 26 else col('plaster.3')
    return im
def peek_open(src):
    im = Image.open(src).convert('RGBA'); bb = im.getbbox(); pk = build(PEEK, L, outline=True)
    cx, cy = (bb[0] + bb[2]) // 2 - pk.width // 2, bb[1] + int((bb[3] - bb[1]) * 0.30)
    im.alpha_composite(pk, (max(0, cx), cy)); return im
if __name__ == '__main__':
    out = sys.argv[1]; piv = json.load(open(os.path.join(out, 'pivots.json')))
    def save(key, im, pv):
        im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pv)}
    for kind, (c, o) in S.items():
        for st, rows in (('closed', c), ('open', o)):
            im = build(rows, L); save(f'spot/{kind}/{st}', im, (im.width // 2, im.height - 2))
    for st in ('closed', 'open'):
        d = diamond(76, 40, st == 'open'); im = Image.new('RGBA', (78, 42), (0, 0, 0, 0)); im.alpha_composite(d, (1, 1)); save(f'spot/rug/{st}', im, (39, 1))
    for kind in ('sofa', 'bed', 'tv', 'plant'):
        src = os.path.join(out, f'spot__{kind}__closed.png'); save(f'spot/{kind}/open', peek_open(src), piv[f'spot/{kind}/closed']['pivot'])
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0); print('spots done')
