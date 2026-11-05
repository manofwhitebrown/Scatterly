#!/usr/bin/env python3
"""Draws the Scatterly app icon (a pixel-art cutaway house on teal) and writes Android launcher icons into <android res dir>.
Usage: make-icon.py <res_dir> [preview.png]. Pillow only; nothing downloaded. Used by .github/workflows/android.yml."""
import os, sys
from PIL import Image

TEAL = (0x1f, 0x3a, 0x40, 255)
G = 32  # art grid

def house():
    """32x32 art on transparent: roof, two lit rooms, door, a cat shape on the porch."""
    im = Image.new('RGBA', (G, G), (0, 0, 0, 0))
    px = im.load()
    def rect(x0, y0, x1, y1, c):
        for y in range(y0, y1):
            for x in range(x0, x1): px[x, y] = c
    roof, roof2 = (0xd9, 0x6b, 0x4a, 255), (0xb5, 0x50, 0x38, 255)
    wall, wall2 = (0xf6, 0xe7, 0xcf, 255), (0xe8, 0xcf, 0xa6, 255)
    glow, dark = (0xf5, 0xb8, 0x4a, 255), (0x2b, 0x22, 0x30, 255)
    for i in range(9):  # roof triangle
        rect(16 - 2 - i * 1 - 5, 4 + i, 16 + 2 + i * 1 + 5, 5 + i, roof if i % 2 == 0 else roof2)
    rect(5, 13, 27, 26, wall)
    rect(5, 24, 27, 26, wall2)
    rect(7, 15, 13, 21, glow)   # left room window glow
    rect(19, 15, 25, 21, glow)  # right room
    rect(7, 18, 13, 19, (0xe0, 0x95, 0x5a, 255)); rect(19, 18, 25, 19, (0xe0, 0x95, 0x5a, 255))
    rect(14, 17, 18, 26, (0x8a, 0x5a, 0x3c, 255))  # door
    rect(17, 21, 18, 22, glow)
    rect(3, 26, 29, 28, (0x6f, 0xa8, 0x5a, 255))  # lawn
    rect(23, 24, 26, 26, dark); rect(23, 23, 24, 24, dark); rect(25, 23, 26, 24, dark)  # cat silhouette
    return im

def save(img, path, size):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.NEAREST).save(path)

def main():
    res = sys.argv[1]
    art = house()
    legacy = Image.new('RGBA', (G, G), TEAL)
    legacy.alpha_composite(art)
    dens = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for d, s in dens.items():
        for name in ('ic_launcher.png', 'ic_launcher_round.png'):
            save(legacy, f'{res}/mipmap-{d}/{name}', s)
        # adaptive foreground: 108 dp canvas, art inside the 66 dp safe zone (about 61%)
        fg = Image.new('RGBA', (54, 54), (0, 0, 0, 0))
        fg.alpha_composite(art, (11, 11))  # 32 art px centred on a 54 grid
        save(fg, f'{res}/mipmap-{d}/ic_launcher_foreground.png', int(s * 108 / 48))
    bg = f'{res}/values/ic_launcher_background.xml'
    os.makedirs(os.path.dirname(bg), exist_ok=True)
    open(bg, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1F3A40</color>\n</resources>\n')
    if len(sys.argv) > 2:
        legacy.resize((256, 256), Image.NEAREST).save(sys.argv[2])
    print('icons written to', res)

main()
