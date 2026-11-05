#!/usr/bin/env python3
"""Avatar and cat frames, generated from small drawing functions (shared parts, animated by offsets). Usage: chars.py <outdir>
Authored facing SE (screen lower-right); 'sw' frames are exact mirrors. Keys: avatar/<dir>/<anim>/<n>, pet/cat/<anim>/<n>."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dsl import build, mirror
class C:
    def __init__(s, w, h): s.w, s.h, s.g, s.leg = w, h, {}, {}
    def r(s, x, y, w, h, ch):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < s.w and 0 <= yy < s.h: s.g[(xx, yy)] = ch
    def p(s, x, y, ch): s.r(x, y, 1, 1, ch)
    def rows(s): return [''.join(s.g.get((x, y), '.') for x in range(s.w)) for y in range(s.h)]
LEG = {'s': 'rose.3', 'S': 'rose.2', 'h': 'woodDark.2', 'H': 'woodDark.1', 'e': 'ink', 'a': 'sage.2', 'A': 'sage.1', 'n': 'navy.2', 'N': 'navy.1',
       'f': 'woodDark.3', 'c': 'terracotta.3', 'C': 'terracotta.2', 'w': 'plaster.4', 'x': 'rose.2', 'o': 'paper', 'k': 'stone.3'}
def avatar(anim, n):
    c = C(12, 22); bob = 1 if (anim == 'walk' and n in (1, 4)) else (1 if anim == 'idle' and n == 1 else 0)
    t = bob
    c.r(2, t, 8, 4, 'h'); c.r(2, t + 3, 2, 3, 'h')                       # hair, side lock
    c.r(3, t + 3, 7, 6, 's'); c.r(9, t + 4, 1, 3, 'S')                   # face, cheek shade
    c.p(6, t + 5, 'e'); c.p(8, t + 5, 'e'); c.p(7, t + 7, 'x')           # eyes shifted to SE, mouth
    c.r(4, t + 1, 3, 1, 'f'); c.p(3, t + 4, 'H'); c.p(2, t + 7, 'H'); c.p(4, t + 5, 'S')   # hair highlight, back-hair shade, ear
    c.r(3, t + 9, 7, 7, 'a'); c.r(3, t + 15, 7, 1, 'A'); c.r(9, t + 10, 1, 5, 'A')       # sweater, shade on the far-from-light side
    c.r(5, t + 9, 3, 1, 'w')                                                               # collar
    for i in range(5): c.p(4 + i, t + 10 + i, 'c' if i % 2 == 0 else 'C')                  # satchel strap
    swing = {0: 0, 1: 1, 2: 0, 3: 0, 4: -1, 5: 0}.get(n, 0) if anim == 'walk' else 0
    c.r(2, t + 10 + swing, 1, 5, 'A'); c.r(10, t + 10 - swing, 1, 5, 'a')  # arms
    c.p(2, t + 15 + swing, 's'); c.p(10, t + 15 - swing, 's')             # hands
    if anim == 'reach': c.r(10, t + 5, 1, 6, 'a'); c.p(10, t + 4, 's'); c.r(10, t + 10, 1, 1, 'a')
    a, b = {0: (0, 0), 1: (-1, 1), 2: (-2, 2), 3: (0, 0), 4: (1, -1), 5: (2, -2)}.get(n, (0, 0)) if anim == 'walk' else (0, 0)
    c.r(4, 16, 2, 5 - (1 if a < 0 else 0), 'N'); c.r(7, 16, 2, 5 - (1 if b < 0 else 0), 'n')
    c.r(4 + max(a, 0) - (1 if a < 0 else 0) * 0, 21 - (1 if a < 0 else 0), 3, 1, 'f'); c.r(7 + max(b, 0), 21 - (1 if b < 0 else 0), 3, 1, 'f')
    return c.rows()
def cat(anim, n):
    c = C(18, 12)
    if anim == 'sleep':
        br = 1 if n in (1, 2) else 0
        c.r(1, 5 - br, 13, 5 + br, 'c'); c.r(1, 9, 13, 1, 'C'); c.r(11, 4, 5, 5, 'c'); c.p(11, 3, 'c'); c.p(15, 3, 'c'); c.r(13, 6, 2, 1, 'C'); c.r(2, 8, 11, 2, 'w')
        for i in range(3): c.p(3 + i * 3, 5 - br, 'C')
        return c.rows()
    lift = {'walk': (n % 2), 'react': 0, 'eat': 0, 'idle': 0}[anim]
    arch = 1 if anim == 'react' and n in (1, 2) else 0
    hy = 4 if anim != 'eat' else 6
    c.r(3, 4 - arch, 10, 4, 'c'); c.r(3, 7, 10, 1, 'C')
    for i in range(3): c.p(5 + i * 3, 4 - arch, 'C')
    c.r(11, hy - 1, 5, 4 + (0 if anim != 'eat' else 0), 'c'); c.p(11, hy - 2, 'c'); c.p(15, hy - 2, 'c'); c.p(14, hy, 'e'); c.p(12, hy, 'e'); c.p(15, hy + 1, 'x')
    tail = {0: 0, 1: 1, 2: 2, 3: 1}.get(n % 4, 0) if anim == 'idle' else 0
    c.r(0, 3 - tail, 3, 2, 'c'); c.p(0, 2 - tail, 'C')
    legs = [(4, lift), (6, 1 - lift), (10, 1 - lift), (12, lift)] if anim == 'walk' else [(4, 0), (6, 0), (10, 0), (12, 0)]
    for x, l in legs: c.r(x, 8, 1, 3 - l, 'c'); c.p(x, 10 - l, 'w')
    return c.rows()
ANIMS = {'avatar': {'idle': 2, 'walk': 6, 'reach': 3}, 'cat': {'sleep': 4, 'idle': 4, 'walk': 6, 'react': 4, 'eat': 4}}
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); n = 0
    for anim, cnt in ANIMS['avatar'].items():
        for i in range(cnt):
            rows = avatar(anim, i)
            for d, rr in (('se', rows), ('sw', mirror(rows))): build(rr, LEG).save(os.path.join(out, f'avatar__{d}__{anim}__{i}.png')); n += 1
    for anim, cnt in ANIMS['cat'].items():
        for i in range(cnt): build(cat(anim, i), LEG).save(os.path.join(out, f'pet__cat__{anim}__{i}.png')); n += 1
    print(n, 'frames')
