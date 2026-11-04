import type Phaser from 'phaser';
import { ART_PX, FRAME_KEYS, frame } from '../art/manifest';
import { ensureGroup } from '../core/assets';
import type { PuzzleKind } from '../shared/types';
import { isSkinned } from './skinKinds';

/**
 * Skin hook: when `puzzle/<kind>/panel` exists in the manifest, a nine-slice image replaces the code-drawn panel
 * (`fallback`, which is hidden). No atlas, a failed load or a closed scene leaves the current look untouched.
 */
export async function skinPanel(scene: Phaser.Scene, kind: PuzzleKind, fallback: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): Promise<boolean> {
  if (!isSkinned(kind)) return false;
  await ensureGroup(scene, `puzzle:${kind}`);
  if (!scene.sys.isActive() || !fallback.scene) return false;
  const f = frame(FRAME_KEYS.puzzle(kind, 'panel'));
  if (!f) return false;
  const [l, t, r, b] = f.slice ?? [0, 0, 0, 0];
  const img = scene.add.nineslice(x, y, f.atlas, f.frame, w / ART_PX, h / ART_PX, l, r, t, b).setOrigin(0, 0).setScale(ART_PX);
  scene.children.moveTo(img, scene.children.getIndex(fallback) + 1);
  fallback.setVisible(false);
  return true;
}
