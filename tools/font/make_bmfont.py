#!/usr/bin/env python3
"""OFL pixel font -> Phaser bitmap font (BMFont XML + 1-bit white PNG; tint at runtime). Pixelify Sans (SIL OFL 1.1) at size 12 gives an
8 art px cap height (Art Bible: body text). Usage: make_bmfont.py <ttf> <out base> [size]. Output is native art px; draw it at scale 3."""
import sys
from PIL import Image, ImageDraw, ImageFont
ttf, base = sys.argv[1], sys.argv[2]; size = int(sys.argv[3]) if len(sys.argv) > 3 else 12
f = ImageFont.truetype(ttf, size); asc, desc = f.getmetrics(); line = asc + desc
chars = [chr(c) for c in range(32, 127)] + list('äöüéèñ¿¡…’“”–—·')
W = 128; x = y = 1; rowh = 0; glyphs = []; sheet = Image.new('L', (W, 256), 0)
for ch in chars:
    adv = int(round(f.getlength(ch)))
    bb = f.getbbox(ch) if ch != ' ' else (0, 0, 0, 0)
    gw, gh = max(0, bb[2] - bb[0]), max(0, bb[3] - bb[1])
    if x + gw + 1 > W: x, y, rowh = 1, y + rowh + 1, 0
    if gw and gh:
        im = Image.new('1', (gw, gh), 0); d = ImageDraw.Draw(im); d.fontmode = '1'; d.text((-bb[0], -bb[1]), ch, font=f, fill=1)
        sheet.paste(im.convert('L').point(lambda v: 255 if v else 0), (x, y))
    glyphs.append((ord(ch), x, y, gw, gh, bb[0], bb[1], max(adv, gw + bb[0] + 1) if ch != ' ' else max(adv, 3)))
    x += gw + 1; rowh = max(rowh, gh)
H = 1
while H < y + rowh + 1: H *= 2
sheet = sheet.crop((0, 0, W, H)); rgba = Image.new('RGBA', (W, H), (255, 255, 255, 0))
rgba.putalpha(sheet); rgba.save(base + '.png')
cap = f.getbbox('H'); capH = cap[3] - cap[1]
xml = [f'<font><info face="PixelifySans" size="{size}" bold="0" italic="0"/>', f'<common lineHeight="{line}" base="{asc}" scaleW="{W}" scaleH="{H}" pages="1"/>',
       f'<pages><page id="0" file="{base.split("/")[-1]}.png"/></pages>', f'<chars count="{len(glyphs)}">']
for (i, gx, gy, gw, gh, xo, yo, adv) in glyphs:
    xml.append(f'<char id="{i}" x="{gx}" y="{gy}" width="{gw}" height="{gh}" xoffset="{xo}" yoffset="{yo}" xadvance="{adv}" page="0" chnl="15"/>')
xml += ['</chars>', '</font>']; open(base + '.fnt', 'w').write('\n'.join(xml) + '\n')
print(len(glyphs), 'glyphs', W, H, 'cap', capH, 'line', line)
