// The decrypted shape of an OAuth 2.0 provider's stored credentials - what
// IntegrationEntity.encryptedCredentials holds once opened. A future non-OAuth provider (an API
// key, say) would add its own credential shape alongside this one under a new `kind`.
export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  // Epoch ms. Absent means the provider didn't say - treated as "never expires".
  expiresAt?: number;
  scopes: string[];
}

// The linked account as the provider describes it - stored as non-secret columns on the row so
// the UI can show "Connected as …" without ever decrypting credentials.
export interface ExternalAccountProfile {
  id: string;
  displayName?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

// Everything the frontend needs to render a provider's card - served by GET /api/integrations,
// so a new provider shows up in the profile tab with zero frontend changes.
export interface IntegrationProviderPresentation {
  displayName: string;
  description: string;
  // A Phosphor icon name (see @inithium/ui's IconName) - kept a plain string here since this
  // library is server-only and must not depend on @inithium/ui.
  icon: string;
  brandColor: string;
  // Short "what connecting lets us do" bullets, shown on the card before the user connects.
  capabilities: string[];
  // Where a user can review/revoke this app's access on the provider's own site - shown on
  // disconnect, since not every provider (Spotify included) offers a token-revocation API.
  manageAccessUrl?: string;
}

export interface OAuth2IntegrationProvider {
  readonly id: string;
  readonly kind: 'oauth2';
  readonly presentation: IntegrationProviderPresentation;
  readonly scopes: readonly string[];
  // False when the deployment hasn't supplied this provider's client id/secret - the provider
  // still appears in the catalogue (as "unavailable") rather than throwing at boot.
  isConfigured: () => boolean;
  buildAuthorizeUrl: (params: { state: string; redirectUri: string }) => string;
  exchangeCode: (params: { code: string; redirectUri: string }) => Promise<OAuthTokenSet>;
  // Must keep the existing refreshToken when the provider doesn't rotate it.
  refreshTokens: (current: OAuthTokenSet) => Promise<OAuthTokenSet>;
  fetchProfile: (accessToken: string) => Promise<ExternalAccountProfile>;
  // Best-effort token revocation on disconnect, for providers that support it.
  revoke?: (tokens: OAuthTokenSet) => Promise<void>;
  // Provider-specific caveats about a linked account (e.g. "Spotify Premium is required for
  // playback"), derived from its stored, non-secret metadata.
  describeConnection?: (metadata: Record<string, unknown>) => string[];
}

// A discriminated union of one today - a new credential style (API key, ...) becomes a new
// member keyed by its own `kind`, without disturbing OAuth providers.
export type IntegrationProvider = OAuth2IntegrationProvider;

// Thrown by a provider when the remote side permanently rejects our credentials (revoked access,
// expired refresh token) - the service marks the row 'needs-reauth' instead of retrying forever.
export class IntegrationAuthRevokedError extends Error {
  constructor(message = 'The provider rejected the stored credentials') {
    super(message);
    this.name = 'IntegrationAuthRevokedError';
  }
}
