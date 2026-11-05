import { duckMusic, getCtx, getSampleBus, isRunning } from './engine';
import { getBuffer, loadGroup, loadedVariants } from './bank';
import { pickVariant, playbackRate } from './logic';
import { DUCKS, UI_NAMES, groupOf, sfxFile } from './manifest';
import type { VoiceBook } from './voices';

const last = new Map<string, number>();

/**
 * Plays one variant of a recorded-style sound. Returns false when it is not loaded yet (the caller then plays the synthesised
 * sound) and starts loading its group so the next call can use the file. Never throws.
 */
export function playSample(name: string, step: number, voices: VoiceBook): boolean {
  const group = groupOf(name);
  if (!group) return false;
  const c = getCtx();
  if (!c || !isRunning()) return false;
  const have = loadedVariants(name);
  if (have.length === 0) {
    void loadGroup(group);
    return false;
  }
  try {
    const v = have[pickVariant(have.length, last.get(name) === undefined ? undefined : have.indexOf(last.get(name) as number) + 1) - 1];
    last.set(name, v);
    const buf = getBuffer(sfxFile(name, v));
    const out = getSampleBus(UI_NAMES.has(name) ? 'ui' : 'sfx');
    if (!buf || !out) return false;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = playbackRate(step);
    src.connect(out);
    const now = c.currentTime;
    src.start(now);
    voices.add(now, now + buf.duration / src.playbackRate.value, () => {
      try {
        src.stop();
      } catch {
        /* already ended */
      }
    });
    const hold = DUCKS[name];
    if (hold !== undefined) duckMusic(hold);
    return true;
  } catch {
    return false;
  }
}
