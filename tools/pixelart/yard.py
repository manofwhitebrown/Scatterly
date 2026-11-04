#!/usr/bin/env python3
"""Exterior kit (yard/*, porch/*): lawn, path, flowers, bushes, trees, fences, mailbox, porch pieces. All built by us (B).
Usage: yard.py <outdir>. Writes PNGs and pivots.json (tiles pivot = top vertex, sprites = bottom centre of the footprint)."""
import json, math, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build, col, ramp_dark
from props import L
def new(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))
def hsh(x, y, s=0): return ((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) % 100
def diamond(x, y): return abs(x - 15.5) / 16 + abs(y - 7.5) / 8 <= 1
def tile(fn):
    im = new(32, 16); px = im.load()
    for y in range(16):
        for x in range(32):
            if diamond(x, y): px[x, y] = fn(x, y)
    return im
def lawn(s):
    def f(x, y):
        h = hsh(x, y, s)
        if h < 9: return col('sage.3')
        if h < 14: return col('sage.1')
        if (x + y * 3 + s) % 11 == 0 and h < 45: return col('sage.3')
        return col('sage.2')
    return tile(f)
def path():
    def f(x, y):
        if (x // 2 + y) % 7 == 0 or (x - y) % 13 == 0: return col('stone.2')
        return col('plaster.2') if hsh(x, y, 7) > 12 else col('plaster.1')
    return tile(f)
def porch_floor():
    def f(x, y):
        if (x - 2 * y) % 8 == 0: return col('woodWarm.2')
        return col('woodWarm.3') if hsh(x, y, 3) > 10 else col('woodWarm.4')
    return tile(f)
def outline(im):
    px = im.load(); src = im.copy().load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3]: px[x, y] = ramp_dark(src[nx, ny]); break
    return im
def blob(im, cx, cy, rx, ry, ramp, s):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d <= 1:
                t = 4 if d < 0.1 else 3 if (x - cx) + (y - cy) < -rx * 0.4 else 1 if (x - cx) + (y - cy) > rx * 0.5 else 2
                if hsh(x, y, s) < 8: t = min(4, t + 1)
                px[x, y] = col(f'{ramp}.{t}')
def bush(s):
    im = new(22, 16); blob(im, 11, 9, 9, 6, 'sage', s); blob(im, 6 + s * 2, 8, 5, 4, 'sage', s + 1)
    return outline(im)
def tree(s):
    im = new(30, 44); px = im.load()
    for y in range(26, 42):
        for x in range(12, 18): px[x, y] = col('woodDark.1') if x > 14 else col('woodDark.2')
    blob(im, 15, 14, 13, 12, 'sage', s); blob(im, 9, 18, 7, 6, 'sage', s + 2); blob(im, 21, 17, 7, 6, 'sage', s + 3)
    if s: [px.__setitem__((x, y), col('rose.2')) for x, y in ((8, 12), (17, 8), (22, 16), (13, 19), (6, 18))]
    return outline(im)
def flowers(s):
    cols = [('rose', 'butter'), ('butter', 'terracotta'), ('plaster', 'rose'), ('sky', 'butter')][s]
    im = new(16, 12); px = im.load()
    for i, (x, y) in enumerate(((3, 6), (8, 4), (12, 7), (6, 8))):
        px[x, y + 1] = col('sage.1'); px[x, y] = col(f'{cols[i % 2]}.3'); px[x - 1, y - 1] = col(f'{cols[i % 2]}.2'); px[x + 1, y - 1] = col(f'{cols[i % 2]}.2'); px[x, y - 1] = col('butter.3')
        px[x, y + 2] = col('sage.2')
    return outline(im)
def run(w, h, rails, post_h, ramp, gate=False, flip=False):
    """Iso segment running along +gx (down-right); flip mirrors it for +gy."""
    yb = w // 2 + post_h + 2; im = new(w + 4, yb + 3); px = im.load(); x0 = 2
    for t in range(w):
        y = yb - (w - t) // 2 + 0 if False else yb - w // 2 + t // 2
        for k, rh in enumerate(rails):
            if gate and 8 <= t <= 22 and k < 2: px[x0 + t, y - rh] = col('teal.2'); px[x0 + t, y - rh + 1] = col('teal.3') if k == 0 else col('teal.1'); continue
            px[x0 + t, y - rh] = col(f'{ramp}.3'); px[x0 + t, y - rh + 1] = col(f'{ramp}.2')
        if gate and 8 <= t <= 22 and t % 4 == 0:
            for hh in range(2, post_h - 1): px[x0 + t, y - hh] = col('teal.2')
    for t in (0, w - 1):
        y = yb - w // 2 + t // 2
        for hh in range(0, post_h): px[x0 + t, y - hh] = col(f'{ramp}.4' if hh == post_h - 1 else f'{ramp}.2'); px[x0 + min(t + 1, w - 1) if t == 0 else x0 + t - 1, y - hh] = col(f'{ramp}.1')
    im = outline(im)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
def awning():
    im = new(44, 34); px = im.load()
    for x in range(40):
        top = 14 - x // 2 if False else x // 2 - 0
        for y in range(top, top + 12):
            px[x + 2, y + 1] = col('terracotta.3') if (x // 4) % 2 == 0 else col('plaster.3')
        px[x + 2, top + 12] = col('terracotta.1'); px[x + 2, top + 13] = col('terracotta.0')
    return outline(im)
S = {}
S['yard/mailbox'] = ([".yyyyy..", "ytttttty.", "ytTTTTTy.", "ytttttty.", "uuuuuuuu.", "...n....", "...n....", "...nm...", "..mmmm.."], 'ink')
S['porch/mat'] = ([".rRRRRRRRRr.", "rRqrRqrRqrRr", ".rRRRRRRRRr."], 'ink')
S['porch/plant'] = ([".g.gG.g..", "gGgGGgGg.", ".gGGgGGg.", "..gGgGg..", "..rrrrr..", "..rRRRr..", "..rrrrr..", "..qqqqq.."], 'ink')
S['porch/lamp'] = (["..yy..", ".yYYy.", ".yoYy.", ".yYYy.", "..kk..", "..kk..", "..kk..", "..kk..", "..kk..", ".kkkk."], 'ink')
S['porch/door'] = (["nnnnnnnnnnnn", "nGGGGGGGGGGn", "nGggggggggGn", "nGgbBBBBbgGn", "nGgbBBBBbgGn", "nGgbbbbbbgGn", "nGggggggggGn", "nGgGGGGGGgGn", "nGgGggggGgGn", "nGgGggggGgGn", "nGgGGGGGGgGn", "nGgggggggyGn", "nGgGGGGGGyGn", "nGgGggggGgGn", "nGgGggggGgGn", "nGgGGGGGGgGn", "nGggggggggGn", "nGGGGGGGGGGn", "wwwwwwwwwwww"], 'ink')
def steps():
    im = new(36, 20); px = im.load()
    for i in range(2):
        for y in range(6):
            for x in range(32 - i * 8):
                px[x + 2, i * 6 + y + 2] = col('woodWarm.4') if y < 2 else col('woodWarm.3') if y < 4 else col('woodWarm.1')
    return outline(im)
def glow():
    im = new(30, 30); px = im.load()
    for y in range(30):
        for x in range(30):
            d = math.hypot(x - 14.5, y - 14.5)
            if d < 14 and (d < 4 or (d < 14 and x % 2 == 0 and y % 2 == 0)): px[x, y] = col('glow')
    return im
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); piv = {}
    def save(key, im, pv):
        if not key.startswith(('yard/lawn', 'yard/path', 'porch/floor')):
            e = im.getbbox(); pd = new(im.width + 2, im.height + 2); pd.alpha_composite(im, (1, 1)); im = pd; pv = (pv[0] + 1, pv[1] + 1)
        im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pv)}
    for i in range(3): save(f'yard/lawn_{i}', lawn(i), (16, 0)); 
    save('yard/path', path(), (16, 0)); save('porch/floor', porch_floor(), (16, 0))
    for i in range(4): save(f'yard/flowers_{i}', flowers(i), (8, 9))
    for i in range(3): save(f'yard/bush_{i}', bush(i), (11, 15))
    for i in range(2): save(f'yard/tree_{i}', tree(i), (15, 42))
    r = run(32, 12, (4, 8), 12, 'plaster'); l = run(32, 12, (4, 8), 12, 'plaster', flip=True)
    sy = 2 + 12 + 2 - 2 + 0  # start-vertex y of a segment (yb - w//2)
    save('yard/fence_r', r, (2, 14)); save('yard/fence_l', l, (l.width - 3, 14))
    cx = 34; c = new(70, r.height); c.alpha_composite(r, (cx - 2, 0)); c.alpha_composite(l, (cx - (l.width - 3), 0)); save('yard/fence_corner', c, (cx, 14))
    g = run(32, 12, (4, 8), 12, 'plaster', gate=True); save('yard/fence_gate', g, (2, 14))
    rr = run(32, 10, (5,), 10, 'plaster'); save('porch/railing', rr, (2, 12))
    for k, (rows, _) in S.items():
        im = build(rows, L); save(k, im, (im.width // 2, im.height - 2))
    save('porch/steps', steps(), (18, 16)); a = awning(); save('porch/awning', a, (2, 2)); g2 = glow(); save('porch/lamp_glow', g2, (15, 22))
    json.dump(piv, open(os.path.join(out, 'pivots.json'), 'w'), indent=0); print(len(piv), 'exterior frames')
