import { flags } from '../core/flags';
import { SCENE } from '../shared/types';

/** The scene that runs a morning: Home by default, the old Room scene (flat or iso) under `?view=legacy` / `?view=iso`. */
export const runScene = (): string => (flags().home ? SCENE.Home : SCENE.Room);
