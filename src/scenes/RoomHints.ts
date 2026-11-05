import { sfx } from '../audio/sfx';
import type { GameSession } from '../logic';
import type { RoomId, SpotId } from '../shared/types';
import type { Hud } from '../ui/Hud';
import type { Toast } from '../ui/Toast';
import type { RoomFeel } from './RoomFeel';
import type { RunView } from './RoomRun';

export interface HintDeps {
  session: GameSession;
  toast: Toast;
  hud: Hud;
  view: RunView;
  feel: RoomFeel;
  countHint(): void;
}

/** Spends one hint: toast, tab flash and a pulse on the spot it points at. */
export function giveHint(d: HintDeps): void {
  const hint = d.session.hint();
  if (!hint) {
    sfx.play('error');
    d.toast.show('No more hints right now.', 'warn');
    return;
  }
  d.countHint();
  d.toast.show(hint.text, 'info', 3200);
  if (hint.room) d.hud.flashTab(hint.room);
  if (hint.spotId) {
    d.view.pulse(hint.spotId);
    const c = d.view.center(hint.spotId);
    d.feel.hint(c ? c.x : 640, c ? c.y : 360);
  } else d.feel.hint(640, 360);
}

/** A clue note was tapped: flash its room tab and pulse its spot. */
export function pointAt(d: HintDeps, room: RoomId | undefined, spotId: SpotId | undefined): void {
  if (!room && !spotId) {
    d.toast.show("That note doesn't point anywhere specific.");
    return;
  }
  if (room) d.hud.flashTab(room);
  if (spotId) d.view.pulse(spotId);
}
