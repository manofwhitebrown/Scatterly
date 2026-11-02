import type Phaser from 'phaser';
import type { GameSession } from '../logic';
import { tex } from '../shared/types';
import type { RoomId, Spot, SpotId, SpotMark } from '../shared/types';
import { CSS, isCalm, makeText } from '../ui/theme';

/** What RoomMarks needs from a room view (flat or iso). */
export interface MarkHost {
  spotOf(id: SpotId): Spot | undefined;
  attach(room: RoomId, obj: Phaser.GameObjects.GameObject): void;
}

type Badge = Phaser.GameObjects.Image | Phaser.GameObjects.Text;

const GLYPH: Record<SpotMark, string> = { ruledOut: '✕', hunch: '?' };

/** Deduction badges above spots. Created lazily, one per spot ever marked, then reused (hidden when cleared). */
export class RoomMarks {
  private readonly badges = new Map<SpotId, Badge>();
  private readonly off: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly view: MarkHost,
    session: GameSession,
  ) {
    this.off = session.on('mark', () => this.sync(session));
    this.sync(session);
  }

  destroy(): void {
    this.off();
    for (const b of this.badges.values()) this.scene.tweens.killTweensOf(b);
    this.badges.clear();
  }

  private sync(session: GameSession): void {
    const marks = session.marks();
    for (const [id, badge] of this.badges) {
      if (!marks.has(id)) badge.setVisible(false);
    }
    for (const [id, mark] of marks) this.show(id, mark);
  }

  private show(id: SpotId, mark: SpotMark): void {
    const spot = this.view.spotOf(id);
    if (!spot) return;
    let badge = this.badges.get(id);
    if (!badge) {
      badge = this.make(mark);
      this.view.attach(spot.room, badge);
      this.badges.set(id, badge);
    }
    const key = tex.mark(mark);
    if ('setTexture' in badge) badge.setTexture(key);
    else badge.setText(GLYPH[mark]).setColor(mark === 'hunch' ? CSS.amber : CSS.red);
    badge.setPosition(spot.x + spot.w / 2, Math.max(96, spot.y - 4)).setVisible(true);
    if (isCalm(this.scene)) return;
    this.scene.tweens.killTweensOf(badge);
    badge.setScale(0.4);
    this.scene.tweens.add({ targets: badge, scale: 1, duration: 120, ease: 'Back.easeOut' });
  }

  private make(mark: SpotMark): Badge {
    const key = tex.mark(mark);
    if (this.scene.textures.exists(key)) return this.scene.add.image(0, 0, key).setDisplaySize(40, 40);
    return makeText(this.scene, 0, 0, GLYPH[mark], { fontSize: '40px', fontStyle: 'bold' }).setOrigin(0.5);
  }
}
