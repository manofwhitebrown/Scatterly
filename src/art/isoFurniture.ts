import type { SpotKind } from '../shared/types';
import { boxTexture, ISO_DIMS } from './iso';
import { mkCtx, shadow } from './isoCtx';
import type { Ctx } from './isoCtx';
import * as A from './isoFurnA';
import * as B from './isoFurnB';
import type { G } from './palette';

const DRAW: Record<SpotKind, (c: Ctx) => void> = {
  drawer: A.drawDrawer, cabinet: A.drawCabinet, fridge: A.drawFridge, sofa: A.drawSofa, table: A.drawTable,
  shelf: A.drawShelf, bed: A.drawBed, wardrobe: A.drawWardrobe, jacket: A.drawJacket, bagSpot: A.drawBagSpot,
  basket: A.drawBasket, keyHook: B.drawKeyHook, shoeRack: B.drawShoeRack, sink: B.drawSink, tv: B.drawTv,
  charger: B.drawCharger, rug: B.drawRug, plant: B.drawPlant, papers: B.drawPapers, bin: B.drawBin,
};

/** Kit v1: a distinctive silhouette with details for each kind, closed and open, with a baked contact shadow. */
export function drawFurniture(g: G, kind: SpotKind, base: number, open: boolean): void {
  const dims = ISO_DIMS[kind];
  const t = boxTexture(dims);
  const c = mkCtx(g, dims, base, open, t.ox, t.oy);
  if (kind !== 'rug') shadow(c);
  DRAW[kind](c);
}

export function furnitureSize(kind: SpotKind): { w: number; h: number } {
  const t = boxTexture(ISO_DIMS[kind]);
  return { w: t.w, h: t.h };
}
