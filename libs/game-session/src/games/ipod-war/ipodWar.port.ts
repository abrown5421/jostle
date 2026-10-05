import { GameSessionError } from '../../service/session.errors';
import type { IpodWarPlaylist, IpodWarTrack } from './ipodWar.types';

export interface IpodWarLoadedPlaylist {
  readonly playlist: IpodWarPlaylist;
  // Every playable song in it.
  readonly tracks: readonly IpodWarTrack[];
}

// Where iPod War's songs come from - the host's own Spotify playlist in production. A port, like
// GameCatalog, so this lib never imports @inithium/integrations: apps/api wires the Spotify-backed
// one in at boot (setIpodWarMusicSource) and tests wire a fake. Throw a GameSessionError for any
// failure the host should read ("That playlist can't be read").
export interface IpodWarMusicSource {
  readonly name: string;
  loadPlaylist: (hostUserId: string, playlistId: string, signal: AbortSignal) => Promise<IpodWarLoadedPlaylist>;
}

const unconfiguredMusicSource: IpodWarMusicSource = {
  name: 'Unconfigured',
  loadPlaylist: async () => {
    throw new GameSessionError('GAME_SETUP_FAILED', "iPod War can't load music on this server");
  },
};

let current: IpodWarMusicSource = unconfiguredMusicSource;

export const setIpodWarMusicSource = (source: IpodWarMusicSource): void => {
  current = source;
};

export const getIpodWarMusicSource = (): IpodWarMusicSource => current;
