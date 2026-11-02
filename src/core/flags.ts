/** URL feature flags. Pure: takes the query string so it can be tested without a browser. */
export interface Flags { iso: boolean; debug: boolean; e2e: boolean }

export function parseFlags(search: string): Flags {
  const q = new URLSearchParams(search);
  return { iso: q.get('view') === 'iso', debug: q.get('debug') === '1', e2e: q.get('e2e') === '1' };
}

let cached: Flags | null = null;

/** Flags of the current page, parsed once. The default view stays the old flat Room until Parity. */
export function flags(): Flags {
  if (!cached) cached = parseFlags(typeof window === 'undefined' ? '' : window.location.search);
  return cached;
}
