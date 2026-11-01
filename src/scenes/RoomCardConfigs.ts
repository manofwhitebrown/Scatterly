import { fmtClock } from '../ui/theme';
import type { GameMode, Scenario } from '../shared/types';
import type { CardConfig } from './RoomCards';

export const COACH_STEPS = [
  'Tap any furniture to search it. Drawers, jackets, sofas and bags can all hide things.',
  'Read every clue you find. The Clue Board keeps all of them in one place.',
  'Clues point to rooms and spots. Work out where last night led your things.',
  'Long-press a spot to mark it: ✕ ruled out, ? hunch. Press again to change or clear.',
];

export function introCard(s: Scenario, mode: GameMode, onStart: () => void): CardConfig {
  const info =
    mode === 'rush'
      ? `Morning Rush: find everything within ${fmtClock(s.timeLimitSec)}.`
      : mode === 'daily'
        ? "Daily Mystery: today's puzzle, the same for everyone."
        : 'Relaxed Morning: no timer, take your time.';
  return {
    title: s.title,
    body: `${s.intro}\n\n${info}\nFind:`,
    items: s.targets,
    buttons: [{ label: 'Start', primary: true, onTap: onStart }],
  };
}

export function coachCard(step: number, onNext: () => void): CardConfig {
  const last = step >= COACH_STEPS.length - 1;
  return {
    title: `How to play (${step + 1}/${COACH_STEPS.length})`,
    body: COACH_STEPS[step] ?? '',
    buttons: [{ label: last ? 'Got it' : 'Next', primary: true, onTap: onNext }],
  };
}

export function pauseCard(onResume: () => void, onRestart: () => void, onQuit: () => void): CardConfig {
  return {
    title: 'Paused',
    body: 'The clock is stopped.',
    buttons: [
      { label: 'Resume', primary: true, onTap: onResume },
      { label: 'Restart', onTap: onRestart },
      { label: 'Quit to Menu', onTap: onQuit },
    ],
  };
}

export function quitCard(onKeep: () => void, onQuit: () => void): CardConfig {
  return {
    title: 'Quit to menu?',
    body: "This morning's progress will be lost.",
    buttons: [
      { label: 'Keep playing', primary: true, onTap: onKeep },
      { label: 'Quit', onTap: onQuit },
    ],
  };
}

export function timeUpCard(onContinue: () => void): CardConfig {
  return {
    title: "Time's up!",
    body: "The morning got away from you, but let's see what really happened last night.",
    buttons: [{ label: 'See what happened', primary: true, onTap: onContinue }],
  };
}
