import { getJsonWithBearerToken, postFormEncoded } from '../oauth/index.js';
import { registerProvider } from '../provider/index.js';
import type {
  IntegrationProviderConfig,
  OAuthTokenResult,
  ProviderProfile,
} from '../provider/index.js';

const AUTHORIZATION_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const PROFILE_ENDPOINT = 'https://api.spotify.com/v1/me';

const SCOPES = ['user-read-email', 'user-read-private'];

const SPOTIFY_LOGO_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.32 9.719-.66 13.439 1.621.361.181.54.78.301 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
  );

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

function buildRedirectUri(): string {
  const apiOrigin = process.env.API_ORIGIN || 'http://127.0.0.1:3333';
  return `${apiOrigin}/auth/spotify/callback`;
}

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

function toOAuthTokenResult(response: SpotifyTokenResponse): OAuthTokenResult {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? null,
    expiresAt: new Date(Date.now() + response.expires_in * 1000),
    scopes: response.scope.split(' ').filter(Boolean),
  };
}

async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
): Promise<OAuthTokenResult> {
  const response = await postFormEncoded<SpotifyTokenResponse>({
    endpoint: TOKEN_ENDPOINT,
    params: {
      grant_type: 'authorization_code',
      code,
      redirect_uri: buildRedirectUri(),
      code_verifier: codeVerifier,
    },
    basicAuth: {
      username: getRequiredEnv('SPOTIFY_CLIENT_ID'),
      password: getRequiredEnv('SPOTIFY_CLIENT_SECRET'),
    },
  });
  return toOAuthTokenResult(response);
}

async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResult> {
  const response = await postFormEncoded<SpotifyTokenResponse>({
    endpoint: TOKEN_ENDPOINT,
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    basicAuth: {
      username: getRequiredEnv('SPOTIFY_CLIENT_ID'),
      password: getRequiredEnv('SPOTIFY_CLIENT_SECRET'),
    },
  });
  const result = toOAuthTokenResult(response);
  return result.refreshToken ? result : { ...result, refreshToken };
}

interface SpotifyProfileResponse {
  id: string;
  display_name: string | null;
  email: string;
  images?: { url: string }[];
  product?: string;
}

async function fetchProfile(accessToken: string): Promise<ProviderProfile> {
  const profile = await getJsonWithBearerToken<SpotifyProfileResponse>(
    PROFILE_ENDPOINT,
    accessToken,
  );
  return {
    providerAccountId: profile.id,
    metadata: {
      displayName: profile.display_name ?? profile.id,
      email: profile.email,
      profileImageUrl: profile.images?.[0]?.url ?? null,
      product: profile.product ?? null,
    },
  };
}

export const spotifyProvider: IntegrationProviderConfig = {
  id: 'SPOTIFY',
  displayName: 'Spotify',
  logoUrl: SPOTIFY_LOGO_URL,
  scopes: SCOPES,
  get clientId() {
    return getRequiredEnv('SPOTIFY_CLIENT_ID');
  },
  get clientSecret() {
    return getRequiredEnv('SPOTIFY_CLIENT_SECRET');
  },
  authorizationEndpoint: AUTHORIZATION_ENDPOINT,
  tokenEndpoint: TOKEN_ENDPOINT,
  buildRedirectUri,
  exchangeAuthorizationCode,
  refreshAccessToken,
  fetchProfile,
};

export function registerSpotifyProvider(): void {
  registerProvider(spotifyProvider);
}
