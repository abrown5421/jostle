import { getGameById, listGames } from '@jostle/games';
import { Router } from 'express';

export const gamesRouter = Router();

gamesRouter.get('/', async (_req, res) => {
  const games = await listGames();
  res.json({ games });
});

gamesRouter.get('/:gameId', async (req, res) => {
  const game = await getGameById(req.params.gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found.' });
    return;
  }
  res.json({ game });
});
