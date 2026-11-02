import type Phaser from 'phaser';
import { flags } from '../core/flags';
import { HouseScene } from './HouseScene';
import { IsoRoomScene } from './IsoRoomScene';
import { JournalScene } from './JournalScene';
import { MenuScene } from './MenuScene';
import { ModeSelectScene } from './ModeSelectScene';
import { ResultScene } from './ResultScene';
import { RoomScene } from './RoomScene';
import { SettingsScene } from './SettingsScene';

/** `?view=iso` swaps the Room scene for the isometric one; the default stays the flat room until Parity. */
export const gameScenes: Phaser.Types.Scenes.SceneType[] = [
  MenuScene, ModeSelectScene, flags().iso ? IsoRoomScene : RoomScene, ResultScene, SettingsScene, JournalScene, HouseScene,
];
