import type Phaser from 'phaser';
import type { PlayerProfile } from '../shared/types';
import { FxLayer, liveParticleTotal } from './layer';
import type { FxName } from './names';

export type { FxName } from './names';

const layers = new WeakMap<Phaser.Scene, FxLayer>();

function calmMode(scene: Phaser.Scene): boolean {
  const st = (scene.registry.get('profile') as PlayerProfile | undefined)?.settings;
  return !!st && (st.lowFx || st.reducedMotion);
}

/** Plays a pooled visual effect. Safe to call at any time from any scene with any coordinates; never throws. */
export function playFx(scene: Phaser.Scene, name: FxName, x: number, y: number): void {
  try {
    if (!scene || !name || !Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!scene.sys || !scene.sys.isActive() || !scene.add) return;
    let layer = layers.get(scene);
    if (!layer || layer.isDead) {
      layer = new FxLayer(scene);
      layers.set(scene, layer);
    }
    layer.play(name, x, y, calmMode(scene));
  } catch {
    /* effects are decoration: never break gameplay */
  }
}

/** Live particle count (all scenes) for the debug overlay. */
export function liveParticles(): number {
  return liveParticleTotal();
}
