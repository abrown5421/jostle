import { z } from 'zod';
import {
  IntegrationAuthRevokedError,
  type OAuth2IntegrationProvider,
  type OAuthTokenSet,
} from '../../contracts/integration-provider.contract';

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const PROFILE_URL = 'https://api.spotify.com/v1/me';

// streaming + user-read-email + user-read-private are what the Web Playback SDK itself requires;
// the playback-state pair lets the host's page start/transfer playback onto its SDK device via
// the Web API; the playlist pair lets iPod War list the host's own (and collaborative) playlists.
const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
] as const;

const envSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
});

const readEnv = () =>
  envSchema.safeParse({
    SPOTIFY_CLIENT_ID: process.env['SPOTIFY_CLIENT_ID'],
    SPOTIFY_CLIENT_SECRET: process.env['SPOTIFY_CLIENT_SECRET'],
  });

const getEnv = () => {
  const result = readEnv();
  if (!result.success) throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  return result.data;
};

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
});

const profileResponseSchema = z.object({
  id: z.string(),
  display_name: z.string().nullish(),
  images: z.array(z.object({ url: z.string() })).nullish(),
  product: z.string().optional(),
  country: z.string().optional(),
});

const requestToken = async (body: Record<string, string>): Promise<z.infer<typeof tokenResponseSchema>> => {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = getEnv();
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string; error_description?: string };
    // invalid_grant = the refresh token (or code) is dead for good - revoked by the user,
    // already used, or the app was removed from their account. Anything else may be transient.
    if (error.error === 'invalid_grant') {
      throw new IntegrationAuthRevokedError(error.error_description ?? 'Spotify rejected the grant');
    }
    throw new Error(`Spotify token request failed (${response.status}): ${error.error_description ?? error.error ?? 'unknown error'}`);
  }

  return tokenResponseSchema.parse(await response.json());
};

const toTokenSet = (raw: z.infer<typeof tokenResponseSchema>, previous?: OAuthTokenSet): OAuthTokenSet => ({
  accessToken: raw.access_token,
  // Spotify only sometimes rotates the refresh token on refresh - keep the old one otherwise.
  refreshToken: raw.refresh_token ?? previous?.refreshToken,
  tokenType: raw.token_type,
  expiresAt: raw.expires_in ? Date.now() + raw.expires_in * 1000 : undefined,
  scopes: raw.scope ? raw.scope.split(' ').filter(Boolean) : (previous?.scopes ?? []),
});

export const spotifyProvider: OAuth2IntegrationProvider = {
  id: 'spotify',
  kind: 'oauth2',
  presentation: {
    displayName: 'Spotify',
    description: 'Connect your Spotify account to host music games like iPod War with your own playlists.',
    icon: 'SpotifyLogo',
    brandColor: '#1DB954',
    capabilities: [
      'Read your playlists, including collaborative ones',
      'Play music in this browser while you host',
      'See your Spotify display name and subscription tier',
    ],
    manageAccessUrl: 'https://www.spotify.com/account/apps/',
  },
  scopes: SPOTIFY_SCOPES,
  isConfigured: () => readEnv().success,
  buildAuthorizeUrl: ({ state, redirectUri }) => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: getEnv().SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES.join(' '),
      redirect_uri: redirectUri,
      state,
      // Always show Spotify's consent screen, so a user reconnecting can switch accounts
      // instead of being silently re-linked to whichever Spotify session the browser has.
      show_dialog: 'true',
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },
  exchangeCode: async ({ code, redirectUri }) =>
    toTokenSet(await requestToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })),
  refreshTokens: async (current) => {
    if (!current.refreshToken) throw new IntegrationAuthRevokedError('No Spotify refresh token stored');
    return toTokenSet(await requestToken({ grant_type: 'refresh_token', refresh_token: current.refreshToken }), current);
  },
  fetchProfile: async (accessToken) => {
    const response = await fetch(PROFILE_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(`Spotify profile request failed (${response.status})`);
    const profile = profileResponseSchema.parse(await response.json());
    return {
      id: profile.id,
      displayName: profile.display_name ?? undefined,
      imageUrl: profile.images?.[0]?.url,
      metadata: { product: profile.product, country: profile.country },
    };
  },
  // No revoke: Spotify has no token-revocation endpoint - users remove access from
  // presentation.manageAccessUrl, which the disconnect UI links to.
  describeConnection: (metadata) =>
    metadata['product'] && metadata['product'] !== 'premium'
      ? ['Spotify Premium is required to play music in the browser. You can still browse your playlists.']
      : [],
};
