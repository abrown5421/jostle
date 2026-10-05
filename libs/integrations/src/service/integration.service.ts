import { AppError, NotFoundError } from '@inithium/api-utils';
import {
  deleteIntegration,
  findIntegrationForUser,
  listIntegrationsForUser,
  updateIntegrationCredentials,
  updateIntegrationStatus,
  upsertIntegration,
} from '@inithium/db';
import type { IntegrationEntity, IntegrationStatus } from '@inithium/db';
import {
  IntegrationAuthRevokedError,
  IntegrationRequestError,
  type IntegrationProvider,
  type IntegrationResource,
  type OAuthTokenSet,
} from '../contracts/integration-provider.contract';
import {
  areIntegrationSecretsConfigured,
  decryptCredentials,
  encryptCredentials,
  signOAuthState,
  verifyOAuthState,
} from '../crypto/integrationSecrets';
import { getIntegrationProvider, listIntegrationProviders } from '../providers/registry';

// Refresh this long before the provider's stated expiry, so a token handed to a caller (e.g. the
// Web Playback SDK) never dies mid-request.
const REFRESH_SKEW_MS = 60_000;

// The API's own externally reachable origin - the OAuth redirect URI every provider app must have
// registered, verbatim. Spotify no longer accepts "localhost" redirect URIs, only loopback IPs or
// HTTPS, hence 127.0.0.1 rather than localhost as the dev default.
const getApiPublicUrl = (): string =>
  (process.env['API_PUBLIC_URL'] || `http://127.0.0.1:${process.env['PORT'] || 3000}`).replace(/\/+$/, '');

// Same default as main.ts's own CORS origin - the SPA the callback sends the browser back to.
const getWebOrigin = (): string => new URL(process.env['WEB_ORIGIN'] || 'http://localhost:5173').origin;

export const buildIntegrationRedirectUri = (providerId: string): string =>
  `${getApiPublicUrl()}/api/integrations/${encodeURIComponent(providerId)}/callback`;

export type IntegrationCallbackResult = 'connected' | 'cancelled' | 'error';

export interface IntegrationConnectionSummary {
  status: IntegrationStatus;
  externalAccountId: string;
  externalAccountName?: string;
  externalAccountImageUrl?: string;
  scopes: string[];
  connectedAt: Date;
  updatedAt: Date;
  notices: string[];
}

// The client-facing contract for one provider: its presentation, whether this deployment can
// actually use it, and the caller's own connection (never its credentials).
export interface IntegrationCatalogEntry {
  provider: string;
  kind: IntegrationProvider['kind'];
  displayName: string;
  description: string;
  icon: string;
  brandColor: string;
  capabilities: string[];
  manageAccessUrl?: string;
  isAvailable: boolean;
  connection: IntegrationConnectionSummary | null;
}

export interface IntegrationAccessToken {
  accessToken: string;
  tokenType: string;
  expiresAt?: number;
  scopes: string[];
}

const isProviderAvailable = (provider: IntegrationProvider): boolean =>
  areIntegrationSecretsConfigured() && provider.isConfigured();

const requireProvider = (providerId: string): IntegrationProvider => {
  const provider = getIntegrationProvider(providerId);
  if (!provider) throw NotFoundError(`Unknown integration "${providerId}"`);
  return provider;
};

const requireAvailableProvider = (providerId: string): IntegrationProvider => {
  const provider = requireProvider(providerId);
  if (!isProviderAvailable(provider)) {
    throw new AppError(503, 'INTEGRATION_UNAVAILABLE', `${provider.presentation.displayName} isn't configured on this server`);
  }
  return provider;
};

const toConnectionSummary = (provider: IntegrationProvider, entity: IntegrationEntity): IntegrationConnectionSummary => ({
  status: entity.status,
  externalAccountId: entity.externalAccountId,
  externalAccountName: entity.externalAccountName,
  externalAccountImageUrl: entity.externalAccountImageUrl,
  scopes: entity.scopes,
  connectedAt: entity.connectedAt,
  updatedAt: entity.updatedAt,
  notices: provider.describeConnection?.(entity.metadata) ?? [],
});

// Only same-origin relative paths - never "//evil.com" or "/\evil.com", which browsers resolve
// as protocol-relative - so the callback can't be turned into an open redirect.
const sanitizeReturnTo = (raw: string | undefined): string =>
  raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/';

const buildReturnUrl = (
  returnTo: string,
  providerId: string,
  result: IntegrationCallbackResult,
  errorCode?: string,
): string => {
  const webOrigin = getWebOrigin();
  const url = new URL(sanitizeReturnTo(returnTo), webOrigin);
  if (url.origin !== webOrigin) return webOrigin;
  url.searchParams.set('integration', providerId);
  url.searchParams.set('integrationResult', result);
  if (errorCode) url.searchParams.set('integrationError', errorCode);
  return url.toString();
};

