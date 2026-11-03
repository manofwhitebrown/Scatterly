import type Phaser from 'phaser';
import { errorCount } from './errors';
import { liveParticles } from '../fx';
import { textureBytes } from './assetLoad';
import type { FrameStats, FrameSummary } from './frameStats';

export interface Metrics extends FrameSummary {
  objects: number; textures: number; atlasMB: number; tweens: number; particles: number; heapMB: number | null; errors: number;
}

interface PerfMemory { memory?: { usedJSHeapSize: number } }

/** Counts for the debug overlay and the e2e leak gate. Allocates; call at 2 Hz at most. */
export function readMetrics(game: Phaser.Game, stats: FrameStats): Metrics {
  let objects = 0;
  let tweens = 0;
  for (const s of game.scene.getScenes(false)) {
    objects += s.children.length;
    tweens += s.tweens.getTweens().length;
  }
  const mem = (performance as unknown as PerfMemory).memory;
  const f = stats.summary();
  return {
    fps: f.fps, p5Fps: f.p5Fps, p95Ms: f.p95Ms, maxMs: f.maxMs, slowFrames: f.slowFrames, frames: f.frames,
    objects, textures: game.textures.getTextureKeys().length, atlasMB: textureBytes() / 1048576, tweens, particles: liveParticles(),
    heapMB: mem ? mem.usedJSHeapSize / 1048576 : null, errors: errorCount(),
  };
}

export function formatMetrics(m: Metrics): string {
  const heap = m.heapMB === null ? 'n/a' : `${m.heapMB.toFixed(1)}MB`;
  return (
    `${Math.round(m.fps)} fps  p5 ${Math.round(m.p5Fps)}  p95 ${m.p95Ms.toFixed(1)}ms  slow ${m.slowFrames}\n` +
    `obj ${m.objects}  tex ${m.textures} (atlas ${m.atlasMB.toFixed(1)}MB)  tween ${m.tweens}  fx ${m.particles}\n` +
    `heap ${heap}  err ${m.errors}`
  );
}
