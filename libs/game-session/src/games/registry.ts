import type { GameDefinition } from '../contracts/game-definition.contract';
import { ipodWarGame } from './ipod-war/ipodWar.game';

// Every playable game, keyed by id (= its game catalogue slug). A game can sit in the catalogue,
// be selected and configured, before it has an entry here; it just can't be started. A new game
// is one GameDefinition folder plus one entry here; the session/gateway plumbing never changes
// per game.
// `any` state is unavoidable in a heterogeneous registry; each definition is fully typed itself.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGameDefinition = GameDefinition<any, any, any>;

const gameDefinitions: readonly AnyGameDefinition[] = [
  ipodWarGame,
  // inithium:anchor:games
];

// Specs swap in small purpose-built games; deliberately not exported from index.ts.
let active: readonly AnyGameDefinition[] = gameDefinitions;

export const setGameDefinitionsForTesting = (definitions: readonly AnyGameDefinition[]): void => {
  active = definitions;
};

export const resetGameDefinitions = (): void => {
  active = gameDefinitions;
};

export const getGameDefinition = (gameId: string): AnyGameDefinition | undefined =>
  active.find((definition) => definition.id === gameId);

// Whether a catalogue game has gameplay yet - the catalogue API surfaces this so the host's Start
// button can say "coming soon" instead of failing.
export const isGamePlayable = (gameId: string): boolean => getGameDefinition(gameId) !== undefined;

export const listGameDefinitionIds = (): string[] => active.map(({ id }) => id);
