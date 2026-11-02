/** Tracks sfx voices and recycles the oldest when the cap is reached. Pure logic, no AudioContext. */
export class VoiceBook {
  private readonly voices: Array<{ end: number; kill: () => void }> = [];

  constructor(private readonly cap: number) {}

  /** Registers a voice; returns how many older voices were stolen to make room. */
  add(now: number, end: number, kill: () => void): number {
    this.prune(now);
    let stolen = 0;
    while (this.voices.length >= this.cap) {
      const v = this.voices.shift();
      if (!v) break;
      try {
        v.kill();
      } catch {
        /* already stopped */
      }
      stolen++;
    }
    this.voices.push({ end, kill });
    return stolen;
  }

  count(now: number): number {
    this.prune(now);
    return this.voices.length;
  }

  private prune(now: number): void {
    for (let i = this.voices.length - 1; i >= 0; i--) if (this.voices[i].end <= now) this.voices.splice(i, 1);
  }
}

/** Design budget: music 5 + ambience 2 + sfx 5 = 12 voices at most. */
export const VOICE_BUDGET = { music: 5, ambience: 2, sfx: 5 } as const;
