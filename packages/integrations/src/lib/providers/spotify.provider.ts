import { MediaProvider, Credentials, MediaTrack } from '@inithium/types';
import querystring from 'querystring';

export class SpotifyProvider implements MediaProvider {
  readonly id = 'spotify';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string
  ) {}

  getAuthorizationUrl(userId: string): string {
    return 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: this.clientId,
        scope: 'user-read-private user-read-email playlist-read-private',
        redirect_uri: this.redirectUri,
        state: userId
      });
  }

  async handleCallback(code: string): Promise<{ providerAccountId: string; credentials: Credentials }> {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
      },
      body: querystring.stringify({
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json() as any;
    if (tokenData && tokenData.error) throw new Error(tokenData.error_description);

    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileResponse.json() as any;

    return {
      providerAccountId: profileData.id,
      credentials: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      }
    };
  }

  async searchArtists(query: string, token: string): Promise<any> {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }

  async searchPlaylists(query: string, token: string): Promise<any> {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }

  async generateSongBank(options: { sourceIds: string[]; type: 'playlist' | 'artist'; limit: number }, token: string): Promise<MediaTrack[]> {
    if (options.type === 'playlist') {
      const playlistId = options.sourceIds[0];
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json() as any;
      
      return (data?.items || [])
        .map(({ track }: any) => ({
          id: track.id,
          title: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          album: track.album.name,
          durationMs: track.duration_ms
        }))
        .sort(() => 0.5 - Math.random())
        .slice(0, options.limit);
    }
    return [];
  }
}