import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError } from '@inithium/api-utils';
import { findGameBySlug, findPublishedGames } from '@inithium/db';
import type { GameEntity } from '@inithium/db';
import { isGamePlayable } from '@inithium/game-session';

const router: RouterType = Router();

const normalizeParam = (raw: string | string[]): string => (Array.isArray(raw) ? raw[0] : raw);

// `isPlayable` is derived, never stored: a catalogue record can exist (and be selected and
// configured) before its gameplay ships, and this is what lets the host's Start button say
// "coming soon" instead of failing.
const toCatalogueItem = (game: GameEntity) => ({ ...game, isPlayable: isGamePlayable(game.slug) });

// Public on purpose - anyone can browse the catalogue; hosting is what requires an account.
router.get(
  '/api/games',
  asyncHandler(async (_req: Request, res: Response) => {
    const games = await findPublishedGames();
    res.status(200).json(createSuccessResponse(games.map(toCatalogueItem)));
  }),
);

router.get(
  '/api/games/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const game = await findGameBySlug(normalizeParam(req.params.slug));
    if (!game || !game.isPublished) {
      throw NotFoundError('Game not found');
    }
    res.status(200).json(createSuccessResponse(toCatalogueItem(game)));
  }),
);

export default router;
