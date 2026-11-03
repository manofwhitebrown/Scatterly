#!/usr/bin/env python3
"""UI kit generator (Art Bible section 9): wood nine-slice panels, 3-state buttons in 3 colourways, paper notebook page, item tray,
toggles, slider, progress bar, padlock, hand cursors. Writes PNGs plus pivots.json entries (with 'slice' for nine-slices).
Usage: ui.py <outdir>"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from dsl import PAL, col, build
def new(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))
def box(w, h, ramp, pressed=False, hover=False, corner=2):
    """Nine-slice 'wood' box: outline [0], bevel light top/left, shade bottom/right, face [2]; pressed inverts the bevel and drops the face."""
    im = new(w, h); px = im.load(); o = col(f'woodDark.0') if ramp == 'wood' else col(f'{ramp}.0')
    r = 'woodWarm' if ramp == 'wood' else ramp
    face, lt, sh = (col(f'{r}.3') if hover else col(f'{r}.2')), col(f'{r}.4'), col(f'{r}.1')
    if pressed: lt, sh = sh, lt
    for y in range(h):
        for x in range(w):
            cx = min(x, w - 1 - x) < corner and min(y, h - 1 - y) < corner and (min(x, w - 1 - x) + min(y, h - 1 - y)) < corner  # cut corners
            if cx: continue
            edge = x in (0, w - 1) or y in (0, h - 1)
            if edge: px[x, y] = o
            elif x == 1 or y == 1: px[x, y] = lt
            elif x == w - 2 or y == h - 2: px[x, y] = sh
            else: px[x, y] = face
    if not pressed:   # nails
        for nx, ny in ((3, 3), (w - 4, 3)):
            if ramp == 'wood': px[nx, ny] = col('butter.3')
    return im
def paper(w, h):
    im = new(w, h); px = im.load(); o = col('plaster.0')
    for y in range(h):
        for x in range(w):
            if min(x, w - 1 - x) + min(y, h - 1 - y) < 1: continue
            px[x, y] = o if x in (0, w - 1) or y in (0, h - 1) else col('plaster.3')
            if 1 <= x < w - 1 and 1 <= y < h - 1 and y % 6 == 5: px[x, y] = col('sky.4')           # ruled lines
            if x == 7 and 1 <= y < h - 1: px[x, y] = col('terracotta.3')                            # margin line
    for y in range(4, h - 3, 7): px[3, y] = col('stone.1'); px[4, y] = col('stone.2')               # spiral holes
    return im
def tray(w, h):
    im = box(w, h, 'woodDark'); px = im.load()
    for x in range(3, w - 3): px[x, h - 4] = col('woodDark.1'); px[x, h - 5] = col('woodDark.0')   # shelf lip
    return im
def toggle(on):
    im = new(20, 12); px = im.load()
    for y in range(12):
        for x in range(20):
            if min(x, 19 - x) + min(y, 11 - y) < 2: continue
            edge = x in (0, 19) or y in (0, 11)
            px[x, y] = col('stone.0') if edge else col('sage.2' if on else 'stone.2')
    kx = 11 if on else 2
    for y in range(2, 10):
        for x in range(kx, kx + 7): px[x, y] = col('paper') if (x in range(kx, kx + 7) and not (x in (kx, kx + 6) and y in (2, 9))) else col('stone.2')
    return im
def slider_track():
    im = new(24, 8); px = im.load()
    for x in range(24): px[x, 2] = col('woodDark.0'); px[x, 3] = col('woodDark.1'); px[x, 4] = col('woodDark.1'); px[x, 5] = col('woodDark.0')
    return im
def knob():
    im = new(10, 10); px = im.load()
    for y in range(10):
        for x in range(10):
            if min(x, 9 - x) + min(y, 9 - y) < 2: continue
            px[x, y] = col('woodDark.0') if x in (0, 9) or y in (0, 9) else (col('butter.4') if (x < 4 and y < 4) else col('butter.2'))
    return im
def progress(fill):
    im = new(24, 8); px = im.load()
    for y in range(8):
        for x in range(24):
            if min(x, 23 - x) + min(y, 7 - y) < 1: continue
            px[x, y] = col('woodDark.0') if x in (0, 23) or y in (0, 7) else (col('sage.3' if y < 4 else 'sage.2') if fill else col('woodDark.1'))
    return im
PAD = ["....llll....", "...l....l...", "...l....l...", "...l....l...", "..yyyyyyyy..", "..yYYYYYYy..", "..yYYiiYYy..", "..yYYiiYYy..", "..yYYYiYYy..", "..yyyyyyyy.."]
def padlock():
    return build(PAD, {'l': 'stone.2', 'y': 'butter.1', 'Y': 'butter.2', 'i': 'woodDark.0'})
HAND = [".....jj.....", ".....jwj....", ".....jwj....", ".....jwj.jj.", ".jj..jwjjwwj", "jwwj.jwwjwwj", "jwwjjjwwwwwj", ".jwwwwwwwwwj", "..jwwwwwwwj.", "..jwwwwwwwj.", "...jwwwwwj..", "...jjjjjjj.."]
HANDP = [r for r in HAND]
def cursor(pressed):
    rows = ["............", "............", "............", "...jj.jj....", "...jwjwjj...", "..jjwwwwwjj.", ".jwwwwwwwwwj", ".jwwwwwwwwwj", "..jwwwwwwwj.", "..jwwwwwwwj.", "...jwwwwwj..", "...jjjjjjj.."] if pressed else HAND
    return build(rows, {'j': 'woodDark.0', 'w': 'plaster.4'}, outline=False)
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); piv = {}
    def save(key, im, slice_=None, pivot=(0, 0)):
        im.save(os.path.join(out, key.replace('/', '__') + '.png')); piv[key] = {'pivot': list(pivot)}
        if slice_: piv[key]['slice'] = slice_
    save('ui/panel9', box(24, 24, 'wood'), [6, 6, 6, 6]); save('ui/panelDark9', box(24, 24, 'woodDark'), [6, 6, 6, 6])
    for cw, ramp in (('wood', 'wood'), ('sage', 'sage'), ('terracotta', 'terracotta')):
        for st, kw in (('up', {}), ('hover', {'hover': True}), ('pressed', {'pressed': True})):
            save(f'ui/btn_{cw}_{st}', box(24, 24, ramp, **kw), [6, 6, 6, 6])
    save('ui/paper9', paper(32, 40), [8, 8, 8, 8]); save('ui/tray9', tray(24, 24), [6, 6, 6, 6])
    save('ui/toggle_on', toggle(True)); save('ui/toggle_off', toggle(False)); save('ui/slider_track', slider_track(), [4, 0, 4, 0]); save('ui/slider_knob', knob())
    save('ui/progress_bg', progress(False), [4, 0, 4, 0]); save('ui/progress_fill', progress(True), [4, 0, 4, 0])
    save('ui/padlock', padlock(), pivot=(7, 12)); save('ui/cursor_point', cursor(False), pivot=(6, 3)); save('ui/cursor_press', cursor(True), pivot=(6, 3))
    json.dump(piv, open(os.path.join(out, 'pivots_ui.json'), 'w'), indent=0); print(len(piv), 'ui frames')
