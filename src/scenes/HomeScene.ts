import { SCENE } from '../shared/types';
import { IsoRoomScene } from './IsoRoomScene';

/**
 * `?view=home` (SCENE.Home). Phase 4 world scene, slice 1: the isometric room with the Overview (house button,
 * Dollhouse overlay) <-> Focus (room switch) flow and the `__e2e` hooks, registered under its own key. The single
 * connected world on one global grid replaces the room view inside this class; the key, flow and hooks stay.
 */
export class HomeScene extends IsoRoomScene {
  constructor() {
    super(SCENE.Home);
  }
}
