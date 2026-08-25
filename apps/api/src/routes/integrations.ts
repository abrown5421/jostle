import { getUserForSessionToken } from '@jostle/auth';
import {
  beginConnection,
  consumeConnectionAttempt,
  finalizeConnection,
  getIntegrationStatuses,
  removeIntegration,
  UnknownProviderError,
} from '@jostle/integrations';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { SESSION_COOKIE } from './auth.js';

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const user = await getUserForSessionToken(token);
  return user?.id ?? null;
}

function firstQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// Provider ids are registered in uppercase (e.g. 'SPOTIFY', matching the
// stored document's `provider` field), but the URL segment stays lowercase
// since it's baked into the redirect URI registered with the provider
// (e.g. Spotify's allow-listed `/auth/spotify/callback`) and reads better
// in a path. Normalize once at the boundary rather than case-matching
// everywhere downstream.
function normalizeProviderParam(rawProvider: string): string {
  return rawProvider.toUpperCase();
}

export const integrationsOAuthRouter = Router();

integrationsOAuthRouter.get('/:provider/connect', async (req, res) => {
  const provider = normalizeProviderParam(req.params.provider as string);
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.redirect(`${WEB_ORIGIN}/login`);
    return;
  }

  try {
    const authorizationUrl = await beginConnection(userId, provider);
    res.redirect(authorizationUrl);
  } catch (error) {
    if (error instanceof UnknownProviderError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
});

integrationsOAuthRouter.get('/:provider/callback', async (req, res) => {
  const provider = normalizeProviderParam(req.params.provider as string);
  const state = firstQueryValue(req.query.state);
  const code = firstQueryValue(req.query.code);
  const oauthError = firstQueryValue(req.query.error);

  if (!state) {
    res.redirect(`${WEB_ORIGIN}/login`);
    return;
  }

  const attempt = await consumeConnectionAttempt(state, provider);
  if (!attempt) {
    res.redirect(`${WEB_ORIGIN}/login`);
    return;
  }

  const redirectToProfile = (status: 'connected' | 'error', reason?: string) => {
    const params = new URLSearchParams({ integrationStatus: status, provider });
    if (reason) params.set('reason', reason);
    res.redirect(`${WEB_ORIGIN}/profile/${attempt.userId}?${params.toString()}`);
  };

  if (oauthError || !code) {
    redirectToProfile('error', oauthError ?? 'missing_code');
    return;
  }

  try {
    await finalizeConnection(attempt.userId, provider, code, attempt.codeVerifier);
    redirectToProfile('connected');
  } catch (error) {
    console.error('Integration connection failed', error);
    redirectToProfile('error', 'connection_failed');
  }
});

export const integrationsApiRouter = Router();

async function requireAuthenticatedUserId(
  req: Request,
  res: Response,
): Promise<string | null> {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  return userId;
}

integrationsApiRouter.get('/', async (req, res) => {
  const userId = await requireAuthenticatedUserId(req, res);
  if (!userId) return;

  const integrations = await getIntegrationStatuses(userId);
  res.json({ integrations });
});

integrationsApiRouter.delete('/:provider', async (req, res) => {
  const userId = await requireAuthenticatedUserId(req, res);
  if (!userId) return;

  await removeIntegration(userId, normalizeProviderParam(req.params.provider as string));
  res.status(204).end();
});
