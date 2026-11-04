#!/usr/bin/env python3
"""Room contact sheet without a browser: composites each room's shell + mounts + props from the packed atlases (public/atlas) using the same
projection and anchoring rules as src/scenes/homeProps.ts (UNIT 6, ground-anchored at the footprint centre, only rot 1 mirrored).
Usage: sheet.py <layout.json from export.ts> <out.png> [scale]; prints frames that are missing (those would be boxes in the game)."""
import json, os, sys
from PIL import Image, ImageDraw
ROOT = os.path.join(os.path.dirname(__file__), '..', '..'); ATL = os.path.join(ROOT, 'public', 'atlas'); UNIT = 6; ROOMS = ['entrance', 'living', 'kitchen', 'bathroom', 'bedroom', 'study']
def load_atlases(names):
    fr = {}
    for n in names:
        p = os.path.join(ATL, n + '.json')
        if not os.path.exists(p): continue
        j = json.load(open(p)); img = Image.open(os.path.join(ATL, j['meta']['image'])).convert('RGBA')
        for k, v in j['frames'].items():
            f = v['frame']; fr[k] = (img.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), (v['pivot']['x'], v['pivot']['y']))
    return fr
def render(room, lay, fr, missing):
    shell, (px0, py0) = fr[f'shell/{room}/full']; W, H = shell.size
    im = Image.new('RGBA', (W + 80, H + 40), (0, 0, 0, 0)); ox, oy = px0 + 40, py0 + 40; im.alpha_composite(shell, (40, 40))
    P = lambda gx, gy, z=0: (round(ox + (gx - gy) * 16), round(oy + (gx + gy) * 8 - z))
    def put(key, at, flip=False):
        if key not in fr: missing.add(key); return False
        s, (pvx, pvy) = fr[key]
        if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT); pvx = s.width - pvx
        im.alpha_composite(s, (at[0] - pvx, at[1] - pvy)); return True
    for w in lay['windows']:
        t0 = w['t']
        put('fx/windowGlow/' + ('0' if w['wall'] == 'R' else '1'), P(t0, 0, 3 * UNIT) if w['wall'] == 'R' else P(0, t0, 3 * UNIT))
    for kind, wall, t, base in lay['mounts']:
        k = f'prop/{kind}' + ('' if wall == 'R' else '_L')
        if wall == 'L' and k not in fr and f'prop/{kind}' in fr: put(f'prop/{kind}', P(0, t, base * UNIT), flip=True); continue   # 3D (Kenney) mounts have no _L: mirrored
        put(k, P(t, 0, base * UNIT) if wall == 'R' else P(0, t, base * UNIT))
    top = {p['id']: p['h'] for p in lay['props']}
    for p in sorted(lay['props'], key=lambda p: p['gx'] + p['gy'] + (0.5 if p.get('onTop') else 0)):
        z0 = top.get(p.get('onTop'), 0) * UNIT if p.get('onTop') else 0
        put(f"prop/{p['kind']}", P(p['gx'] + p['w'] / 2, p['gy'] + p['d'] / 2, z0), flip=p['rot'] == 1)
    return im
if __name__ == '__main__':
    lay = json.load(open(sys.argv[1])); out = sys.argv[2]; sc = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    names = ['room-slice', 'house'] + [f'room-{r}' for r in ROOMS]; fr = load_atlases(names); missing = set(); ims = []
    for r in ROOMS: ims.append((r, render(r, lay[r], fr, missing)))
    cw, ch = max(i.width for _, i in ims), max(i.height for _, i in ims)
    sheet = Image.new('RGB', (cw * 3 * sc, (ch + 14) * 2 * sc), (42, 32, 48)); d = ImageDraw.Draw(sheet)
    for n, (r, im) in enumerate(ims):
        b = im.resize((im.width * sc, im.height * sc), Image.NEAREST); x, y = (n % 3) * cw * sc, (n // 3) * (ch + 14) * sc
        sheet.paste(b, (x, y + 14 * sc), b); d.text((x + 6, y + 4), f"{r} ({len(lay[r]['props'])} props, {len(lay[r]['mounts'])} mounts)", fill=(255, 243, 220))
    sheet.save(out); print('sheet', sheet.size, 'missing frames:', sorted(missing) or 'none')
