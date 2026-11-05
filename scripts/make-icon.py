#!/usr/bin/env python3
"""Draws the Scatterly icon: a tiny isometric cutaway house (two lit rooms, a cat, a plant) in the game's own pixel style.
  make-icon.py android <res_dir> [preview.png]   Android launcher icons (adaptive + legacy), used by .github/workflows/android.yml
  make-icon.py web <public_dir>                  favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
Pillow only; nothing downloaded."""
import os, sys
from PIL import Image, ImageDraw

def C(h, a=255): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (a,)

OUT = C('#2b2230')
FLOOR, FLOOR2 = C('#e0955a'), C('#c97d45')
WALL_L, WALL_L2 = C('#f6e7cf'), C('#efc7a0')      # cream and peach stripes
WALL_R, WALL_R2 = C('#9fc4d8'), C('#7fa9c4')      # blue stripes
GLOW, GLOW2 = C('#ffd873'), C('#f5b84a')
DOOR, DOOR2 = C('#8a5a3c'), C('#6a4128')
CAT, CAT2 = C('#f08a3c'), C('#c8671f')
LEAF, LEAF2, POT = C('#6fa85a'), C('#4d8a45'), C('#b5503a')

def draw_house(im, ox, oy):
    """Isometric cutaway on a 64-grid placed at (ox, oy). Pure pixel polygons, no anti-aliasing."""
    d = ImageDraw.Draw(im)
    P = lambda x, y: (ox + x, oy + y)
    H = 22
    top, right, bottom, left = (32, 32), (58, 45), (32, 58), (6, 45)
    def wall_l(u, v): return P(6 + 26 * u, 45 - 13 * u - H * v)
    def wall_r(u, v): return P(32 + 26 * u, 32 + 13 * u - H * v)
    def floor_pt(u, w): return P(32 + 26 * (u - w), 32 + 13 * (u + w))
    # floor
    d.polygon([P(*top), P(*right), P(*bottom), P(*left)], fill=FLOOR, outline=OUT)
    for k in range(1, 8):  # plank lines
        t = k / 8
        d.line([floor_pt(t, 0), floor_pt(t, 1)], fill=FLOOR2)
    # walls with stripes
    d.polygon([wall_l(0, 0), wall_l(1, 0), wall_l(1, 1), wall_l(0, 1)], fill=WALL_L, outline=OUT)
    d.polygon([wall_r(0, 0), wall_r(1, 0), wall_r(1, 1), wall_r(0, 1)], fill=WALL_R, outline=OUT)
    for k in range(1, 9, 2):
        a = k / 9
        d.polygon([wall_l(a, 0.1), wall_l(a + 0.055, 0.1), wall_l(a + 0.055, 1), wall_l(a, 1)], fill=WALL_L2)
        d.polygon([wall_r(a, 0.1), wall_r(a + 0.055, 0.1), wall_r(a + 0.055, 1), wall_r(a, 1)], fill=WALL_R2)
    d.polygon([wall_l(0, 0.08), wall_l(1, 0.08), wall_l(1, 0.0), wall_l(0, 0.0)], fill=C('#c9654a'))  # skirting, left
    d.polygon([wall_r(0, 0.08), wall_r(1, 0.08), wall_r(1, 0.0), wall_r(0, 0.0)], fill=C('#4f7f9a'))  # skirting, right
    # re-outline walls on top of stripes
    for poly in ([wall_l(0, 0), wall_l(1, 0), wall_l(1, 1), wall_l(0, 1)], [wall_r(0, 0), wall_r(1, 0), wall_r(1, 1), wall_r(0, 1)]):
        d.line(poly + [poly[0]], fill=OUT)
    # lit window left, lit door right
    d.polygon([wall_l(.28, .42), wall_l(.7, .42), wall_l(.7, .86), wall_l(.28, .86)], fill=GLOW, outline=OUT)
    d.line([wall_l(.28, .64), wall_l(.7, .64)], fill=GLOW2)
    d.line([wall_l(.49, .42), wall_l(.49, .86)], fill=GLOW2)
    d.polygon([wall_r(.5, 0.08), wall_r(.8, 0.08), wall_r(.8, .66), wall_r(.5, .66)], fill=DOOR, outline=OUT)
    d.polygon([wall_r(.56, .1), wall_r(.74, .1), wall_r(.74, .6), wall_r(.56, .6)], fill=DOOR2)
    px = wall_r(.72, .32); d.point(px, fill=GLOW)
    # plant (left corner) and cat (front)
    x, y = floor_pt(0.14, 0.56)
    d.rectangle([x - 2, y - 3, x + 2, y], fill=POT, outline=OUT)
    d.polygon([(x, y - 11), (x - 5, y - 4), (x + 5, y - 4)], fill=LEAF, outline=OUT)
    d.line([(x, y - 9), (x, y - 4)], fill=LEAF2)
    x, y = floor_pt(0.62, 0.52)
    d.rectangle([x - 4, y - 4, x + 3, y], fill=CAT, outline=OUT)
    d.rectangle([x + 1, y - 8, x + 5, y - 4], fill=CAT, outline=OUT)
    d.point((x + 1, y - 9), fill=OUT); d.point((x + 5, y - 9), fill=OUT)
    d.point((x + 2, y - 6), fill=OUT)
    d.line([(x - 5, y - 2), (x - 8, y - 6)], fill=CAT2)
    d.line([(x - 3, y - 2), (x + 2, y - 2)], fill=CAT2)

