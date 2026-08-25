import {
  createConnectionAttempt,
  deleteUserIntegration,
  listUserIntegrations,
  upsertUserIntegration,
} from '../db/index.js';
import {
  toPublicConnectedIntegration,
  toPublicUnconnectedIntegration,
} from '../model/index.js';
import type { PublicIntegrationStatus } from '../model/index.js';
import { buildAuthorizationUrl, deriveCodeChallenge } from '../oauth/index.js';
import { getProvider, listProviders } from '../provider/index.js';

export class UnknownProviderError extends Error {
  constructor(provider: string) {
    super(`No integration provider registered for "${provider}"`);
    this.name = 'UnknownProviderError';
  }
}

export async function beginConnection(
  userId: string,
  providerId: string,
): Promise<string> {
  const provider = getProvider(providerId);
  if (!provider) throw new UnknownProviderError(providerId);

  const { state, codeVerifier } = await createConnectionAttempt(userId, providerId);

  return buildAuthorizationUrl({
    authorizationEndpoint: provider.authorizationEndpoint,
    clientId: provider.clientId,
    redirectUri: provider.buildRedirectUri(),
    scopes: provider.scopes,
    state,
    codeChallenge: deriveCodeChallenge(codeVerifier),
  });
}

/**
 * Exchanges a callback's authorization code for tokens and stores the
 * connection. Assumes the caller has already resolved `userId` and
 * `codeVerifier` from the connection attempt via `consumeConnectionAttempt`
 * — kept separate so a route handler still has `userId` on hand to build a
 * same-user redirect even if this step fails.
 */
export async function finalizeConnection(
  userId: string,
  providerId: string,
  code: string,
  codeVerifier: string,
): Promise<void> {
  const provider = getProvider(providerId);
  if (!provider) throw new UnknownProviderError(providerId);

  const tokens = await provider.exchangeAuthorizationCode(code, codeVerifier);
  const profile = await provider.fetchProfile(tokens.accessToken);
  await upsertUserIntegration(userId, providerId, tokens, profile);
}

export async function getIntegrationStatuses(
  userId: string,
): Promise<PublicIntegrationStatus[]> {
  const integrations = await listUserIntegrations(userId);
  const integrationByProvider = new Map(
    integrations.map((integration) => [integration.provider, integration]),
  );

  return listProviders().map((provider) => {
    const providerInfo = {
      displayName: provider.displayName,
      logoUrl: provider.logoUrl,
    };
    const integration = integrationByProvider.get(provider.id);
    return integration
      ? toPublicConnectedIntegration(integration, providerInfo)
      : toPublicUnconnectedIntegration(provider.id, providerInfo);
  });
}

export async function removeIntegration(
  userId: string,
  providerId: string,
): Promise<void> {
  await deleteUserIntegration(userId, providerId);
}
