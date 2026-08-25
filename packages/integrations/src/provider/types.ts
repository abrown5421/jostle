export interface OAuthTokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scopes: string[];
}

export interface ProviderProfile {
  providerAccountId: string;
  metadata: Record<string, unknown>;
}

export interface IntegrationProviderConfig {
  id: string;
  displayName: string;
  logoUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  buildRedirectUri: () => string;
  exchangeAuthorizationCode: (
    code: string,
    codeVerifier: string,
  ) => Promise<OAuthTokenResult>;
  refreshAccessToken: (refreshToken: string) => Promise<OAuthTokenResult>;
  fetchProfile: (accessToken: string) => Promise<ProviderProfile>;
}
