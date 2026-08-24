import type { GameCatalogEntry, GamesClient } from '@jostle/game-catalog';

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new Error(`Request to ${path} failed with status ${response.status}`);
  return response.json();
}

export const gamesClient: GamesClient = {
  async listGames() {
    const data = (await getJson('/games')) as { games: GameCatalogEntry[] };
    return data.games;
  },

  async getGameById(gameId) {
    const response = await fetch(`/games/${gameId}`, { credentials: 'include' });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Request to /games/${gameId} failed with status ${response.status}`);
    const data = (await response.json()) as { game: GameCatalogEntry };
    return data.game;
  },
};
