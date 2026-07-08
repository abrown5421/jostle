export interface Credentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface MediaTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
}

export interface MediaProvider {
  id: string;
  getAuthorizationUrl(userId: string): string;
  handleCallback(code: string): Promise<{ providerAccountId: string; credentials: Credentials }>;
  searchArtists(query: string, token: string): Promise<any>;
  searchPlaylists(query: string, token: string): Promise<any>;
  generateSongBank(options: { sourceIds: string[]; type: 'playlist' | 'artist'; limit: number }, token: string): Promise<MediaTrack[]>;
}