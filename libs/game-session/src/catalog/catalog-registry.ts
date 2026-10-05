import type { GameCatalog } from '../contracts/game-catalog.contract';

// Until apps/api wires the real catalogue in, every game is unknown - selecting one fails with
// GAME_NOT_FOUND rather than anything silently succeeding against a catalogue that isn't there.
const emptyGameCatalog: GameCatalog = {
  name: 'Empty (no catalogue configured)',
  findGame: async () => null,
};

// Same shared-mutable-reference recipe as store/store-registry.ts.
let current: GameCatalog = emptyGameCatalog;

export const setActiveGameCatalog = (catalog: GameCatalog): void => {
  current = catalog;
};

export const getActiveGameCatalog = (): GameCatalog => current;
