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
        if u % 8 == 0 or v % 8 == 0: return R(a, 2)
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

TONE = {}
for _rn, _rr in PAL['ramps'].items():
    for _i, _c in enumerate(_rr): TONE[hx(_c)] = (_rn, _i)
def tone_shift(c, d):
    rn, i = TONE[tuple(c)]; return R(rn, max(0, min(4, i + d)))
SKY = {'day': ('sky', 3, 4), 'dusk': ('terracotta', 3, 4), 'night': ('navy', 1, 4)}
def window_px(u, v, u0, w_cells, tod):
    """Window art in wall px (u along the wall, v up from the floor line). Returns colour or None outside."""
    x0, x1, y0, y1 = u0, u0 + w_cells * 16, 16, 34
    if not (x0 <= u < x1 and y0 <= v < y1): return None
    if u < x0 + 2 or u >= x1 - 2 or v < y0 + 2 or v >= y1 - 2: return R('woodDark', 3 if v >= y1 - 2 else 2)   # frame
    if v < y0 + 4: return R('woodDark', 3)                                                                  # sill
    if (u - x0) % 16 == 8 or v == (y0 + y1) // 2: return R('woodDark', 2)                                  # muntins
    rn, base, hi = SKY[tod]
    if tod != 'night' and ((u - x0) + (v - y0)) % 14 in (0, 1) and (u - x0) % 16 < 8: return R(rn, hi)      # glint
    if tod == 'night' and ((u * 7 + v * 13) % 29 == 4): return R('butter', 4)                               # stars
    return R(rn, base)
def door_px(u, v, u0, tod):
    x0, x1, y1 = u0 + 1, u0 + 15, 30
    if not (x0 <= u < x1 and 0 <= v < y1): return None
    if u < x0 + 1 or u >= x1 - 1 or v >= y1 - 1: return R('woodDark', 3)
    if u in (x1 - 4,) and 12 <= v <= 13: return R('butter', 3)                      # knob
    if 3 <= v < 12 and x0 + 3 <= u < x1 - 3 or 16 <= v < 26 and x0 + 3 <= u < x1 - 3: return R('woodDark', 1)  # panels
    return R('woodDark', 2)

def shell(room, cols, rows, wallh_units, pal_cfg, windows=(), doors=(), tod='day'):
    """RGBA image + pivot (top vertex of the floor diamond). Left wall = gx=0 plane (u along gy), right wall = gy=0 plane (u along gx).
    windows: [(wall, at, w)], doors: [(wall, at)]. Window light falls on the floor as a dithered patch (not at night)."""
    wh = wallh_units * 4; rails = 3
    W = (cols + rows) * 16 + 2; H = wh + (cols + rows) * 8 + 2
    px0 = rows * 16 + 1; py0 = wh + 1
    img = np.zeros((H, W, 4), np.uint8)
    fl, wp, ws, tr = pal_cfg['floor_fn'], pal_cfg['wall_fn'], pal_cfg['wains_fn'], pal_cfg['trim_fn']
    def wall_col(wall, u, v):
        for (ww, at, wc) in windows:
            if ww == wall:
                c = window_px(u, v, at * 16, wc, tod)
                if c is not None: return c
        for (dw, at) in doors:
            if dw == wall:
                c = door_px(u, v, at * 16, tod)
                if c is not None: return c
        return ws(u, v) if v < 14 else (tr(u, wh - 1 - v) if wh - 1 - v < rails + 1 else wp(u, v))
    def lit(gx, gy):  # floor patch under each window, shifted +2 cells away from the wall
        if tod == 'night': return 0
        for (ww, at, wc) in windows:
            if ww == 'right' and at + 1 <= gx < at + wc + 1 and 1 <= gy < 3.2: return 2 if gy < 2.6 else 1
            if ww == 'left' and at + 1 <= gy < at + wc + 1 and 1 <= gx < 3.2: return 2 if gx < 2.6 else 1
        return 0
    for sy in range(H):
        for sx in range(W):
            x, y = sx - px0, sy - py0
            gx = (y / 8 + x / 16) / 2; gy = (y / 8 - x / 16) / 2
            if 0 <= gx < cols and 0 <= gy < rows:
                c = fl(int(gx * 16), int(gy * 16)); k = lit(gx, gy)
                if k == 2 or (k == 1 and BAYER[sy % 2, sx % 2] < 2): c = tone_shift(c, 1)
                img[sy, sx] = c; continue
            gxr = x / 16; hv = gxr * 8 - y
            if 0 <= gxr < cols and 0 <= hv < wh: img[sy, sx] = wall_col('right', int(gxr * 16), int(hv)); continue
            gyl = -x / 16; hv = gyl * 8 - y
            if 0 <= gyl < rows and 0 <= hv < wh: img[sy, sx] = wall_col('left', int(gyl * 16), int(hv))
    return img, (px0, py0)