def background(n):
    im = Image.new('RGBA', (n, n))
    px = im.load()
    for y in range(n):
        t = y / (n - 1)
        c = tuple(int(a + (b - a) * t) for a, b in zip(C('#2f5a62')[:3], C('#1a3036')[:3])) + (255,)
        for x in range(n): px[x, y] = c
    d = ImageDraw.Draw(im)
    for (x, y) in ((6, 6), (54, 9), (10, 22), (58, 28), (46, 4)):  # a few warm "dust" pixels
        if x < n and y < n: d.point((x, y), fill=C('#f6e7cf', 160))
    return im

def art(grid, off):
    im = Image.new('RGBA', (grid, grid), (0, 0, 0, 0))
    draw_house(im, off, off)
    return im

def up(img, size): return img.resize((size, size), Image.NEAREST)
def save(img, path):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True); img.save(path)

def android(res, preview):
    full = background(64); full.alpha_composite(art(64, 0))
    for d, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
        for name in ('ic_launcher.png', 'ic_launcher_round.png'): save(up(full, s), f'{res}/mipmap-{d}/{name}')
        fg = art(108, 22)  # 64-grid house centred on a 108 grid: stays inside the 66 dp safe zone
        save(up(fg, int(s * 108 / 48)), f'{res}/mipmap-{d}/ic_launcher_foreground.png')
    bg = f'{res}/values/ic_launcher_background.xml'
    os.makedirs(os.path.dirname(bg), exist_ok=True)
    open(bg, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#244850</color>\n</resources>\n')
    if preview: up(full, 256).save(preview)

def web(pub):
    full = background(64); full.alpha_composite(art(64, 0))
    save(up(full, 512), f'{pub}/icon-512.png'); save(up(full, 192), f'{pub}/icon-192.png'); save(up(full, 180), f'{pub}/apple-touch-icon.png')
    # favicon: crop to the house (drop the empty margin) so it stays readable at 16 px
    crop = Image.new('RGBA', (64, 64)); crop.alpha_composite(background(64)); crop.alpha_composite(art(64, 0))
    house = crop.crop((4, 8, 60, 64)).resize((56, 56), Image.NEAREST)
    f32 = house.resize((32, 32), Image.BOX); f16 = house.resize((16, 16), Image.BOX); f48 = house.resize((48, 48), Image.BOX)
    save(f32, f'{pub}/favicon-32.png')
    f48.save(f'{pub}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[f16, f32])

if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'android': android(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    elif mode == 'web': web(sys.argv[2])
    else: sys.exit('usage: make-icon.py android <res> [preview] | web <public>')
    print('done', mode)
