/** Local mirror of the Contract v2 FxName union; swap for the shared type once types.ts lands it. */
export type FxName = 'tap' | 'open' | 'empty' | 'found' | 'take' | 'clue' | 'hint' | 'room'
  | 'urgent' | 'win' | 'lose' | 'coin' | 'star' | 'buy' | 'unlock' | 'puzzleOk';

export const FX_NAMES: readonly FxName[] = ['tap', 'open', 'empty', 'found', 'take', 'clue', 'hint', 'room',
  'urgent', 'win', 'lose', 'coin', 'star', 'buy', 'unlock', 'puzzleOk'];
