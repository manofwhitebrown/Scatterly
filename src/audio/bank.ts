/** Lazy loader for the OGG files: fetch + decode once, cache, never throw. A missing or undecodable file simply stays absent
 *  and callers fall back to the synthesised sound. Loads run at most 3 at a time so a phone's network is not flooded. */
import { getCtx } from './engine';
import { SFX_GROUPS, VARIANTS, sfxFile } from './manifest';
import type { SoundGroup } from './manifest';

const BASE = (import.meta.env.BASE_URL as string | undefined) ?? '/';
const MAX_PARALLEL = 3;

const buffers = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer | null>>();
const failed = new Set<string>();
const queue: Array<() => void> = [];
let active = 0;

export const audioUrl = (file: string): string => `${BASE}audio/${file}.ogg`;
export const getBuffer = (file: string): AudioBuffer | null => buffers.get(file) ?? null;
export const hasBuffer = (file: string): boolean => buffers.has(file);

function slot<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = (): void => {
      active++;
      job().then(resolve, reject).finally(() => {
        active--;
        queue.shift()?.();
      });
    };
    if (active < MAX_PARALLEL) run();
    else queue.push(run);
  });
}

export function loadFile(file: string): Promise<AudioBuffer | null> {
  const have = buffers.get(file);
  if (have) return Promise.resolve(have);
  if (failed.has(file)) return Promise.resolve(null);
  const going = inflight.get(file);
  if (going) return going;
  const p = slot(async () => {
    const c = getCtx();
    if (!c) return null; // no context yet (before the first tap): try again later, do not mark as failed
    try {
      const res = await fetch(audioUrl(file));
      if (!res.ok) throw new Error(String(res.status));
      const buf = await c.decodeAudioData(await res.arrayBuffer());
      buffers.set(file, buf);
      return buf;
    } catch {
      failed.add(file);
      return null;
    }
  }).finally(() => inflight.delete(file));
  inflight.set(file, p);
  return p;
}

const groupDone = new Map<SoundGroup, Promise<void>>();

/** Loads every variant of every sound in a group. Resolves when done; never rejects. */
export function loadGroup(group: SoundGroup): Promise<void> {
  const known = groupDone.get(group);
  if (known) return known;
  if (!getCtx()) return Promise.resolve();
  const jobs: Array<Promise<AudioBuffer | null>> = [];
  for (const name of SFX_GROUPS[group]) for (let v = 1; v <= VARIANTS; v++) jobs.push(loadFile(sfxFile(name, v)));
  const p = Promise.all(jobs).then(() => undefined);
  groupDone.set(group, p);
  return p;
}

/** Variants of `name` that are loaded right now (1-based numbers). */
export function loadedVariants(name: string): number[] {
  const out: number[] = [];
  for (let v = 1; v <= VARIANTS; v++) if (buffers.has(sfxFile(name, v))) out.push(v);
  return out;
}

/** How many files are decoded right now (test probe). */
export const loadedCount = (): number => buffers.size;
export const failedFiles = (): string[] => [...failed];
