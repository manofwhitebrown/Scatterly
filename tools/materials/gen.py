#!/usr/bin/env python3
"""Algorithmic native-pixel materials and room shells (Art Bible section 6). Patterns are defined in flat (u,v) art px and
projected onto the iso diamond / walls with nearest sampling, so every pixel stays palette-exact."""
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
PAL = json.load(open(os.path.join(HERE, '..', '..', 'docs', 'art', 'palette.json')))
def hx(s): return tuple(int(s[i:i+2], 16) for i in (1, 3, 5)) + (255,)
def R(ramp, t): return hx(PAL['ramps'][ramp][t])
BAYER = np.array([[0, 2], [3, 1]])

def floor_plank(ramp):
    def f(u, v):
        pl = (v // 4); off = (pl % 3) * 5
        uu = (u + off) % 24
        if v % 4 == 0: return R(ramp, 1)                      # seam
        if uu == 0: return R(ramp, 1)                         # plank end
        if (uu * 7 + pl * 11) % 23 == 5: return R(ramp, 3)    # grain fleck
        return R(ramp, 2)
    return f
def floor_checker(a, b):
    def f(u, v):
        if u % 8 == 0 or v % 8 == 0: return R(a, 1)
        return R(a, 3) if ((u // 8) + (v // 8)) % 2 == 0 else R(b, 2)
    return f
def floor_stone(ramp):
    def f(u, v):
        if u % 16 == 0 or v % 8 == 0: return R(ramp, 1)
        if (u * 5 + v * 13) % 41 == 3: return R(ramp, 4)
        return R(ramp, 2)
    return f
def wall_striped(c1, c2):
    return lambda u, v: R(c1, 2) if (u // 4) % 2 == 0 else R(c2, 3)
def wall_plain(ramp):
    return lambda u, v: R(ramp, 2) if BAYER[v % 2, u % 2] < 3 or v % 7 else R(ramp, 3)
def wainscot(ramp):
    def f(u, v):  # v counted from the floor up, 14 px tall
        if v == 13: return R(ramp, 4)
        if v == 12: return R(ramp, 3)
        if v == 11: return R(ramp, 0)
        if u % 10 == 0: return R(ramp, 1)
        if v == 10 and u % 10 != 0: return R(ramp, 3)
        return R(ramp, 2)
    return f
def trim_rail(ramp):
    return lambda u, v: R(ramp, 3) if v == 0 else (R(ramp, 2) if v == 1 else R(ramp, 1) if v == 2 else R(ramp, 0))

def shell(room, cols, rows, wallh_units, pal_cfg, windows=(), doors=()):
    """Returns RGBA image + pivot (top vertex of the floor diamond). Left wall = gx=0 plane, right wall = gy=0 plane."""
    wh = wallh_units * 4; rails = 3
    W = (cols + rows) * 16 + 2; H = wh + (cols + rows) * 8 + 2
    px0 = rows * 16 + 1; py0 = wh + 1  # screen position of floor top vertex
    img = np.zeros((H, W, 4), np.uint8)
    fl = pal_cfg['floor_fn']; wp = pal_cfg['wall_fn']; ws = pal_cfg['wains_fn']; tr = pal_cfg['trim_fn']
    for sy in range(H):
        for sx in range(W):
            x, y = sx - px0, sy - py0
            # floor: x=(gx-gy)*16, y=(gx+gy)*8  (diamond centre sampling)
            gx = (y / 8 + x / 16) / 2; gy = (y / 8 - x / 16) / 2
            if 0 <= gx < cols and 0 <= gy < rows:
                img[sy, sx] = fl(int(gx * 16), int(gy * 16)); continue
            # right wall (gy in [-0.0..0], gx in [0,cols)): x=gx*16, y=gx*8 - h*4
            gxr = x / 16; hr = (gxr * 8 - y) / 4
            if 0 <= gxr < cols and 0 <= hr < wallh_units and -1 <= (y - gxr * 8) <= 0 or (0 <= gxr < cols and 0 <= hr < wallh_units and False):
                pass
            hv = gxr * 8 - y  # art px above floor line of that wall
            if 0 <= gxr < cols and 0 <= hv < wh:
                u = int(gxr * 16); v = int(hv)
                img[sy, sx] = ws(u, v) if v < 14 else (tr(u, wh - 1 - v) if wh - 1 - v < rails + 1 else wp(u, v)); continue
            gyl = -x / 16; hv = gyl * 8 - y
            if 0 <= gyl < rows and 0 <= hv < wh:
                u = int(gyl * 16); v = int(hv)
                c = ws(u, v) if v < 14 else (tr(u, wh - 1 - v) if wh - 1 - v < rails + 1 else wp(u, v))
                img[sy, sx] = tuple(int(q) for q in (c[0] * 0 + c[0], c[1], c[2], 255)); continue
    return img, (px0, py0)

def room_cfg(room):
    r = PAL['rooms'][room]
    if room == 'kitchen': fl = floor_checker('stone', 'plaster'); wp = wall_striped('butter', 'plaster')
    elif room == 'bedroom': fl = floor_plank('woodWarm'); wp = wall_plain('sky')
    elif room == 'bathroom': fl = floor_stone('plaster'); wp = wall_plain('teal')
    else: fl = floor_plank(r['floor'] if r['floor'].startswith('wood') else 'woodWarm'); wp = wall_striped('plaster', r['accent'])
    return {'floor_fn': fl, 'wall_fn': wp, 'wains_fn': wainscot('woodWarm'), 'trim_fn': trim_rail('woodDark')}

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for room, c, r in (('living', 10, 8), ('kitchen', 9, 8), ('bedroom', 9, 8)):
        im, pv = shell(room, c, r, 10, room_cfg(room))
        Image.fromarray(im).save(os.path.join(out, f'shell__{room}.png')); print(room, im.shape[1], im.shape[0], pv)
