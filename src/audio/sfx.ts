import { envelope, getCtx, getSfxBus, isRunning, noiseBuffer, resumeCtx, setVolumes, suspendCtx } from './engine';
import { ambienceRoom, setAmbience, syncAmbience } from './ambience';
import { musicIntensity, playResultMoment, runMusic, setMusicIntensity, setMusicTrack, stopMusic } from './music';
import { loadGroup } from './bank';
import { playSample } from './samples';
import type { MusicTrack, SoundGroup } from './manifest';
import { RECIPES, SUCCESS_VARIANTS } from './recipes';
import type { Recipe, SfxName } from './recipes';
import { VOICE_BUDGET, VoiceBook } from './voices';

export type { SfxName } from './recipes';
export type { MusicTrack, SoundGroup } from './manifest';

/** Any sound by name: the synthesised base set, or any of the recorded-style names in `src/audio/manifest.ts` (SFX_GROUPS). */
export type SoundName = SfxName | (string & {});

export interface PlayOpts { step?: number }

export interface SfxApi {
  unlock(): void;
  play(name: SoundName, opts?: PlayOpts): void;
  /** Switch the background loop (crossfade). Applies now if music runs, otherwise when it starts. */
  setTrack(track: MusicTrack): void;
  /** The win moment: 6 s sting over a ducked bed, then the calm result bed. */
  resultMoment(): void;
  /** Start downloading a group of sounds ahead of need (idle time). */
  preload(group: SoundGroup): void;
  setIntensity(level: number): void;
  setRoomAmbience(room: string | null): void;
  setEnabled(sfx: boolean, music: boolean): void;
  setVolumes(v: { music: number; sfx: number; ambience: number }): void;
  startMusic(): void;
  stopMusic(): void;
}

const MIN_GAP = 0.04;

let sfxOn = true;
let musicOn = true;
let musicWanted = false;
let hooked = false;
const voices = new VoiceBook(VOICE_BUDGET.sfx);
const lastPlayed: Partial<Record<SfxName, number>> = {};

function play(name: SoundName, opts?: PlayOpts): void {
  if (!sfxOn) return;
  const c = getCtx();
  const out = getSfxBus();
  if (!c || !out || !isRunning()) return;
  try {
    const now0 = c.currentTime;
    const lastS = lastPlayed[name as SfxName];
    if (lastS !== undefined && now0 - lastS < MIN_GAP) return;
    if (playSample(name, opts?.step ?? 0, voices)) {
      lastPlayed[name as SfxName] = now0;
      return;
    }
    if (!(name in RECIPES)) return; // a recorded-only name that is not loaded yet: silent this once, loaded for next time
    const now = c.currentTime;
    lastPlayed[name as SfxName] = now;
    const r: Recipe = name === 'success' ? SUCCESS_VARIANTS[Math.floor(Math.random() * SUCCESS_VARIANTS.length)] : RECIPES[name as SfxName];
    const stepUp = Math.pow(2, Math.min(12, Math.max(0, Math.floor(opts?.step ?? 0))) / 12);
    const jitter = (1 + (Math.random() - 0.5) * 0.06) * stepUp;
    const gains: GainNode[] = [];
    const stops: Array<() => void> = [];
    let end = now;
    for (const b of r.blips) {
      const t = now + (b.at ?? 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = b.type ?? 'sine';
      osc.frequency.setValueAtTime(b.f * jitter, t);
      if (b.to) osc.frequency.exponentialRampToValueAtTime(b.to * jitter, t + b.d);
      envelope(g, t, b.d, b.g ?? 1);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + b.d + 0.02);
      gains.push(g);
      stops.push(() => osc.stop());
      end = Math.max(end, t + b.d + 0.02);
    }
    if (r.noise) {
      const n = r.noise;
      const t = now + n.at;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(n.lo, t);
      f.frequency.exponentialRampToValueAtTime(n.hi, t + n.d);
      f.Q.value = 0.9;
      const g = c.createGain();
      envelope(g, t, n.d, n.g, 0.01);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 0.1);
      src.stop(t + n.d + 0.02);
      gains.push(g);
      stops.push(() => src.stop());
      end = Math.max(end, t + n.d + 0.02);
    }
    voices.add(now, end, () => {
      for (const g of gains) g.gain.setTargetAtTime(0, c.currentTime, 0.005);
      for (const s of stops) {
        try {
          s();
        } catch {
          /* already ended */
        }
      }
    });
  } catch {
    /* audio must never break gameplay */
  }
}

/** Mute when hidden, resume when visible again. */
function hookVisibility(): void {
  if (hooked) return;
  hooked = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopMusic();
      syncAmbience(false);
      suspendCtx();
    } else {
      resumeCtx();
      syncAmbience(sfxOn);
      if (musicWanted) runMusic(musicOn);
    }
  });
}

export const sfx: SfxApi = {
  unlock(): void {
    try {
      const c = getCtx();
      hookVisibility();
      resumeCtx();
      if (c) {
        syncAmbience(sfxOn);
        if (musicWanted) runMusic(musicOn);
        void loadGroup('core'); // the interface sounds; the rest load when first needed
      }
    } catch {
      /* ignore */
    }
  },
  play,
  setIntensity(level: number): void {
    setMusicIntensity(level);
  },
  setRoomAmbience(room: string | null): void {
    try {
      setAmbience(room, sfxOn);
    } catch {
      /* ignore */
    }
  },
  setEnabled(sfxEnabled: boolean, musicEnabled: boolean): void {
    sfxOn = sfxEnabled;
    musicOn = musicEnabled;
    syncAmbience(sfxOn);
    if (!musicOn) stopMusic();
    else if (musicWanted) runMusic(true);
  },
  setVolumes,
  setTrack(track: MusicTrack): void {
    setMusicTrack(track);
  },
  resultMoment(): void {
    if (musicOn) playResultMoment();
  },
  preload(group: SoundGroup): void {
    void loadGroup(group);
  },
  startMusic(): void {
    musicWanted = true;
    if (!musicOn || !getCtx()) return;
    hookVisibility();
    runMusic(true);
  },
  stopMusic(): void {
    musicWanted = false;
    stopMusic();
  },
};

export function audioDebug(): { intensity: number; ambience: string | null } {
  return { intensity: musicIntensity(), ambience: ambienceRoom() };
}