def wall_tiled(c1, c2, top=34):
    """Kitchen: striped paper above, cream tile backsplash (8x6 tiles, light grout) from the wainscot up to `top`."""
    stripe = wall_striped(c1, c2)
    def f(u, v):
        if v < top:
            if v == top - 1: return R('teal', 3)
            if (v - 14) % 6 == 5 or (u + (3 if ((v - 14) // 6) % 2 else 0)) % 8 == 7: return R('plaster', 2)
            return R('plaster', 4) if hsh_(u, v) > 14 else R('plaster', 3)
        return stripe(u, v)
    return f
def hsh_(x, y): return ((x * 73856093) ^ (y * 19349663)) % 100
def wall_dotted(ramp, dot):
    """Bedroom: soft two-tone stripes with a sparse rose dot lattice, picture-rail line near the top."""
    def f(u, v):
        if v == 55: return R('plaster', 3)
        if (u % 12 == 5 and v % 10 == 3) or (u % 12 == 11 and v % 10 == 8): return R(dot, 3)
        return R(ramp, 3) if (u // 6) % 2 else R(ramp, 2)
    return f
WAINS = {'living': 'sage', 'kitchen': 'teal', 'bedroom': 'rose', 'bathroom': 'sky'}  # painted wainscot, no dark wood
def room_cfg(room):
    r = PAL['rooms'][room]
    if room == 'kitchen': fl = floor_checker('sage', 'plaster'); wp = wall_tiled('butter', 'plaster')
    elif room == 'bedroom': fl = floor_plank('woodWarm'); wp = wall_dotted('sky', 'rose')
    elif room == 'bathroom': fl = floor_stone('plaster'); wp = wall_plain('teal')
    else: fl = floor_plank(r['floor'] if r['floor'].startswith('wood') else 'woodWarm'); wp = wall_striped('plaster', r['accent'])
    return {'floor_fn': fl, 'wall_fn': wp, 'wains_fn': wainscot(WAINS.get(room, 'sage')), 'trim_fn': trim_rail('plaster')}

LAYOUT = {  # mirrors src/content/layout.ts (windows [(wall, at, w)], doors [(wall, at)])
    'living':  (10, 8, [('left', 1, 2), ('right', 5, 2)], [('left', 3), ('left', 6), ('right', 7)]),
    'kitchen': (9, 8, [('left', 1, 2), ('right', 5, 2)], [('left', 3)]),
    'bedroom': (9, 8, [('left', 4, 2), ('right', 7, 1)], [('left', 2), ('right', 8)])}
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for room, (c, r, wins, drs) in LAYOUT.items():
        for tod, suffix in (('day', 'full'), ('dusk', 'full_dusk'), ('night', 'full_night')):
            im, pv = shell(room, c, r, 10, room_cfg(room), wins, drs, tod)
            Image.fromarray(im).save(os.path.join(out, f'shell__{room}__{suffix}.png'))
        print(room, im.shape[1], im.shape[0], pv)
