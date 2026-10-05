import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { asyncHandler, createSuccessResponse, NotFoundError, ValidationError } from '@inithium/api-utils';
import { requireAuth } from '@inithium/auth';
import {
  beginIntegrationAuthorization,
  completeIntegrationAuthorization,
  disconnectIntegration,
  getIntegrationAccessToken,
  listUserIntegrations,
} from '@inithium/integrations';
import { beginIntegrationAuthorizationSchema } from '../schemas/integrations.schema';

const router: RouterType = Router();

const normalizeParam = (raw: string | string[]): string => (Array.isArray(raw) ? raw[0] : raw);
const readQueryString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

// Every route here is scoped to the caller's own integrations (req.user.sub) - there's no way to
// read or act on another user's linked accounts, admin or not.

// The provider catalogue merged with the caller's own connections - drives the profile tab.
router.get(
  '/api/integrations',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(createSuccessResponse(await listUserIntegrations(req.user!.sub)));
  }),
);

router.post(
  '/api/integrations/:provider/authorize',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = beginIntegrationAuthorizationSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw ValidationError('Invalid request body', parsed.error.flatten());
    }
    const result = beginIntegrationAuthorization(req.user!.sub, normalizeParam(req.params.provider), parsed.data.returnTo);
    res.status(200).json(createSuccessResponse(result));
  }),
);

// Unauthenticated on purpose: this is the provider redirecting the user's browser back here, which
// carries no Bearer token. The signed `state` (issued by /authorize above to an authenticated
// caller) is what identifies the user - see integrationSecrets.ts's signOAuthState.
router.get(
  '/api/integrations/:provider/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const redirectUrl = await completeIntegrationAuthorization(normalizeParam(req.params.provider), {
      code: readQueryString(req.query['code']),
      state: readQueryString(req.query['state']),
      error: readQueryString(req.query['error']),
    });
    res.redirect(302, redirectUrl);
  }),
);

// A fresh access token for the caller's own linked account - for browser-side SDKs that need one
// directly (Spotify's Web Playback SDK calls getOAuthToken repeatedly). Refreshed transparently.
router.get(
  '/api/integrations/:provider/token',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const token = await getIntegrationAccessToken(req.user!.sub, normalizeParam(req.params.provider));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(createSuccessResponse(token));
  }),
);

router.delete(
  '/api/integrations/:provider',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const removed = await disconnectIntegration(req.user!.sub, normalizeParam(req.params.provider));
    if (!removed) {
      throw NotFoundError('Integration not connected');
    }
    res.status(204).send();
  }),
);

export default router;
