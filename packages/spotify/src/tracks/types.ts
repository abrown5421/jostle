export interface SpotifyTrackSummary {
  readonly uri: string;
  readonly id: string;
  readonly name: string;
  readonly artists: ReadonlyArray<string>;
  readonly albumName: string;
  readonly albumImageUrl: string | null;
  readonly durationMs: number;
}