export const listUserIntegrations = async (userId: string): Promise<IntegrationCatalogEntry[]> => {
  const rows = await listIntegrationsForUser(userId);
  const byProvider = new Map(rows.map((row) => [row.provider, row]));

  return listIntegrationProviders().map((provider) => {
    const row = byProvider.get(provider.id);
    return {
      provider: provider.id,
      kind: provider.kind,
      ...provider.presentation,
      isAvailable: isProviderAvailable(provider),
      connection: row ? toConnectionSummary(provider, row) : null,
    };
  });
};

// Step 1 of the OAuth dance, called by an authenticated XHR - the SPA then navigates the browser
// to the returned URL itself (a plain navigation can't carry this app's Bearer token).
export const beginIntegrationAuthorization = (
  userId: string,
  providerId: string,
  returnTo: string | undefined,
): { authorizeUrl: string } => {
  const provider = requireAvailableProvider(providerId);
  const state = signOAuthState({ userId, provider: provider.id, returnTo: sanitizeReturnTo(returnTo) });
  return { authorizeUrl: provider.buildAuthorizeUrl({ state, redirectUri: buildIntegrationRedirectUri(provider.id) }) };
};

// Step 2: the provider redirects the browser here. Never throws - every outcome becomes a redirect
// back into the SPA carrying integration/integrationResult/integrationError query params, since
// there's no JSON client on the other end to read an error response.
export const completeIntegrationAuthorization = async (
  providerId: string,
  params: { code?: string; state?: string; error?: string },
): Promise<string> => {
  let userId: string;
  let returnTo: string;
  try {
    if (!params.state) throw new Error('Missing state');
    const state = verifyOAuthState(params.state);
    if (state.provider !== providerId) throw new Error('State/provider mismatch');
    userId = state.userId;
    returnTo = state.returnTo;
  } catch {
    return buildReturnUrl('/', providerId, 'error', 'invalid_state');
  }

  if (params.error) {
    return buildReturnUrl(returnTo, providerId, params.error === 'access_denied' ? 'cancelled' : 'error', params.error);
  }
  if (!params.code) return buildReturnUrl(returnTo, providerId, 'error', 'missing_code');

  try {
    const provider = requireAvailableProvider(providerId);
    const tokens = await provider.exchangeCode({ code: params.code, redirectUri: buildIntegrationRedirectUri(provider.id) });
    const profile = await provider.fetchProfile(tokens.accessToken);

    await upsertIntegration({
      userId,
      provider: provider.id,
      externalAccountId: profile.id,
      externalAccountName: profile.displayName,
      externalAccountImageUrl: profile.imageUrl,
      scopes: tokens.scopes,
      encryptedCredentials: encryptCredentials(tokens),
      credentialsExpireAt: tokens.expiresAt ? new Date(tokens.expiresAt) : undefined,
      metadata: profile.metadata,
    });
    return buildReturnUrl(returnTo, providerId, 'connected');
  } catch (error) {
    console.error(`[integrations] ${providerId} callback failed:`, error);
    return buildReturnUrl(returnTo, providerId, 'error', 'exchange_failed');
  }
};

// Concurrent callers for the same user+provider (e.g. the SDK's getOAuthToken firing alongside a
// playlist fetch) share one in-flight refresh instead of racing - a rotated refresh token would
// otherwise invalidate the loser's request. Per-process only; fine for a single API instance.
const inFlightRefreshes = new Map<string, Promise<OAuthTokenSet>>();

const refreshAndPersist = async (provider: IntegrationProvider, entity: IntegrationEntity): Promise<OAuthTokenSet> => {
  const key = `${entity.userId}:${provider.id}`;
  const existing = inFlightRefreshes.get(key);
  if (existing) return existing;

  const refresh = (async () => {
    const current = decryptCredentials<OAuthTokenSet>(entity.encryptedCredentials);
    try {
      const next = await provider.refreshTokens(current);
      // Best effort: re-read the account's facts while we hold a fresh token, so a change on the
      // provider's side (Spotify Free -> Premium) reaches stored metadata without a reconnect.
      const profile = await provider.fetchProfile(next.accessToken).catch(() => null);
      await updateIntegrationCredentials(entity.userId, provider.id, {
        encryptedCredentials: encryptCredentials(next),
        credentialsExpireAt: next.expiresAt ? new Date(next.expiresAt) : undefined,
        scopes: next.scopes,
        metadata: profile?.metadata,
      });
      return next;
    } catch (error) {
      if (error instanceof IntegrationAuthRevokedError) {
        await updateIntegrationStatus(entity.userId, provider.id, 'needs-reauth');
        throw new AppError(
          409,
          'INTEGRATION_REAUTH_REQUIRED',
          `Your ${provider.presentation.displayName} connection has expired. Reconnect it from your profile.`,
        );
      }
      throw error;
    }
  })();

  inFlightRefreshes.set(key, refresh);
  try {
    return await refresh;
  } finally {
    inFlightRefreshes.delete(key);
  }
};

