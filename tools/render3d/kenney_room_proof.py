#!/usr/bin/env python3
"""Gate A0 art proof: Kenney Furniture Kit (CC0) -> one warm iso pixel-art room.
Usage: python3 kenney_room_proof.py "<Models/OBJ format dir>" out.png
Pipeline: OBJ -> z-buffer rasterise (orthographic, yaw 45, elev 30 = exact 2:1 tiles)
-> 3-step flat shading mapped onto palette ramps -> per-object 1px outlines.
Floors/walls/trim are generated procedurally. Native art res, 1 art px = 3 screen px.
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw

KDIR = sys.argv[1] if len(sys.argv) > 1 else "/tmp/k/Models/OBJ format"
OUT = sys.argv[2] if len(sys.argv) > 2 else "proof.png"

S = 45.25            # px per Kenney unit: one 0.5u grid tile = 32x16 art px
TILE = 0.5
SX = S / math.sqrt(2)
COS30, SIN30 = math.cos(math.radians(30)), 0.5


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


RAMPS = {  # highlight, light, mid, shadow
    "WOOD": ["#f0c389", "#d79b5e", "#b0703f", "#82492f"],
    "WOOD_D": ["#c48a56", "#a56a3e", "#7d4a2c", "#573223"],
    "TERRA": ["#f2a07f", "#d97a5c", "#b05646", "#7f3b3c"],
    "TEAL": ["#9ccfc4", "#6fb0aa", "#4d8c90", "#356a74"],
    "MUSTARD": ["#f8dc8c", "#eab75f", "#c58f45", "#8d6232"],
    "CREAM": ["#fff6e2", "#f1dcb8", "#d5b996", "#a98f77"],
    "METAL": ["#d9d6cd", "#b3b1ac", "#8a8a8e", "#5f5f70"],
    "DARK": ["#6a6070", "#4e4659", "#3a3446", "#27222f"],
    "GREEN": ["#b8d58a", "#8fb868", "#689350", "#466e44"],
    "FUR": ["#d9a979", "#b98458", "#8f6140", "#684330"],
    "GLASS": ["#d8f0ea", "#b2dad6", "#8bbdc2", "#6a9ba8"],
    "LAMP": ["#fffbd6", "#fff0a3", "#ffe27a", "#f2c552"],
}
RAMP_IDS = {k: i for i, k in enumerate(RAMPS)}
RAMP_ARR = np.array([[hx(c) for c in v] for v in RAMPS.values()], np.uint8)
MAT = {"wood": "WOOD", "woodDark": "WOOD_D", "carpet": "TERRA", "carpetBlue": "TEAL",
       "carpetDarker": "TERRA", "carpetWhite": "CREAM", "fur": "FUR", "glass": "GLASS",
       "lamp": "LAMP", "metal": "METAL", "metalDark": "DARK", "metalLight": "CREAM",
       "metalMedium": "METAL", "plant": "GREEN", "_defaultMat": "CREAM"}

_cache = {}


def load_obj(name):
    if name in _cache:
        return _cache[name]
    mtl, cur = {}, None
    for l in open(os.path.join(KDIR, name + ".mtl")):
        p = l.split()
        if p and p[0] == "newmtl":
            cur = p[1]
    verts, tris, mats, cm = [], [], [], "_defaultMat"
    for l in open(os.path.join(KDIR, name + ".obj")):
        p = l.split()
        if not p:
            continue
        if p[0] == "v":
            verts.append([float(x) for x in p[1:4]])
        elif p[0] == "usemtl":
            cm = p[1]
        elif p[0] == "f":
            ix = [int(t.split("/")[0]) for t in p[1:]]
            ix = [i - 1 if i > 0 else len(verts) + i for i in ix]
            for i in range(1, len(ix) - 1):
                tris.append([verts[ix[0]], verts[ix[i]], verts[ix[i + 1]]])
                mats.append(cm)
    _cache[name] = (np.array(tris, np.float32), mats)
    return _cache[name]


def dims(name):
    t, _ = load_obj(name)
    mn, mx = t.reshape(-1, 3).min(0), t.reshape(-1, 3).max(0)
    return mn, mx


# ---------------- layout (tile units; room W along gx, D along gy) ----------------
W, D, WH = 7, 6, 64
PAD = 14
OX = PAD + D * 16
OY = PAD + WH
CW = (W + D) * 16 + PAD * 2
CH = WH + (W + D) * 8 + PAD * 2 + 8


def pf(gx, gy, h=0):
    return (OX + (gx - gy) * 16, OY + (gx + gy) * 8 - h)


def pw(wall, t, h):
    return (OX - t * 16, OY + t * 8 - h) if wall == "L" else (OX + t * 16, OY + t * 8 - h)


# (name, gx, gy, rot=facing direction, y, ramp overrides, snap) ; snap 'R' = back to right wall (gy=0), 'L' = back to left wall (gx=0)
PROPS = [
    ("bookcaseOpen", 0.95, 0, 0, 0, {}, "R"),
    ("pottedPlant", 3.0, 0.5, 0, 0, {}, "R"),
    ("cabinetTelevision", 5.5, 0, 0, 0, {}, "R"),
    ("televisionModern", 5.5, 0.4, 0, "TOP:cabinetTelevision", {}, "R"),
    ("speakerSmall", 4.3, 0.3, 0, 0, {}, "R"),
    ("speakerSmall", 6.7, 0.3, 0, 0, {}, "R"),
    ("rugRectangle", 3.6, 3.4, 0, 0, {"carpet": "MUSTARD", "carpetDarker": "TERRA", "carpetWhite": "CREAM"}, None),
    ("loungeSofa", 0, 2.6, 1, 0, {"carpet": "TEAL", "carpetDarker": "TEAL", "carpetBlue": "TEAL"}, "L"),
    ("pillowBlue", 0.75, 2.0, 1, 0.2, {}, None),
    ("pillow", 0.75, 3.15, 1, 0.2, {"carpet": "MUSTARD"}, None),
    ("bear", 0.78, 2.55, 1, 0.2, {}, None),
    ("tableCoffee", 3.4, 3.4, 0, 0, {}, None),
    ("books", 3.2, 3.2, 0, "TOP:tableCoffee", {}, None),
    ("sideTable", 0, 4.6, 1, 0, {}, "L"),
    ("lampRoundTable", 0.4, 4.6, 0, "TOP:sideTable", {}, None),
    ("loungeSofaOttoman", 5.0, 3.9, 0, 0, {"carpet": "TERRA", "carpetDarker": "TERRA"}, None),
    ("lampRoundFloor", 6.5, 2.0, 0, 0, {}, None),
    ("bookcaseClosedWide", 0, 0.9, 1, 0, {}, "L"),
    ("plantSmall2", 0.3, 5.5, 0, 0, {}, None),
    ("radio", 0.5, 4.75, 1, "TOP:sideTable", {}, None),
]


def top_y(name):
    return float(dims(name)[1][1])


def build_tris():
    P, Dp, tone, ramp, obj, istop = [], [], [], [], [], []
    sprites = []
    L = np.array([0.3, 0.8, 0.55]); L /= np.linalg.norm(L)
    V = np.array([COS30 / math.sqrt(2), SIN30, COS30 / math.sqrt(2)])
    for oi, (name, gx, gy, rot, yy, over, snap) in enumerate(PROPS, 1):
        try:
            tr, mats = load_obj(name)
        except FileNotFoundError:
            print("missing model", name); continue
        t = tr.copy()
        # Kenney models face -z. `rot` = direction the FRONT faces: 0=+z (down-left), 1=+x (down-right), 2=-z, 3=-x
        k = (rot + 2) % 4
        c, s = math.cos(math.radians(-k * 90)), math.sin(math.radians(-k * 90))
        x, z = t[..., 0].copy(), t[..., 2].copy()
        t[..., 0], t[..., 2] = x * c - z * s, x * s + z * c
        mn, mx = t.reshape(-1, 3).min(0), t.reshape(-1, 3).max(0)
        cx, cz = (mn[0] + mx[0]) / 2, (mn[2] + mx[2]) / 2
        tx, tz = gx * TILE, gy * TILE
        if snap == "R":
            tz = (mx[2] - mn[2]) / 2 + 0.01
        if snap == "L":
            tx = (mx[0] - mn[0]) / 2 + 0.01
        t[..., 0] += tx - cx; t[..., 2] += tz - cz
        y0 = top_y(yy.split(":")[1]) if isinstance(yy, str) else yy
        t[..., 1] += y0 - mn[1]
        foot = (tx - (mx[0] - mn[0]) / 2, tz - (mx[2] - mn[2]) / 2, tx + (mx[0] - mn[0]) / 2, tz + (mx[2] - mn[2]) / 2)
        if y0 == 0 and name not in ("rugRectangle",):
            sprites.append(foot)
        for tri, m in zip(t, mats):
            n = np.cross(tri[1] - tri[0], tri[2] - tri[0])
            ln = np.linalg.norm(n)
            if ln < 1e-9:
                continue
            n /= ln
            if n @ V < 0:
                n = -n
            i = n @ L
            tn = 1 if i > 0.7 else (2 if i > 0.42 else 3)
            if m == "lamp":
                tn = 1
            sx = OX + (tri[:, 0] - tri[:, 2]) * SX
            sy = OY + (tri[:, 0] + tri[:, 2]) * SX * 0.5 - tri[:, 1] * S * COS30
            dd = (tri[:, 0] + tri[:, 2]) * COS30 / math.sqrt(2) + tri[:, 1] * SIN30
            P.append(np.stack([sx, sy], 1)); Dp.append(dd)
            tone.append(tn); obj.append(oi); istop.append(n[1] > 0.9)
            ramp.append(RAMP_IDS[over.get(m, MAT.get(m, "CREAM"))])
    return (np.array(P), np.array(Dp), np.array(tone), np.array(ramp), np.array(obj), np.array(istop), sprites)


def rasterise(P, Dp):
    zb = np.full((CH, CW), -1e9, np.float32)
    tb = np.full((CH, CW), -1, np.int32)
    for t in range(len(P)):
        (x0, y0), (x1, y1), (x2, y2) = P[t]
        minx, maxx = max(int(math.floor(min(x0, x1, x2))), 0), min(int(math.ceil(max(x0, x1, x2))), CW - 1)
        miny, maxy = max(int(math.floor(min(y0, y1, y2))), 0), min(int(math.ceil(max(y0, y1, y2))), CH - 1)
        if maxx < minx or maxy < miny:
            continue
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-9:
            continue
        X, Y = np.meshgrid(np.arange(minx, maxx + 1) + 0.5, np.arange(miny, maxy + 1) + 0.5)
        a = ((y1 - y2) * (X - x2) + (x2 - x1) * (Y - y2)) / den
        b = ((y2 - y0) * (X - x2) + (x0 - x2) * (Y - y2)) / den
        c = 1 - a - b
        m = (a >= -1e-6) & (b >= -1e-6) & (c >= -1e-6)
        if not m.any():
            continue
        d = a * Dp[t, 0] + b * Dp[t, 1] + c * Dp[t, 2]
        zs = zb[miny:maxy + 1, minx:maxx + 1]
        up = m & (d > zs)
        zs[up] = d[up]
        tb[miny:maxy + 1, minx:maxx + 1][up] = t
    return zb, tb


def shade_props(tone, ramp, obj, istop, zb, tb):
    ids = np.where(tb >= 0, obj[np.clip(tb, 0, None)], 0)
    tn = np.where(tb >= 0, tone[np.clip(tb, 0, None)], 0)
    rp = np.where(tb >= 0, ramp[np.clip(tb, 0, None)], 0)
    top = np.where(tb >= 0, istop[np.clip(tb, 0, None)], False)
    up_id = np.roll(ids, 1, 0); up_id[0] = 0
    rim = top & (up_id != ids)
    tn = np.where(rim, 0, tn)
    rgb = RAMP_ARR[rp, tn].astype(np.float32)
    rgba = np.zeros((CH, CW, 4), np.uint8)
    solid = ids > 0
    rgba[..., :3] = rgb; rgba[solid, 3] = 255
    # inner separation: darken farther-object pixels that touch a nearer object
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nid, nz = np.roll(ids, (dy, dx), (0, 1)), np.roll(zb, (dy, dx), (0, 1))
        inner = solid & (nid > 0) & (nid != ids) & (zb < nz - 1e-3)
        rgba[inner, :3] = (rgba[inner, :3] * 0.55).astype(np.uint8)
    # outer outline in empty pixels
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nid = np.roll(ids, (dy, dx), (0, 1))
        ncol = np.roll(rgba[..., :3], (dy, dx), (0, 1))
        outer = (~solid) & (nid > 0) & (rgba[..., 3] == 0)
        rgba[outer, :3] = (ncol[outer] * 0.38).astype(np.uint8)
        rgba[outer, 3] = 255
    return Image.fromarray(rgba, "RGBA")


def poly(d, pts, fill):
    d.polygon([(round(x), round(y)) for x, y in pts], fill=fill)


def wall_quad(wall, t0, t1, h0, h1):
    return [pw(wall, t0, h0), pw(wall, t1, h0), pw(wall, t1, h1), pw(wall, t0, h1)]


def draw_shell(img):
    d = ImageDraw.Draw(img)
    # dark patterned backdrop
    d.rectangle([0, 0, CW, CH], fill=hx("#2a2030"))
    rng = np.random.default_rng(3)
    for _ in range(70):
        x, y = int(rng.integers(0, CW)), int(rng.integers(0, CH))
        d.point((x, y), fill=hx("#352a3d")); d.point((x + 1, y), fill=hx("#352a3d"))
    # floor slab front edges
    th = 7
    poly(d, [pf(0, D), pf(0, D, -th), pf(W, D, -th), pf(W, D)], hx("#6b4230"))
    poly(d, [pf(0, D), pf(W, D), pf(W, D, -th), pf(0, D, -th)], hx("#6b4230"))
    poly(d, [pf(0, D), pf(0, D, -th), pf(W, D, -th)][:0] or [pf(0, D), pf(W, D), pf(W, D, -th), pf(0, D, -th)], hx("#7c4d36"))
    poly(d, [pf(W, 0), pf(W, D), pf(W, D, -th), pf(W, 0, -th)], hx("#563426"))
    poly(d, [pf(0, D), pf(W, D), pf(W, D, -th), pf(0, D, -th)], hx("#7c4d36"))
    # floor planks (per-pixel inverse iso)
    fl = np.zeros((CH, CW, 4), np.uint8)
    ys, xs = np.mgrid[0:CH, 0:CW]
    sx, sy = xs + 0.5 - OX, ys + 0.5 - OY
    gx, gy = (sx / 16 + sy / 8) / 2, (sy / 8 - sx / 16) / 2
    inside = (gx >= 0) & (gx < W) & (gy >= 0) & (gy < D)
    plank = np.floor(gy * 3).astype(int)
    seg = np.floor(gx + (plank * 0.37) % 1.0).astype(int)
    hsh = ((plank * 73856093) ^ (seg * 19349663)) & 0xFF
    r1=RAMP_ARR[RAMP_IDS["WOOD"]][1].astype(np.float32); r0=RAMP_ARR[RAMP_IDS["WOOD"]][0].astype(np.float32); r2=RAMP_ARR[RAMP_IDS["WOOD"]][2].astype(np.float32)
    v=(hsh % 4)[..., None]
    base=np.where(v==0,r1,np.where(v==1,r1*1.05,np.where(v==2,r1*0.94,r0*0.97)))
    grain=((((xs//2)*7+(ys//2)*13+plank*5)&15)==0)[..., None]
    base=np.where(grain,base*0.93,base)
    seam = (np.abs(gy * 3 - np.round(gy * 3)) < 0.05) | (np.abs((gx + (plank * 0.37) % 1.0) - np.round(gx + (plank * 0.37) % 1.0)) < 0.03)
    col = np.where(seam[..., None], (r1+r2)/2*0.95, base).clip(0,255).astype(np.uint8)
    fl[..., :3] = col; fl[inside, 3] = 255
    img.alpha_composite(Image.fromarray(fl, "RGBA"))
    d = ImageDraw.Draw(img)
    # walls
    wp, cr, wd, tr = hx("#f3dcb5"), hx("#e9c394"), hx("#b0703f"), hx("#f0c389")
    for wall, L_, shade in (("L", D, 0.86), ("R", W, 1.0)):
        sh = lambda c: tuple(int(v * shade) for v in c)
        poly(d, wall_quad(wall, 0, L_, 0, WH), sh(wp))
        k, t = 0, 0.0
        while t < L_:
            if k % 2:
                poly(d, wall_quad(wall, t, min(t + 0.19, L_), 17, WH - 5), sh(cr))
            t += 0.19; k += 1
        # wainscot
        poly(d, wall_quad(wall, 0, L_, 0, 17), sh(wd))
        t, k = 0.0, 0
        while t < L_:
            poly(d, wall_quad(wall, t, t + 0.06, 0, 17), sh(hx("#8c5535")))
            t += 0.25
        poly(d, wall_quad(wall, 0, L_, 15, 18), sh(tr))
        poly(d, wall_quad(wall, 0, L_, 0, 3), sh(hx("#e4b27a")))
        poly(d, wall_quad(wall, 0, L_, WH - 5, WH), sh(hx("#fbeed0")))   # cornice
        poly(d, wall_quad(wall, 0, L_, WH - 6, WH - 5), sh(hx("#b98d66")))
    # thick cut ends
    poly(d, [pw("L", D, WH), pw("L", D, 0), (pw("L", D, 0)[0] + 5, pw("L", D, 0)[1] + 2), (pw("L", D, WH)[0] + 5, pw("L", D, WH)[1] + 2)], hx("#c79a6e"))
    poly(d, [pw("R", W, WH), pw("R", W, 0), (pw("R", W, 0)[0] - 5, pw("R", W, 0)[1] + 2), (pw("R", W, WH)[0] - 5, pw("R", W, WH)[1] + 2)], hx("#a97a58"))
    # window on right wall + curtains
    t0, t1, h0, h1 = 1.9, 3.9, 24, 54
    poly(d, wall_quad("R", t0 - 0.08, t1 + 0.08, h0 - 3, h1 + 3), hx("#f7e7c6"))
    poly(d, wall_quad("R", t0, t1, h0, h1), hx("#bfe6f2"))
    poly(d, wall_quad("R", t0, t1, h0, h0 + 9), hx("#e3f6f8"))
    poly(d, wall_quad("R", (t0 + t1) / 2 - 0.03, (t0 + t1) / 2 + 0.03, h0, h1), hx("#f7e7c6"))
    poly(d, wall_quad("R", t0, t1, (h0 + h1) / 2 - 1, (h0 + h1) / 2 + 1), hx("#f7e7c6"))
    for a, b in ((t0 - 0.35, t0 + 0.02), (t1 - 0.02, t1 + 0.35)):
        poly(d, wall_quad("R", a, b, h0 - 6, h1 + 4), hx("#d97a5c"))
        poly(d, wall_quad("R", a + 0.08, a + 0.14, h0 - 6, h1 + 4), hx("#b05646"))
        poly(d, wall_quad("R", a + 0.2, a + 0.26, h0 - 6, h1 + 4), hx("#b05646"))
    poly(d, wall_quad("R", t0 - 0.45, t1 + 0.45, h1 + 4, h1 + 6), hx("#82492f"))
    # wall sconce glow dots
    return img


def window_light(img):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for a, b in ((1.95, 2.85), (3.0, 3.85)):
        poly(d, [pf(a, 0.05), pf(b, 0.05), pf(b + 1.5, 3.0), pf(a + 1.5, 3.0)], (255, 244, 190, 52))
    msk = Image.new("L", img.size, 0)
    ImageDraw.Draw(msk).polygon([pf(0, 0), pf(W, 0), pf(W, D), pf(0, D)], fill=255)
    lay.putalpha(Image.fromarray(np.minimum(np.array(lay)[..., 3], np.array(msk))))
    img.alpha_composite(lay)


def shadows(img, feet):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for x0, z0, x1, z1 in feet:
        g = lambda x, z: pf(x / TILE, z / TILE)
        poly(d, [g(x0 - .03, z0 - .03), g(x1 + .06, z0 - .03), g(x1 + .06, z1 + .06), g(x0 - .03, z1 + .06)], (40, 20, 30, 70))
    img.alpha_composite(lay)


def glow(img, pts):
    lay = np.zeros((CH, CW, 4), np.float32)
    ys, xs = np.mgrid[0:CH, 0:CW]
    for (cx, cy, r) in pts:
        k = np.clip(1 - np.hypot(xs - cx, ys - cy) / r, 0, 1) ** 2
        k = np.round(k * 4) / 4  # banded like dithered pixel glow
        lay[..., 0] += 255 * k; lay[..., 1] += 220 * k; lay[..., 2] += 140 * k; lay[..., 3] += 90 * k
    lay = np.clip(lay, 0, 255).astype(np.uint8)
    lay[..., :3] = np.where(lay[..., 3:4] > 0, np.array([255, 224, 150], np.uint8), 0)
    img.alpha_composite(Image.fromarray(lay, "RGBA"))


def main():
    P, Dp, tone, ramp, obj, istop, feet = build_tris()
    zb, tb = rasterise(P, Dp)
    img = Image.new("RGBA", (CW, CH), (0, 0, 0, 255))
    draw_shell(img)
    window_light(img)
    shadows(img, feet)
    glow(img, [(*pf(6.5, 2.0, 40), 26), (*pf(0.4, 4.6, 30), 20)])
    img.alpha_composite(shade_props(tone, ramp, obj, istop, zb, tb))
    img = img.convert("RGB")
    img.save(OUT.replace(".png", "_native.png"))
    img.resize((CW * 3, CH * 3), Image.NEAREST).save(OUT)
    print("saved", OUT, CW, CH, "tris", len(P))


if __name__ == "__main__":
    main()
