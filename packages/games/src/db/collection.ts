import { getClient } from '@jostle/db';
import type { Collection } from 'mongodb';
import type { GameDocument } from '../model/index.js';

export function getGamesCollection(): Collection<GameDocument> {
  return getClient().db().collection<GameDocument>('games');
}
