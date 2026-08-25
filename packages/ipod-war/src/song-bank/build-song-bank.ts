import { getValidAccessToken } from '@jostle/integrations';
import { listPlaylistTracks } from '@jostle/spotify';
import { buildAggregatedPlaylistOptions } from './aggregate-playlists.js';
import { shuffle } from './shuffle.js';
import { InsufficientSongsError, NoPlaylistSelectedError, SPOTIFY_PROVIDER_ID } from '../model/index.js';
import type { IpodWarConfig, IpodWarSongBankEntry } from '../model/index.js';

export interface BuildSongBankInput {
  readonly sessionId: string;
  readonly config: IpodWarConfig;
}

export async function buildSongBank(
  input: BuildSongBankInput,
): Promise<IpodWarSongBankEntry[]> {
  const options = await buildAggregatedPlaylistOptions(input.sessionId);
  const selected = options.find((option) => option.playlistId === input.config.selectedPlaylistId);
  if (!selected) throw new NoPlaylistSelectedError();

  const accessToken = await getValidAccessToken(selected.contributedByUserId, SPOTIFY_PROVIDER_ID);
  if (!accessToken) throw new NoPlaylistSelectedError();

  const tracks = await listPlaylistTracks(accessToken, selected.playlistId);
  if (tracks.length < input.config.songCount) {
    throw new InsufficientSongsError(tracks.length, input.config.songCount);
  }

  const picked = shuffle(tracks).slice(0, input.config.songCount);

  return picked.map((track) => ({
    trackUri: track.uri,
    trackId: track.id,
    trackName: track.name,
    artistNames: track.artists,
    albumName: track.albumName,
    albumImageUrl: track.albumImageUrl,
    durationMs: track.durationMs,
    contributedByUserId: selected.contributedByUserId,
    contributedByPlayerId: selected.contributedByPlayerId,
  }));
}
