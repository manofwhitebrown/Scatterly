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

/** `?view=home` adds the Phase 5 Home scene as the first screen (Play still starts the old room until RoomRun moves in); `?view=iso` swaps the Room scene for the isometric one; the default stays the flat room until Parity. */
export const gameScenes: Phaser.Types.Scenes.SceneType[] = [
  MenuScene, ModeSelectScene, flags().iso ? IsoRoomScene : RoomScene, ResultScene, ReplayScene, ChillScene, SettingsScene, JournalScene, HouseScene,
  ...(flags().home ? [HomeScene] : []),
];
