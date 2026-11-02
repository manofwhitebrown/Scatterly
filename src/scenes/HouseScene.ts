import Phaser from 'phaser';
import { ROOM_ORDER, SCENE } from '../shared/types';
import type { RoomId } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, SIZE, enterFade, getProfile, go, makeText } from '../ui/theme';

export interface HouseSceneData { onPick?: (room: RoomId) => void }

const SLOT: Record<RoomId, { col: number; row: number }> = {
  entrance: { col: 0, row: 1 }, living: { col: 1, row: 1 }, kitchen: { col: 2, row: 1 },
  bedroom: { col: 0, row: 0 }, bathroom: { col: 1, row: 0 },
};
const NAME: Record<RoomId, string> = { entrance: 'Entrance', living: 'Living', kitchen: 'Kitchen', bedroom: 'Bedroom', bathroom: 'Bathroom' };

/** Dollhouse (skeleton): whole home as room tiles on two floors. Layout comes from HOUSE_MAP once AI-2 ships it. */
export class HouseScene extends Phaser.Scene {
  private pick: ((room: RoomId) => void) | undefined;

  constructor() {
    super(SCENE.House);
  }

  init(data: HouseSceneData): void {
    this.pick = data?.onPick;
  }

  create(): void {
    enterFade(this);
    this.cameras.main.setBackgroundColor(COLOR.bg);
    const unlocked = getProfile(this).unlockedRooms;
    for (const room of ROOM_LIST) {
      const s = SLOT[room];
      const x = 300 + s.col * 270;
      const y = 250 + s.row * 190;
      const open = unlocked.includes(room);
      const g = this.add.graphics();
      g.fillStyle(open ? COLOR.plateLight : COLOR.plateEdge, 1).fillRoundedRect(x - 120, y - 80, 240, 160, 16);
      makeText(this, x, y, open ? NAME[room] : `${NAME[room]} (locked)`, { fontSize: `${SIZE.label}px`, color: open ? CSS.cream : CSS.muted }).setOrigin(0.5);
      const hit = this.add.zone(x, y, 240, 160).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (!open) return;
        if (this.pick) this.pick(room);
        else go(this, SCENE.Menu);
      });
    }
    new Button(this, 640, 660, 320, 'Back', () => go(this, SCENE.Menu), { variant: 'primary' });
  }
}

const ROOM_LIST: readonly RoomId[] = ROOM_ORDER;
