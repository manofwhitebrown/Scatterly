#!/usr/bin/env python3
"""Offline 3D -> iso pixel sprite renderer (no GPU). Kenney OBJ in, Art-Bible sprite out.
Projection is the pixel-art 2:1 dimetric: sx = (gx-gy)*16, sy = (gx+gy)*8 - h*4 (art px), identical to src/art/iso.ts.
Canonical orientation: piece stands against the RIGHT back wall and faces +gy (screen lower-left). Model +x -> gx, model +z (front) -> gy.
Pipeline: fit to footprint -> z-buffered triangle raster at supersample SS -> 3-tone flat shading mapped to palette ramps
-> majority downsample -> palette-exact result -> 1 px coloured outline -> top-left highlight pixels."""
import json, os, sys
import numpy as np, trimesh
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
PAL = json.load(open(os.path.join(HERE, '..', '..', 'docs', 'art', 'palette.json')))
HW, HH, UH = 16, 8, 4
SS = 8
RAMPS = list(PAL['ramps'].keys())
def hx(s): return tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
COL = np.array([hx(c) for r in RAMPS for c in PAL['ramps'][r]], dtype=np.int32)  # index = ramp*5 + tone
BASE = np.array([hx(PAL['ramps'][r][2]) for r in RAMPS], dtype=np.int32)
MAT_DEFAULT = {'wood': 'woodWarm', 'woodDark': 'woodDark', 'carpet': 'terracotta', 'glass': 'sky', 'metal': 'stone', 'metalDark': 'stone',
               'metalMedium': 'stone', 'metalLight': 'stone'}
def ramp_for(rgb, override=None):
    if override is not None: return RAMPS.index(override)
    d = ((BASE - np.array(rgb[:3])) ** 2).sum(1)
    return int(d.argmin())
def tone_of(n):  # n = unit normal in grid space (gx, gy, up)
    v = 0.6 * n[2] + 0.4 * n[1] - 0.25 * n[0]
    return 3 if v >= 0.5 else (2 if v >= 0.1 else 1)

def load(model_dir, name):
    s = trimesh.load(os.path.join(model_dir, name + '.obj'), force='scene')
    parts = []
    for g in s.geometry.values():
        m = g.visual.material if hasattr(g.visual, 'material') else None
        diff = tuple(m.diffuse[:3]) if m is not None and getattr(m, 'diffuse', None) is not None else (200, 200, 200)
        parts.append((np.asarray(g.vertices, float), np.asarray(g.faces), diff, getattr(m, 'name', '')))
    return parts

