import type Phaser from 'phaser';
import { MenuScene } from './MenuScene';
import { ModeSelectScene } from './ModeSelectScene';
import { ResultScene } from './ResultScene';
import { RoomScene } from './RoomScene';
import { SettingsScene } from './SettingsScene';

export const gameScenes: Phaser.Types.Scenes.SceneType[] = [MenuScene, ModeSelectScene, RoomScene, ResultScene, SettingsScene];
