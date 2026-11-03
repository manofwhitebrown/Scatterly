import type { ClueIcon, ItemId, RoomId } from '../shared/types';

export interface ItemDef {
  id: ItemId;
  essential: boolean;
  /** Short lowercase noun phrase used in hint wording. */
  noun: string;
  /** Hint wording once the room is known. {room} is replaced by the room name. */
  roomHint: string;
  /** Hint wording once the spot is known. {spot} is replaced by the spot label. */
  spotHint: string;
  /** Clue icons that most naturally relate to this item. */
  icons: ClueIcon[];
}

export const ROOM_NAME: Record<RoomId, string> = {
  entrance: 'the entrance hall', living: 'the living room', kitchen: 'the kitchen',
  bedroom: 'the bedroom', bathroom: 'the bathroom', laundry: 'the laundry', study: 'the study',
  balcony: 'the balcony', garden: 'the garden',
};

export const ITEM_DEFS: Record<ItemId, ItemDef> = {
  keys: {
    id: 'keys', essential: true, noun: 'car keys',
    roomHint: 'Your car keys are somewhere in {room}.',
    spotHint: 'Your car keys are hiding: try the {spot}.',
    icons: ['receipt', 'bagTag', 'note'],
  },
  wallet: {
    id: 'wallet', essential: true, noun: 'wallet',
    roomHint: 'Your wallet is somewhere in {room}.',
    spotHint: 'Your wallet is tucked away: try the {spot}.',
    icons: ['receipt', 'ticket', 'laundry'],
  },
  phone: {
    id: 'phone', essential: true, noun: 'phone',
    roomHint: 'Your phone is somewhere in {room}.',
    spotHint: 'Your phone is lurking: try the {spot}.',
    icons: ['text', 'photo', 'note'],
  },
  officeId: {
    id: 'officeId', essential: true, noun: 'office ID',
    roomHint: 'Your office ID is somewhere in {room}.',
    spotHint: 'Your office ID is waiting: try the {spot}.',
    icons: ['ticket', 'laundry', 'note'],
  },
  shoes: {
    id: 'shoes', essential: true, noun: 'work shoes',
    roomHint: 'Your work shoes are somewhere in {room}.',
    spotHint: 'Your work shoes are lurking: try the {spot}.',
    icons: ['stain', 'photo', 'note'],
  },
  glasses: {
    id: 'glasses', essential: false, noun: 'glasses',
    roomHint: 'Your glasses are somewhere in {room}.',
    spotHint: 'Your glasses are sitting pretty: try the {spot}.',
    icons: ['stain', 'mug', 'note'],
  },
  earbuds: {
    id: 'earbuds', essential: false, noun: 'earbuds',
    roomHint: 'Your earbuds are somewhere in {room}.',
    spotHint: 'Your earbuds are tangled up: try the {spot}.',
    icons: ['text', 'wrapper', 'note'],
  },
  bag: {
    id: 'bag', essential: true, noun: 'work bag',
    roomHint: 'Your work bag is somewhere in {room}.',
    spotHint: 'Your work bag is slumped: try the {spot}.',
    icons: ['bagTag', 'receipt', 'wrapper'],
  },
};
