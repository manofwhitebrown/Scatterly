import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const xml = readFileSync('assets/fonts/pixelify12.fnt', 'utf8');
const num = (tag: string, attr: string): number => Number(new RegExp(`<${tag}[^>]* ${attr}="(\\d+)"`).exec(xml)?.[1]);

describe('bitmap font', () => {
  it('has every printable ASCII glyph inside the atlas', () => {
    const w = num('common', 'scaleW'), h = num('common', 'scaleH');
    for (let c = 32; c < 127; c++) {
      const m = new RegExp(`<char id="${c}" x="(\\d+)" y="(\\d+)" width="(\\d+)" height="(\\d+)"`).exec(xml);
      expect(m, `glyph ${c}`).not.toBeNull();
      const [x, y, gw, gh] = [m![1], m![2], m![3], m![4]].map(Number);
      expect(x + gw).toBeLessThanOrEqual(w); expect(y + gh).toBeLessThanOrEqual(h);
    }
  });
  it('H is 8 art px tall (24 game px at scale 3), the Art Bible body size', () => {
    const m = /<char id="72" [^>]*height="(\d+)"/.exec(xml);
    expect(Number(m![1])).toBe(8);
  });
  it('ships its OFL licence next to the font', () => {
    expect(readFileSync('assets/fonts/OFL-PixelifySans.txt', 'utf8')).toContain('SIL OPEN FONT LICENSE');
  });
});
