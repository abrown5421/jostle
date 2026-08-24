import type { GameDocument, PublicGame } from './types.js';

export function toPublicGame(document: GameDocument): PublicGame {
  const { _id, ...rest } = document;
  return { ...rest, gameId: _id };
}
