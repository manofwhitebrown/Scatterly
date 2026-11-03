/** URL feature flags. Pure: takes the query string so it can be tested without a browser. */
export interface Flags { iso: boolean; home: boolean; artdebug: boolean; debug: boolean; e2e: boolean }

export function parseFlags(search: string): Flags {
  const q = new URLSearchParams(search);
  return {
    iso: q.get('view') === 'iso',
    home: q.get('view') === 'home',
    artdebug: q.get('artdebug') === '1',
    debug: q.get('debug') === '1',
    e2e: q.get('e2e') === '1',
  };
}

let cached: Flags | null = null;

/** Flags of the current page, parsed once. The default view stays the old flat Room until Parity. */
export function flags(): Flags {
  if (!cached) cached = parseFlags(typeof window === 'undefined' ? '' : window.location.search);
  return cached;
}

/** The scene Boot hands over to. `?view=home` boots the new house directly; every other URL keeps the old Menu until Gate B. */
export function firstScene(f: Flags): 'Home' | 'Menu' {
  return f.home ? 'Home' : 'Menu';
}