// The one way any server code (an iPod War playlist fetch, ...) or the host's browser (via
// GET /api/integrations/:provider/token, for the Web Playback SDK) obtains a usable access token
// on a user's behalf - transparently refreshed when it's expired or about to be.
export const getIntegrationAccessToken = async (
  userId: string,
  providerId: string,
  // Refresh even if the stored token looks fresh - for a caller whose request was just refused
  // with it (revoked early, clock skew).
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<IntegrationAccessToken> => {
  const provider = requireAvailableProvider(providerId);
  const entity = await findIntegrationForUser(userId, provider.id);
  if (!entity) throw NotFoundError(`${provider.presentation.displayName} isn't connected`);
  if (entity.status === 'needs-reauth') {
    throw new AppError(
      409,
      'INTEGRATION_REAUTH_REQUIRED',
      `Your ${provider.presentation.displayName} connection has expired. Reconnect it from your profile.`,
    );
  }

  let tokens = decryptCredentials<OAuthTokenSet>(entity.encryptedCredentials);
  if (forceRefresh || (tokens.expiresAt !== undefined && tokens.expiresAt - REFRESH_SKEW_MS <= Date.now())) {
    tokens = await refreshAndPersist(provider, entity);
  }

  return { accessToken: tokens.accessToken, tokenType: tokens.tokenType, expiresAt: tokens.expiresAt, scopes: tokens.scopes };
};

// Runs `request` with a user's access token, refreshing and retrying once if the provider says the
// token is no good (401) - so server-side callers never have to think about token lifetimes.
export const withIntegrationAccessToken = async <T>(
  userId: string,
  providerId: string,
  request: (accessToken: string) => Promise<T>,
): Promise<T> => {
  const { accessToken } = await getIntegrationAccessToken(userId, providerId);
  try {
    return await request(accessToken);
  } catch (error) {
    if (!(error instanceof IntegrationRequestError) || error.status !== 401) throw error;
    const refreshed = await getIntegrationAccessToken(userId, providerId, { forceRefresh: true });
    return request(refreshed.accessToken);
  }
};

// One thing a feature needs from a user's integrations (e.g. a game's host requirement).
export interface IntegrationRequirement {
  readonly provider: string;
  readonly capabilities?: readonly string[];
}

const describeUnmetRequirement = (requirement: IntegrationRequirement, entity: IntegrationEntity | undefined): string | null => {
  const provider = getIntegrationProvider(requirement.provider);
  if (!provider) return `"${requirement.provider}" isn't a supported integration.`;
  const name = provider.presentation.displayName;
  if (!isProviderAvailable(provider)) return `${name} isn't set up on this server yet.`;
  if (!entity) return `Connect your ${name} account to host this game.`;
  if (entity.status === 'needs-reauth') return `Your ${name} connection has expired - reconnect it to host this game.`;
  for (const capability of requirement.capabilities ?? []) {
    const reason = provider.evaluateCapability
      ? provider.evaluateCapability(capability, entity.metadata)
      : `${name} can't provide "${capability}".`;
    if (reason) return reason;
  }
  return null;
};

// For each requirement, null if the user meets it, otherwise a user-facing reason they don't.
// Reads the user's integrations once, however many requirements there are.
export const evaluateIntegrationRequirements = async (
  userId: string,
  requirements: readonly IntegrationRequirement[],
): Promise<(string | null)[]> => {
  if (requirements.length === 0) return [];
  const rows = await listIntegrationsForUser(userId);
  const byProvider = new Map(rows.map((row) => [row.provider, row]));
  return requirements.map((requirement) => describeUnmetRequirement(requirement, byProvider.get(requirement.provider)));
};

// One of a user's resource lists at a provider (their Spotify playlists, ...) for a picker.
export const listIntegrationResources = async (
  userId: string,
  providerId: string,
  resource: string,
): Promise<IntegrationResource[]> => {
  const provider = requireAvailableProvider(providerId);
  const source = provider.resources?.[resource];
  if (!source) throw NotFoundError(`${provider.presentation.displayName} has no "${resource}" list`);
  const entity = await findIntegrationForUser(userId, provider.id);
  if (!entity) throw NotFoundError(`${provider.presentation.displayName} isn't connected`);
  return withIntegrationAccessToken(userId, provider.id, (accessToken) =>
    source.list(accessToken, { externalAccountId: entity.externalAccountId }),
  );
};

export const disconnectIntegration = async (userId: string, providerId: string): Promise<boolean> => {
  const provider = requireProvider(providerId);
  const entity = await findIntegrationForUser(userId, provider.id);
  if (!entity) return false;

  if (provider.revoke && areIntegrationSecretsConfigured()) {
    try {
      await provider.revoke(decryptCredentials<OAuthTokenSet>(entity.encryptedCredentials));
    } catch (error) {
      // Best effort - the local link is removed regardless, and the user can still revoke on the
      // provider's own site (presentation.manageAccessUrl).
      console.warn(`[integrations] ${providerId} revoke failed:`, error);
    }
  }

  return deleteIntegration(userId, provider.id);
};
