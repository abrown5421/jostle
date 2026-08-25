import { decryptToken } from '../crypto/index.js';
import { findUserIntegration, updateUserIntegrationTokens } from '../db/index.js';
import { getProvider } from '../provider/index.js';

const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * Returns a valid access token for the given user + provider, transparently
 * refreshing it first when it's within REFRESH_THRESHOLD_MS of expiring.
 * Callers never need to think about token expiry themselves.
 */
export async function getValidAccessToken(
  userId: string,
  provider: string,
): Promise<string | null> {
  const integration = await findUserIntegration(userId, provider);
  if (!integration) return null;

  const isExpiringSoon =
    integration.expiresAt.getTime() <= Date.now() + REFRESH_THRESHOLD_MS;
  if (!isExpiringSoon) return decryptToken(integration.accessToken);

  const providerConfig = getProvider(provider);
  const refreshToken = decryptToken(integration.refreshToken);
  if (!providerConfig || !refreshToken) return decryptToken(integration.accessToken);

  const refreshed = await providerConfig.refreshAccessToken(refreshToken);
  const updated = await updateUserIntegrationTokens(userId, provider, refreshed);
  return updated ? decryptToken(updated.accessToken) : refreshed.accessToken;
}