def render(model_dir, name, foot, height, ramps=None, flip=False, hide=()):
    """foot = (W, D) cells, height in units. ramps: {materialName: rampName}. Returns (RGBA ndarray, pivot (x,y), meta)."""
    parts = [p for p in load(model_dir, name) if p[3] not in hide]
    allv = np.vstack([p[0] for p in parts])
    mn, mx = allv.min(0), allv.max(0)
    W, D = foot
    sc = np.array([W / max(mx[0] - mn[0], 1e-6), height / max(mx[1], 1e-6), D / max(mx[2] - mn[2], 1e-6)])
    tris, rid = [], []
    for v, f, diff, mat in parts:
        g = np.stack([(v[:, 0] - mn[0]) * sc[0], (v[:, 2] - mn[2]) * sc[2], v[:, 1] * sc[1]], 1)  # gx, gy, up(units)
        if flip: g[:, 0] = W - g[:, 0]; f = f[:, ::-1]
        ramp = ramp_for(diff, (ramps or {}).get(mat) or MAT_DEFAULT.get(mat))
        tris.append(g[f]); rid += [ramp] * len(f)
    T = np.concatenate(tris)  # (n,3,3)
    rid = np.array(rid)
    sx = (T[:, :, 0] - T[:, :, 1]) * HW
    sy = (T[:, :, 0] + T[:, :, 1]) * HH - T[:, :, 2] * UH
    dep = T[:, :, 0] + T[:, :, 1] + 0.5 * T[:, :, 2]
    x0, x1 = np.floor(sx.min()) - 2, np.ceil(sx.max()) + 2
    y0, y1 = np.floor(sy.min()) - 2, np.ceil(sy.max()) + 2
    w, h = int(x1 - x0), int(y1 - y0)
    zb = np.full((h * SS, w * SS), -1e9); ib = np.full((h * SS, w * SS), -1, np.int32)
    nrm = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0])
    # grid space is left-handed w.r.t. our axes order; orient normals toward the viewer (+gx+gy+up)
    ln = np.linalg.norm(nrm, axis=1, keepdims=True); nrm = nrm / np.maximum(ln, 1e-9)
    sgn = np.sign(nrm @ np.array([1.0, 1.0, 1.0])); sgn[sgn == 0] = 1
    nrm = nrm * sgn[:, None]
    for i in range(len(T)):
        px = (sx[i] - x0) * SS; py = (sy[i] - y0) * SS
        ax, ay = px[0], py[0]
        den = (py[1] - py[2]) * (px[0] - px[2]) + (px[2] - px[1]) * (py[0] - py[2])
        if abs(den) < 1e-9: continue
        xa, xb = int(max(0, np.floor(px.min()))), int(min(w * SS - 1, np.ceil(px.max())))
        ya, yb = int(max(0, np.floor(py.min()))), int(min(h * SS - 1, np.ceil(py.max())))
        if xb < xa or yb < ya: continue
        X, Y = np.meshgrid(np.arange(xa, xb + 1) + 0.5, np.arange(ya, yb + 1) + 0.5)
        l0 = ((py[1] - py[2]) * (X - px[2]) + (px[2] - px[1]) * (Y - py[2])) / den
        l1 = ((py[2] - py[0]) * (X - px[2]) + (px[0] - px[2]) * (Y - py[2])) / den
        l2 = 1 - l0 - l1
        m = (l0 >= -1e-6) & (l1 >= -1e-6) & (l2 >= -1e-6)
        z = l0 * dep[i, 0] + l1 * dep[i, 1] + l2 * dep[i, 2]
        sl = (slice(ya, yb + 1), slice(xa, xb + 1))
        upd = m & (z > zb[sl])
        zb[sl][upd] = z[upd]
        ib[sl][upd] = rid[i] * 5 + tone_of(nrm[i])
    # majority downsample to native pixels
    blocks = ib.reshape(h, SS, w, SS).transpose(0, 2, 1, 3).reshape(h, w, SS * SS)
    opaque = (blocks >= 0).sum(-1) >= (SS * SS) // 2
    best = np.full((h, w), -1, np.int32); bc = np.zeros((h, w), np.int32)
    for k in np.unique(blocks[blocks >= 0]):
        c = (blocks == k).sum(-1)
        up = c > bc; best[up] = k; bc[up] = c[up]
    best[~opaque] = -1
    # top-left highlight: light-tone pixel whose up or left neighbour is empty or darker tone
    out = best.copy()
    for yy in range(h):
        for xx in range(w):
            k = best[yy, xx]
            if k >= 0 and k % 5 == 3:
                up = best[yy - 1, xx] if yy > 0 else -1
                lf = best[yy, xx - 1] if xx > 0 else -1
                if up < 0 or lf < 0: out[yy, xx] = k + 1
    # outline: empty pixel next to opaque gets ramp[0] of the neighbour's ramp
    rgba = np.zeros((h, w, 4), np.uint8)
    for yy in range(h):
        for xx in range(w):
            k = out[yy, xx]
            if k >= 0: rgba[yy, xx] = (*COL[k], 255)
    for yy in range(h):
        for xx in range(w):
            if out[yy, xx] >= 0: continue
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = yy + dy, xx + dx
                if 0 <= ny < h and 0 <= nx < w and out[ny, nx] >= 0:
                    rgba[yy, xx] = (*COL[(out[ny, nx] // 5) * 5], 255); break
    ys, xs = np.nonzero(rgba[:, :, 3])
    cx0, cx1, cy0, cy1 = xs.min() - 1, xs.max() + 2, ys.min() - 1, ys.max() + 2   # 1 px transparent padding
    cx0, cy0 = max(cx0, 0), max(cy0, 0)
    rgba = rgba[cy0:cy1, cx0:cx1]
    pivot = (int(-x0 - cx0), int(-y0 - cy0))
    return rgba, pivot, {'name': name, 'foot': [W, D], 'h': height, 'size': [rgba.shape[1], rgba.shape[0]], 'pivot': list(pivot),
                         'faces': int(len(T))}

def main():
    spec = json.load(open(sys.argv[1])); model_dir = sys.argv[2]; out = sys.argv[3]
    os.makedirs(out, exist_ok=True); meta = {}
    for key, s in spec.items():
        img, pivot, m = render(model_dir, s['model'], tuple(s['foot']), s['h'], s.get('ramps'), s.get('flip', False), tuple(s.get('hide', ())))
        fn = key.replace('/', '__') + '.png'
        Image.fromarray(img).save(os.path.join(out, fn)); m['file'] = fn; meta[key] = m
    json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=1)
    print(len(meta), 'sprites')
if __name__ == '__main__': main()
