#!/usr/bin/env python3
"""Adds U+2713 (check) and U+2715 (cross) to the Silkscreen woff files, drawn on its 125-unit pixel grid (5x5 px, advance 7 px),
because the game's text uses both and Silkscreen lacks them (they fell back to the system font). OFL 1.1 allows modified versions
(no Reserved Font Name is declared in OFL-Silkscreen.txt). Usage: add_marks.py public/fonts   (idempotent)"""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
U = 125
GLYPHS = {0x2713: ('checkmark', ["....X", "...X.", "X.X..", ".X...", "....."]),
          0x2715: ('multiply', ["X...X", ".X.X.", "..X..", ".X.X.", "X...X"])}
def add(path):
    f = TTFont(path); order = f.getGlyphOrder()
    for cp, (name, rows) in GLYPHS.items():
        pen = TTGlyphPen(None)
        for r, row in enumerate(rows):
            for c, ch in enumerate(row):
                if ch != 'X': continue
                x0, y0 = U + c * U, (4 - r) * U; x1, y1 = x0 + U, y0 + U
                pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
        if name not in order: order.append(name)
        f['glyf'].glyphs[name] = pen.glyph(); f['hmtx'].metrics[name] = (7 * U, U)
        for t in f['cmap'].tables:
            if t.isUnicode(): t.cmap[cp] = name
    f.setGlyphOrder(order); f['glyf'].glyphOrder = order; f['maxp'].numGlyphs = len(order)
    f.flavor = 'woff'; f.save(path)
if __name__ == '__main__':
    for w in ('400', '700'): add(os.path.join(sys.argv[1], f'silkscreen-{w}.woff'))
    print('marks added')
