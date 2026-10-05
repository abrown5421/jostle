import type { CreateGameInput } from '../contracts/game.contract';
import ipodWarGameSeed from './ipod-war.game-seed';
import pointOfHueGameSeed from './point-of-hue.game-seed';
import fishbowlGameSeed from './fishbowl.game-seed';
import wordleWarGameSeed from './wordle-war.game-seed';
// inithium:anchor:imports

// Every game the catalogue should always hold a record for, reconciled once at API startup by
// ensureSeededGames() - the same seed-once-by-slug pattern as page-seeds/registry.ts. A new game
// is one *.game-seed.ts file plus one entry here (and, once it's playable, a GameDefinition in
// @inithium/game-session whose id is the same slug).
export const gameSeeds: CreateGameInput[] = [
  ipodWarGameSeed,
  pointOfHueGameSeed,
  fishbowlGameSeed,
  wordleWarGameSeed,
  // inithium:anchor:seeds
];
