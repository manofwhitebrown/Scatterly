import type Phaser from 'phaser';
import { UntangleScene } from './UntangleScene';
import { SortScene } from './SortScene';
import { WordScene } from './WordScene';
import { CodeScene } from './CodeScene';

export const puzzleScenes: Phaser.Types.Scenes.SceneType[] = [UntangleScene, SortScene, WordScene, CodeScene];
