import type Phaser from 'phaser';
import { flags } from '../core/flags';
import { ChillScene } from './ChillScene';
import { HomeScene } from './HomeScene';
import { HouseScene } from './HouseScene';
import { IsoRoomScene } from './IsoRoomScene';
import { JournalScene } from './JournalScene';
import { MenuScene } from './MenuScene';
import { ModeSelectScene } from './ModeSelectScene';
import { ResultScene } from './ResultScene';
import { ReplayScene } from './ReplayScene';
import { RoomScene } from './RoomScene';
import { SettingsScene } from './SettingsScene';

/** `?view=home` runs the Phase 4 Home scene; `?view=iso` swaps the Room scene for the isometric one; the default stays the flat room until Parity. */
export const gameScenes: Phaser.Types.Scenes.SceneType[] = [
  MenuScene, ModeSelectScene, flags().home ? HomeScene : flags().iso ? IsoRoomScene : RoomScene, ResultScene, ReplayScene, ChillScene, SettingsScene, JournalScene, HouseScene,
];
