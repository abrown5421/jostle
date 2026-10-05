import { z } from 'zod';
import { IntegrationRequestError, type IntegrationResource } from '../../contracts/integration-provider.contract';

// Every Spotify Web API call this library makes (beyond OAuth itself, in spotify.provider.ts),
// each response zod-checked. Spotify has been renaming playlist fields for newer apps (`tracks` ->
// `items` on playlists, `track` -> `item` on playlist entries, /tracks -> /items), so the schemas
// below accept either spelling - keep that tolerance here, in one place.

const API_ROOT = 'https://api.spotify.com/v1';
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_AFTER_MS = 5_000;
// Generous ceilings, so a pathological library can't turn one request into hundreds.
const MAX_PLAYLISTS = 1_000;
const MAX_PLAYLIST_ENTRIES = 5_000;
// A clip needs some song to play - anything shorter is an interlude/skit, not a guessable song.
const MIN_TRACK_DURATION_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SpotifyFetchOptions {
  readonly signal?: AbortSignal;
}

const spotifyFetch = async (accessToken: string, url: string, { signal }: SpotifyFetchOptions = {}): Promise<unknown> => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url.startsWith('https://') ? url : `${API_ROOT}${url}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
    if (response.ok) return response.json();

    if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfterSeconds = Number(response.headers.get('Retry-After') ?? '1');
      await sleep(Math.min(MAX_RETRY_AFTER_MS, Math.max(0, retryAfterSeconds) * 1000));
      continue;
    }
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new IntegrationRequestError(
      response.status,
      `Spotify request failed (${response.status}): ${body.error?.message ?? response.statusText}`,
    );
  }
};

const imagesSchema = z.array(z.object({ url: z.string() })).nullish();
const countSchema = z.object({ total: z.number() }).nullish();

const playlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  collaborative: z.boolean().optional(),
  images: imagesSchema,
  owner: z.object({ id: z.string(), display_name: z.string().nullish() }).nullish(),
  tracks: countSchema,
  items: countSchema,
});

const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item.nullable()), next: z.string().nullish() });

const trackSchema = z.object({
  id: z.string().nullish(),
  uri: z.string(),
  name: z.string(),
  type: z.string().optional(),
  duration_ms: z.number(),
  is_local: z.boolean().optional(),
  is_playable: z.boolean().optional(),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({ name: z.string(), images: imagesSchema }).nullish(),
});

// A playlist entry's payload is `track` (classic) or `item` (renamed); either may be an episode,
// which fails trackSchema's shape or `type` check and is skipped.
const playlistEntrySchema = z.object({
  is_local: z.boolean().optional(),
  track: z.unknown().optional(),
  item: z.unknown().optional(),
});

// Follows `next` links until done or `limit` items have been gathered.
const collectPages = async <T extends z.ZodTypeAny>(
  accessToken: string,
  firstUrl: string,
  item: T,
  limit: number,
  options?: SpotifyFetchOptions,
): Promise<z.infer<T>[]> => {
  const schema = pageSchema(item);
  const collected: z.infer<T>[] = [];
  let url: string | null | undefined = firstUrl;
  while (url && collected.length < limit) {
    const page = schema.parse(await spotifyFetch(accessToken, url, options));
    page.items.forEach((entry) => {
      if (entry !== null) collected.push(entry);
    });
    url = page.next;
  }
  return collected.slice(0, limit);
};

// The current user's playlists (owned, collaborative, and followed). Only ones they own or
// collaborate on are selectable: Spotify refuses newer apps access to the contents of playlists it
// curates, and someone else's playlist can change or vanish mid-game.
export const listSpotifyPlaylists = async (
  accessToken: string,
  account: { externalAccountId: string },
): Promise<IntegrationResource[]> => {
  const playlists = await collectPages(accessToken, '/me/playlists?limit=50', playlistSchema, MAX_PLAYLISTS);
  return playlists.map((playlist) => {
    const isUsable = playlist.owner?.id === account.externalAccountId || playlist.collaborative === true;
    return {
      id: playlist.id,
      name: playlist.name,
      imageUrl: playlist.images?.[0]?.url,
      itemCount: playlist.tracks?.total ?? playlist.items?.total ?? 0,
      ownerName: playlist.owner?.display_name ?? undefined,
      selectable: isUsable,
      unselectableReason: isUsable ? undefined : 'Only playlists you own or collaborate on can be used',
    };
  });
};

export interface SpotifyPlaylistSummary {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string;
}

export const getSpotifyPlaylistSummary = async (
  accessToken: string,
  playlistId: string,
  options?: SpotifyFetchOptions,
): Promise<SpotifyPlaylistSummary> => {
  const playlist = playlistSchema.parse(
    await spotifyFetch(accessToken, `/playlists/${encodeURIComponent(playlistId)}?fields=id,name,images`, options),
  );
  return { id: playlist.id, name: playlist.name, imageUrl: playlist.images?.[0]?.url };
};

export interface SpotifyTrack {
  readonly id: string;
  readonly uri: string;
  readonly name: string;
  readonly artists: readonly string[];
  readonly album: string;
  readonly albumImageUrl?: string;
  readonly durationMs: number;
}

const toPlayableTrack = (entry: z.infer<typeof playlistEntrySchema>): SpotifyTrack | null => {
  if (entry.is_local) return null;
  const parsed = trackSchema.safeParse(entry.track ?? entry.item);
  if (!parsed.success) return null;
  const track = parsed.data;
  if (!track.id || track.is_local || (track.type && track.type !== 'track')) return null;
  // Only present with a market (we always send market=from_token) - false means not playable in
  // the host's country.
  if (track.is_playable === false || track.duration_ms < MIN_TRACK_DURATION_MS) return null;
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: track.artists.map(({ name }) => name),
    album: track.album?.name ?? '',
    albumImageUrl: track.album?.images?.[0]?.url,
    durationMs: track.duration_ms,
  };
};

// Every playable song in a playlist, de-duplicated - local files, podcast episodes, songs
// unavailable in the host's market, and very short tracks are dropped.
export const fetchSpotifyPlaylistTracks = async (
  accessToken: string,
  playlistId: string,
  options?: SpotifyFetchOptions,
): Promise<SpotifyTrack[]> => {
  const path = `/playlists/${encodeURIComponent(playlistId)}`;
  const query = '?limit=50&market=from_token';
  let entries: z.infer<typeof playlistEntrySchema>[];
  try {
    entries = await collectPages(accessToken, `${path}/items${query}`, playlistEntrySchema, MAX_PLAYLIST_ENTRIES, options);
  } catch (error) {
    // Older API surface - /items not available to this app yet, so fall back to /tracks.
    if (!(error instanceof IntegrationRequestError) || error.status !== 404) throw error;
    entries = await collectPages(accessToken, `${path}/tracks${query}`, playlistEntrySchema, MAX_PLAYLIST_ENTRIES, options);
  }

  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    const track = toPlayableTrack(entry);
    if (!track || seen.has(track.id)) return [];
    seen.add(track.id);
    return [track];
  });
};
