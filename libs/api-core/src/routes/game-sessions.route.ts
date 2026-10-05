import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import {
  asyncHandler,
  createSuccessResponse,
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@inithium/api-utils';
import { optionalAuth, requireAuth } from '@inithium/auth';
import { getUserRepository } from '@inithium/db';
import { findHostedSession, hostSession, isGameSessionError, joinSession } from '@inithium/game-session';
import type { GameSessionError } from '@inithium/game-session';
import { joinGameSessionSchema } from '../schemas/game-sessions.schema';

const router: RouterType = Router();

const normalizeParam = (raw: string | string[]): string => (Array.isArray(raw) ? raw[0] : raw);

const toAppError = (error: GameSessionError): AppError => {
  switch (error.code) {
    case 'SESSION_NOT_FOUND':
    case 'PARTICIPANT_NOT_FOUND':
    case 'GAME_NOT_FOUND':
      return NotFoundError(error.message, { code: error.code });
    case 'NOT_AUTHORIZED':
    case 'REQUIREMENTS_NOT_MET':
      return ForbiddenError(error.message, { code: error.code, ...error.details });
    case 'INVALID_NAME':
    case 'INVALID_ACTION':
    case 'INVALID_PLAYER_COUNT':
    case 'INVALID_SETTINGS':
    case 'SETTING_REQUIRED':
      return ValidationError(error.message, { code: error.code });
    default:
      return ConflictError(error.message, { code: error.code });
  }
};

// `details.code` carries the GameSessionErrorCode so the join screen can pin the message to the
// right field (NAME_TAKEN -> name input, SESSION_NOT_FOUND -> code input).
const rethrowAsAppError = (error: unknown): never => {
  throw isGameSessionError(error) ? toAppError(error) : error;
};

// Hosting requires an account; the returned hostToken is what the host screen's socket uses.
router.post(
  '/api/game-sessions',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const hosted = await hostSession(req.user!.sub).catch(rethrowAsAppError);
    res.status(200).json(createSuccessResponse(hosted));
  }),
);

// The caller's live hosted session, or null - never creates one (that's the POST above). 200 with
// null rather than a 404, since "not hosting right now" is the normal case, not an error.
router.get(
  '/api/game-sessions/mine',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(createSuccessResponse(await findHostedSession(req.user!.sub)));
  }),
);

// Open to guests - optionalAuth only attaches the account (if any) to the seat.
router.post(
  '/api/game-sessions/:code/join',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = joinGameSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ValidationError('Invalid request body', parsed.error.flatten());
    }
    const userId = req.user?.sub ?? null;
    // Snapshotted onto the seat so every screen can render it without a per-player user lookup.
    // A signed-in player always gets their saved profile avatar - any avatar in the body is only
    // a guest's randomized pick from the join page.
    const user = userId ? await getUserRepository().findById(userId) : null;
    const joined = await joinSession(normalizeParam(req.params.code), {
      name: parsed.data.name,
      userId,
      avatar: user ? user.avatar : (parsed.data.avatar ?? null),
      rejoinToken: parsed.data.rejoinToken,
    }).catch(rethrowAsAppError);
    res.status(201).json(createSuccessResponse(joined));
  }),
);

export default router;
