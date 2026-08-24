import { toPublicGame } from '../model/index.js';
import type { PublicGame } from '../model/index.js';
import { getGamesCollection } from './collection.js';

export async function listGames(): Promise<PublicGame[]> {
  const documents = await getGamesCollection().find({}).sort({ title: 1 }).toArray();
  return documents.map(toPublicGame);
}

export async function getGameById(gameId: string): Promise<PublicGame | null> {
  const document = await getGamesCollection().findOne({ _id: gameId });
  return document ? toPublicGame(document) : null;
}
