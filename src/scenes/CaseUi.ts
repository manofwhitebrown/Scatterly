import Phaser from 'phaser';
import type { GameSession } from '../logic';
import type { GameMode, RoomId, Scenario, SpotId } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, DEPTH, SIZE, drawPlate, makeText } from '../ui/theme';
import { caseProgress, checkpointText, stripText } from './caseProgress';

const POLL_MS = 500;
const BAR_MS = 7000;

/**
 * Case progress strip under the HUD plus a calm, NON-modal checkpoint bar after each find ("keep going / take a
 * break"). Never blocks input or the clock; Rush gets the strip only. Returns its unsubscribe via `off`.
 */
export class CaseUi {
  private readonly strip: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Container;
  private readonly barText: Phaser.GameObjects.Text;
  private hide: Phaser.Time.TimerEvent | null = null;
  private last = '';
  readonly off: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: GameSession,
    private readonly scenario: Scenario,
    private readonly rooms: readonly RoomId[],
    private readonly spotRoom: ReadonlyMap<SpotId, RoomId>,
    mode: GameMode,
    onBreak: () => void,
  ) {
    this.strip = makeText(scene, 640, 70, '', { fontSize: '24px', color: CSS.muted }).setOrigin(0.5, 0).setDepth(DEPTH.hud);
    const g = scene.add.graphics();
    drawPlate(g, -420, -56, 840, 112, 16, COLOR.plate, COLOR.plateEdge);
    this.barText = makeText(scene, -400, 0, '', { fontSize: `${SIZE.label}px`, wordWrap: { width: 380 } }).setOrigin(0, 0.5);
    const keep = new Button(scene, 90, 0, 220, 'Keep going', () => this.close(), { variant: 'primary', height: 96 });
    const brk = new Button(scene, 330, 0, 220, 'Take a break', () => { this.close(); onBreak(); }, { height: 96 });
    this.bar = scene.add.container(640, 640, [g, this.barText, keep, brk]).setDepth(DEPTH.hud).setVisible(false);
    scene.time.addEvent({ delay: POLL_MS, loop: true, callback: () => this.refresh() });
    this.refresh();
    const offFound = mode === 'rush' ? () => undefined : session.on('found', () => this.checkpoint());
    this.off = () => { offFound(); this.hide?.remove(false); };
  }

  private refresh(): void {
    const t = stripText(caseProgress(this.session, this.scenario, this.rooms, this.spotRoom));
    if (t === this.last) return;
    this.last = t;
    this.strip.setText(t);
  }

  private checkpoint(): void {
    this.refresh();
    const text = checkpointText(caseProgress(this.session, this.scenario, this.rooms, this.spotRoom));
    if (text === null) return;
    this.barText.setText(text);
    this.bar.setVisible(true);
    this.hide?.remove(false);
    this.hide = this.scene.time.delayedCall(BAR_MS, () => this.close());
  }

  private close(): void {
    this.hide?.remove(false);
    this.hide = null;
    this.bar.setVisible(false);
  }
}
