import { GAME_H } from '../shared/types';

/** Puzzle panel geometry in game px. Plain data (no Phaser) so tests can check it. */
export const PX = 140;
export const PY = 60;
export const PW = 1000;
export const PH = 600;

/** Hint / Notes / Skip bar: 96 px tall, flush with the screen bottom. */
export const BTN_H = 96;
export const BAR_TOP = GAME_H - BTN_H - 4;

export const KEY = 96;
export const KEY_GAP = 6;
/** Keypad block width: 6 columns of 96 px keys. */
export const KEYPAD_W = 6 * KEY + 5 * KEY_GAP;
export const NOTES_W = 340;
export const NOTES_LEFT = PX + PW - NOTES_W - 20;
