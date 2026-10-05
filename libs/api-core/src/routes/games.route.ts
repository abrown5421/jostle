import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError } from '@inithium/api-utils';
import { optionalAuth } from '@inithium/auth';
import { findGameBySlug, findPublishedGames } from '@inithium/db';
import type { GameEntity } from '@inithium/db';
import { isGamePlayable } from '@inithium/game-session';
import type { GameRequirementBlocker } from '@inithium/game-session';
import { gameRequirementEvaluator } from '../games/gameRequirements';

const router: RouterType = Router();

const normalizeParam = (raw: string | string[]): string => (Array.isArray(raw) ? raw[0] : raw);

// `isPlayable` is derived, never stored: a catalogue record can exist (and be selected and
// configured) before its gameplay ships, and this is what lets the host's Start button say
// "coming soon" instead of failing. `hostBlockers` is the caller's own unmet host requirements
// ("Connect your Spotify account") - null when signed out, since hosting needs an account anyway.
// Advisory only: picking and starting re-check them server-side.
const toCatalogueItem = async (game: GameEntity, userId: string | undefined) => ({
  ...game,
  isPlayable: isGamePlayable(game.slug),
  hostBlockers: userId ? await resolveHostBlockers(game, userId) : null,
});

const resolveHostBlockers = (game: GameEntity, userId: string): Promise<GameRequirementBlocker[]> =>
  game.requirements.length > 0 ? gameRequirementEvaluator.evaluate(userId, game.requirements) : Promise.resolve([]);

// Public on purpose - anyone can browse the catalogue; hosting is what requires an account.
router.get(
  '/api/games',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const games = await findPublishedGames();
    res.status(200).json(createSuccessResponse(await Promise.all(games.map((game) => toCatalogueItem(game, req.user?.sub)))));
  }),
);

router.get(
  '/api/games/:slug',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const game = await findGameBySlug(normalizeParam(req.params.slug));
    if (!game || !game.isPublished) {
      throw NotFoundError('Game not found');
    }
    res.status(200).json(createSuccessResponse(await toCatalogueItem(game, req.user?.sub)));
  }),
);

export default router;
