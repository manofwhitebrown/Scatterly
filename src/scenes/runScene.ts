import { SCENE } from '../shared/types';

/** The scene that runs a morning: the Room scene (flat or iso) until RoomRun moves into Home at Gate B. */
export const runScene = (): string => SCENE.Room;
