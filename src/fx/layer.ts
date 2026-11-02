import Phaser from 'phaser';
import { tex } from '../shared/types';
import { GAME_H, GAME_W } from '../shared/types';
import { Pool } from './pool';
import { allowedCount, FX_SPECS, MAX_PARTICLES } from './specs';
import type { FxSpec } from './specs';
import type { FxName } from './names';
import { ensureFxTextures } from './textures';

interface P { img: Phaser.GameObjects.Image; vx: number; vy: number; age: number; life: number; g: number; s0: number; s1: number; spin: number; confetti: boolean; wait: number }

const DEPTH_FX = 800;
let liveTotal = 0;
export function liveParticleTotal(): number {
  return liveTotal;
}

/** Per-scene pooled effects. Particles are stepped in one update listener: no tween per particle, no per-frame allocation. */
export class FxLayer {
  private readonly pool: Pool<P>;
  private flash: Phaser.GameObjects.Rectangle | null = null;
  private flashTween: Phaser.Tweens.Tween | null = null;
  private liveConfetti = 0;
  private live = 0;
  private dead = false;

  constructor(private readonly scene: Phaser.Scene) {
    ensureFxTextures(scene);
    this.pool = new Pool<P>(MAX_PARTICLES, () => {
      const img = scene.add.image(0, 0, tex.fx('dot')).setVisible(false).setActive(false).setDepth(DEPTH_FX);
      return { img, vx: 0, vy: 0, age: 0, life: 1, g: 0, s0: 1, s1: 1, spin: 0, confetti: false, wait: 0 };
    });
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.step, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  play(name: FxName, x: number, y: number, calm: boolean): void {
    if (this.dead) return;
    const spec = FX_SPECS[name];
    if (!spec) return;
    if (calm) {
      this.emit({ ...spec, count: 1, tex: 'ring', speed: [0, 0], life: [0.12, 0.12], gravity: 0, scaleFrom: 0.8, scaleTo: 0.8, spin: 0, flash: undefined }, 1, x, y);
      return;
    }
    const n = allowedCount(spec, this.live, this.liveConfetti);
    if (n > 0) this.emit(spec, n, x, y);
    if (spec.flash) this.doFlash(spec.flash.color, spec.flash.alpha, spec.flash.ms);
  }

  private emit(spec: FxSpec, n: number, x: number, y: number): void {
    const key = tex.fx(spec.tex);
    if (!this.scene.textures.exists(key)) return;
    for (let i = 0; i < n; i++) {
      const { item: p, recycled } = this.pool.acquire();
      if (recycled) this.retire(p);
      const a = spec.angle + (Math.random() - 0.5) * spec.spread;
      const sp = spec.speed[0] + Math.random() * (spec.speed[1] - spec.speed[0]);
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.age = 0;
      p.life = spec.life[0] + Math.random() * (spec.life[1] - spec.life[0]);
      p.g = spec.gravity;
      p.s0 = spec.scaleFrom;
      p.s1 = spec.scaleTo;
      p.spin = spec.spin * (Math.random() < 0.5 ? -1 : 1);
      p.confetti = spec.tex === 'confetti';
      p.wait = (spec.delay ?? 0) / 1000;
      p.img.setTexture(key).setPosition(x, y).setScale(spec.scaleFrom).setAlpha(1).setRotation(0)
        .setTint(spec.tints[i % spec.tints.length]).setVisible(p.wait <= 0).setActive(true);
      this.live++;
      liveTotal++;
      if (p.confetti) this.liveConfetti++;
    }
  }

  private retire(p: P): void {
    p.img.setVisible(false).setActive(false);
    this.live = Math.max(0, this.live - 1);
    liveTotal = Math.max(0, liveTotal - 1);
    if (p.confetti) this.liveConfetti = Math.max(0, this.liveConfetti - 1);
  }

  private step(_t: number, deltaMs: number): void {
    if (this.live === 0) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.pool.forEachLive((p, idx) => {
      if (p.wait > 0) {
        p.wait -= dt;
        if (p.wait <= 0) p.img.setVisible(true);
        return;
      }
      p.age += dt;
      if (p.age >= p.life) {
        this.retire(p);
        this.pool.release(idx);
        return;
      }
      const k = p.age / p.life;
      p.vy += p.g * dt;
      p.img.x += p.vx * dt;
      p.img.y += p.vy * dt;
      p.img.setScale(p.s0 + (p.s1 - p.s0) * k);
      p.img.setAlpha(1 - k * k);
      if (p.spin !== 0) p.img.rotation += p.spin * dt;
    });
  }

  private doFlash(color: number, alpha: number, ms: number): void {
    if (!this.flash) {
      this.flash = this.scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, color, 0).setScrollFactor(0).setDepth(DEPTH_FX - 1);
    }
    this.flashTween?.stop();
    this.flash.setFillStyle(color, alpha);
    this.flash.setAlpha(1);
    this.flashTween = this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: ms, ease: 'Quad.easeOut' });
  }

  destroy(): void {
    if (this.dead) return;
    this.dead = true;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.step, this);
    this.flashTween?.stop();
    this.flashTween = null;
    this.pool.forEachLive((p) => this.retire(p));
    for (let i = 0; i < this.pool.size; i++) this.pool.at(i).img.destroy();
    this.flash?.destroy();
    this.flash = null;
  }

  get isDead(): boolean {
    return this.dead;
  }
}
