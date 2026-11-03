import { flags } from '../core/flags';
import { SCENE } from '../shared/types';

/** The scene that runs a morning: Home under `?view=home`, otherwise the Room scene (flat or iso). */
export const runScene = (): string => (flags().home ? SCENE.Home : SCENE.Room);
