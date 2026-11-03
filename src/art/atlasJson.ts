import type { AtlasGroup, FrameRef } from './manifest';

/** Aseprite-style atlas JSON as written by tools/pack/pack.py. */
export interface AtlasJson {
  meta: { image: string; group: string; size: { w: number; h: number }; frameTags: Array<{ name: string; from: number; to: number; ms: number }> };
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; pivot: { x: number; y: number }; slice?: [number, number, number, number] }>;
}

/** Converts one atlas JSON into manifest FrameRefs; `textureKey` is the Phaser texture key AI-1's loader gave the PNG. */
export function parseAtlas(json: AtlasJson, textureKey: string): FrameRef[] {
  const out: FrameRef[] = [];
  const group = json.meta.group as AtlasGroup;
  for (const [key, f] of Object.entries(json.frames)) {
    const ref: FrameRef = { key, atlas: textureKey, frame: key, w: f.frame.w, h: f.frame.h, pivotX: f.pivot.x, pivotY: f.pivot.y, group };
    const tags: NonNullable<FrameRef['tags']> = {};
    const base = key.replace(/\/\d+$/, '');
    for (const t of json.meta.frameTags) if (t.name === base) tags[t.name] = { from: t.from, to: t.to, ms: t.ms };
    if (Object.keys(tags).length) ref.tags = tags;
    if (f.slice) ref.slice = f.slice;
    out.push(ref);
  }
  return out;
}
