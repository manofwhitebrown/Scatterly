/** URL feature flags. Pure: takes the query string so it can be tested without a browser. */
export interface Flags { iso: boolean; legacy: boolean; home: boolean; artdebug: boolean; debug: boolean; e2e: boolean }

export function parseFlags(search: string): Flags {
  const q = new URLSearchParams(search);
  const view = q.get('view');
  return {
    iso: view === 'iso',
    legacy: view === 'legacy',
    home: view !== 'legacy' && view !== 'iso', // the house is the default; `?view=legacy` / `?view=iso` keep the old screens until Gate B
    artdebug: q.get('artdebug') === '1',
    debug: q.get('debug') === '1',
    e2e: q.get('e2e') === '1',
  };
}

let cached: Flags | null = null;

/** Flags of the current page, parsed once. Home is the default view. */
export function flags(): Flags {
  if (!cached) cached = parseFlags(typeof window === 'undefined' ? '' : window.location.search);
  return cached;
}

/** The scene Boot hands over to. Every URL boots the house except `?view=legacy` and `?view=iso`, which keep the old Menu until Gate B. */
export function firstScene(f: Flags): 'Home' | 'Menu' {
  return f.home ? 'Home' : 'Menu';
}
