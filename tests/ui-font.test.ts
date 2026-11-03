import { describe, expect, it } from 'vitest';
import { PIXEL_FONT, pixelFontReady } from '../src/ui/pixelFont';

describe('pixel font', () => {
  it('puts Silkscreen first with a system fallback and never rejects without a DOM', async () => {
    expect(PIXEL_FONT.startsWith('Silkscreen,')).toBe(true);
    expect(PIXEL_FONT).toContain('sans-serif');
    await expect(pixelFontReady).resolves.toBeDefined();
  });
});
