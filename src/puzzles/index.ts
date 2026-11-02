import type Phaser from 'phaser';
import { UntangleScene } from './UntangleScene';
import { SortScene } from './SortScene';
import { WordScene } from './WordScene';
import { CodeScene } from './CodeScene';
import { TargetScene } from './TargetScene';
import { SequenceScene } from './SequenceScene';
import { LightsScene } from './LightsScene';
import { SlideScene } from './SlideScene';
import { PipesScene } from './PipesScene';
import { MastermindScene } from './MastermindScene';
import { MemoryScene } from './MemoryScene';

export const puzzleScenes: Phaser.Types.Scenes.SceneType[] = [UntangleScene, SortScene, WordScene, CodeScene, TargetScene, SequenceScene, LightsScene, SlideScene, PipesScene, MastermindScene, MemoryScene];
