import type { GameDefinition } from '../../contracts/game-definition.contract';
import { GameSessionError } from '../../service/session.errors';
import { getIpodWarMusicSource } from './ipodWar.port';
import type { IpodWarLoadedPlaylist } from './ipodWar.port';
import { COUNTDOWN_MS, handleIpodWarAction } from './ipodWar.reducer';
import type { IpodWarField, IpodWarSettings, IpodWarSong, IpodWarState, IpodWarTrack } from './ipodWar.types';
import { IPOD_WAR_GAME_ID } from './ipodWar.types';
import { ipodWarHostView, ipodWarPrivateView, ipodWarPublicView } from './ipodWar.views';

// Song shuffling and clip offsets are random; specs pin this for repeatable banks.
let random: () => number = Math.random;

export const setIpodWarRandomForTesting = (next: () => number): void => {
  random = next;
};

const shuffle = <T>(items: readonly T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Somewhere random in the song, but always with room for the whole clip (from the top if the
// song is shorter than the clip).
const toSong = (track: IpodWarTrack, playbackMs: number): IpodWarSong => ({
  ...track,
  clipStartMs: Math.floor(random() * Math.max(0, track.durationMs - playbackMs)),
});

const enabledFields = (settings: IpodWarSettings): IpodWarField[] => [
  'title',
  ...(settings.nameArtist ? (['artist'] as const) : []),
  ...(settings.nameAlbum ? (['album'] as const) : []),
];

export const ipodWarGame: GameDefinition<IpodWarState, IpodWarSettings, IpodWarLoadedPlaylist> = {
  id: IPOD_WAR_GAME_ID,
  // The bank is drawn from the playlist's *playable* songs, which the picker's track count can
  // overstate (local files, region-locked songs) - so this is the authoritative size check.
  prepare: async ({ hostUserId, settings, signal }) => {
    const loaded = await getIpodWarMusicSource().loadPlaylist(hostUserId, settings.playlistId, signal);
    const available = loaded.tracks.length;
    if (available < settings.songCount) {
      throw new GameSessionError(
        'INVALID_SETTINGS',
        available === 0
          ? `"${loaded.playlist.name}" has no songs that can be played - pick another playlist`
          : `"${loaded.playlist.name}" only has ${available} playable songs - lower Songs to ${available} or pick a bigger playlist`,
      );
    }
    return loaded;
  },
  createInitialState: ({ participants, settings, now }, { playlist, tracks }) => {
    const playbackMs = settings.playbackSeconds * 1000;
    return {
      config: {
        playbackMs,
        revealMs: settings.revealSeconds * 1000,
        endWhenAllAnswered: settings.endWhenAllAnswered,
        fields: enabledFields(settings),
        difficulty: settings.difficulty,
      },
      playlist,
      songs: shuffle(tracks)
        .slice(0, settings.songCount)
        .map((track) => toSong(track, playbackMs)),
      index: 0,
      phase: 'countdown',
      phaseEndsAt: new Date(Date.parse(now) + COUNTDOWN_MS).toISOString(),
      pausedRemainingMs: null,
      paused: false,
      autoPaused: false,
      timerSeq: 0,
      roster: participants.map(({ id }) => id),
      submissions: {},
      results: [],
      totals: Object.fromEntries(participants.map(({ id }) => [id, 0])),
      playback: { deviceId: null, attempt: 0, error: null },
    };
  },
  handleAction: handleIpodWarAction,
  nextTimeout: (state) =>
    state.paused || !state.phaseEndsAt ? null : { at: state.phaseEndsAt, action: { type: 'timer', payload: { seq: state.timerSeq } } },
  publicView: ipodWarPublicView,
  hostView: ipodWarHostView,
  privateView: ipodWarPrivateView,
};
