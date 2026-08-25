export interface SpotifyPlaylistSummary {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly ownerId: string;
  readonly trackCount: number;
}
