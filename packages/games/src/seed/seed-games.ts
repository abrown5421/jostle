import { getGamesCollection } from '../db/index.js';
import { GAMES_SEED_DATA } from './games-seed-data.js';

export async function seedGames(): Promise<void> {
  for (const game of GAMES_SEED_DATA) {
    await getGamesCollection().updateOne({ _id: game._id }, { $set: game }, { upsert: true });
  }
}
