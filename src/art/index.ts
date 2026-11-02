import type Phaser from 'phaser';
import { ITEM_IDS, ROOM_ORDER, SPOT_SIZE, tex } from '../shared/types';
import type { SpotKind } from '../shared/types';
import { DECOR } from '../logic';
import { bake, bakeFallback } from './palette';
import type { G } from './palette';
import { drawRoom } from './rooms';
import { drawSpot } from './spots';
import { drawItem } from './items';
import { CLUE_ICONS, drawIcon } from './icons';
import { drawDecor } from './decor';
import { isoTasks } from './isoKit';

interface Task { key: string; w: number; h: number; draw: (g: G) => void }

function buildTasks(): Task[] {
  const tasks: Task[] = [];
  for (const id of ROOM_ORDER) tasks.push({ key: tex.room(id), w: 1280, h: 720, draw: (g) => drawRoom(g, id) });
  for (const kind of Object.keys(SPOT_SIZE) as SpotKind[]) {
    const { w, h } = SPOT_SIZE[kind];
    tasks.push({ key: tex.spot(kind), w, h, draw: (g) => drawSpot(g, kind, false) });
    tasks.push({ key: tex.spot(kind, true), w, h, draw: (g) => drawSpot(g, kind, true) });
  }
  for (const id of ITEM_IDS) tasks.push({ key: tex.item(id), w: 96, h: 96, draw: (g) => drawItem(g, id) });
  for (const id of CLUE_ICONS) tasks.push({ key: tex.icon(id), w: 64, h: 64, draw: (g) => drawIcon(g, id) });
  for (const def of DECOR) tasks.push({ key: tex.decor(def.id), w: Math.max(1, Math.round(def.w)), h: Math.max(1, Math.round(def.h)), draw: (g) => drawDecor(g, def) });
  for (const t of isoTasks()) tasks.push(t);
  return tasks;
}

/** Generates every texture in code. Idempotent; yields to the event loop so loading bars animate. */
export async function generateAllTextures(scene: Phaser.Scene, onProgress?: (p: number) => void): Promise<void> {
  const tasks = buildTasks();
  const total = tasks.length;
  for (let i = 0; i < total; i++) {
    const t = tasks[i];
    if (!scene.textures.exists(t.key)) {
      try {
        bake(scene, t.key, t.w, t.h, t.draw);
      } catch {
        try {
          bakeFallback(scene, t.key, t.w, t.h);
        } catch {
          /* texture stays missing; callers guard with textures.exists */
        }
      }
    }
    if (i % 6 === 5) {
      onProgress?.((i + 1) / total);
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
  onProgress?.(1);
}
