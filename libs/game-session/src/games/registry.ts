import type { GameDefinition } from '../contracts/game-definition.contract';

// Every playable game, keyed by id (= its game catalogue slug). Empty until the first game's
// gameplay is built - a game can sit in the catalogue, be selected and configured, before it has
// an entry here; it just can't be started. A new game is one GameDefinition file plus one entry
// here; the session/gateway plumbing never changes per game.
// `any` state is unavoidable in a heterogeneous registry; each definition is fully typed itself.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gameDefinitions: readonly GameDefinition<any, any>[] = [
  // inithium:anchor:games
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGameDefinition = (gameId: string): GameDefinition<any, any> | undefined =>
  gameDefinitions.find((definition) => definition.id === gameId);

// Whether a catalogue game has gameplay yet - the catalogue API surfaces this so the host's Start
// button can say "coming soon" instead of failing.
export const isGamePlayable = (gameId: string): boolean => getGameDefinition(gameId) !== undefined;

export const listGameDefinitionIds = (): string[] => gameDefinitions.map(({ id }) => id);
