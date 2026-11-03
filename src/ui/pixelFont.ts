/**
 * Pixel font (Silkscreen, SIL OFL 1.1, see docs/art/LICENSES.md). Loaded at import time through the FontFace API so
 * the first Text objects usually already have it; if loading fails the stack falls back to the system font.
 * `?font=system` switches back to the system font (escape hatch while the look is under review).
 */
const FALLBACK = 'system-ui, "Segoe UI", Roboto, sans-serif';
const usePixel = typeof location === 'undefined' || new URLSearchParams(location.search).get('font') !== 'system';

export const PIXEL_FONT = usePixel ? `Silkscreen, ${FALLBACK}` : FALLBACK;

function load(weight: '400' | '700'): Promise<unknown> {
  if (!usePixel || typeof FontFace === 'undefined' || typeof document === 'undefined') return Promise.resolve();
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  const face = new FontFace('Silkscreen', `url(${base}fonts/silkscreen-${weight}.woff)`, { weight, style: 'normal' });
  return face.load().then((f) => { document.fonts.add(f); }).catch(() => undefined);
}

/** Resolves when both weights are ready (or failed: the fallback stack then applies). */
export const pixelFontReady: Promise<unknown> = Promise.all([load('400'), load('700')]);
