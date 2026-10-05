import { toStandings as toRosterStandings } from '../shared';
import type {
  IpodWarAnswer,
  IpodWarField,
  IpodWarFieldResult,
  IpodWarHostView,
  IpodWarPrivateView,
  IpodWarPublicView,
  IpodWarSong,
  IpodWarStanding,
  IpodWarState,
} from './ipodWar.types';

// What each screen may see. The rule that matters: until a song's reveal, nothing identifying it
// (uri, title, artists, album, art) reaches a player - only the host screen, which must play it.

const toAnswer = (song: IpodWarSong): IpodWarAnswer => ({
  title: song.title,
  artists: song.artists,
  album: song.album,
  albumImageUrl: song.albumImageUrl,
});

const lastSongPoints = (state: IpodWarState, participantId: string): number =>
  state.phase === 'reveal' ? (state.results.at(-1)?.grades[participantId]?.points ?? 0) : 0;

export const toStandings = (state: IpodWarState): IpodWarStanding[] =>
  toRosterStandings(state.roster, state.totals, (participantId) => lastSongPoints(state, participantId));

export const ipodWarPublicView = (state: IpodWarState): IpodWarPublicView => ({
  phase: state.phase,
  songNumber: state.index + 1,
  songCount: state.songs.length,
  playlist: { name: state.playlist.name, imageUrl: state.playlist.imageUrl },
  fields: state.config.fields,
  phaseEndsAt: state.phaseEndsAt,
  pausedRemainingMs: state.pausedRemainingMs,
  paused: state.paused,
  autoPaused: state.autoPaused,
  playbackMs: state.config.playbackMs,
  revealMs: state.config.revealMs,
  roster: state.roster,
  lockedIn: Object.keys(state.submissions),
  audioProblem: state.playback.error !== null,
  standings: toStandings(state),
  answer: state.phase === 'reveal' ? toAnswer(state.songs[state.index]) : null,
});

export const ipodWarHostView = (state: IpodWarState): IpodWarHostView => {
  const song = state.phase === 'countdown' || state.phase === 'final' ? null : state.songs[state.index];
  return {
    phase: state.phase,
    songIndex: state.index,
    song: song ? { ...toAnswer(song), uri: song.uri, clipStartMs: song.clipStartMs, durationMs: song.durationMs } : null,
    paused: state.paused,
    phaseEndsAt: state.phaseEndsAt,
    pausedRemainingMs: state.pausedRemainingMs,
    playbackMs: state.config.playbackMs,
    playback: state.playback,
  };
};

const answerText = (song: IpodWarSong, field: IpodWarField): string => {
  switch (field) {
    case 'title':
      return song.title;
    case 'artist':
      return song.artists.join(', ');
    case 'album':
      return song.album;
  }
};

const toResult = (state: IpodWarState, participantId: string): IpodWarPrivateView['result'] => {
  const grade = state.phase === 'reveal' ? state.results.at(-1)?.grades[participantId] : undefined;
  if (!grade) return null;
  const song = state.songs[state.index];
  const fields = Object.fromEntries(
    Object.entries(grade.fields).map(([field, fieldGrade]): [string, IpodWarFieldResult] => [
      field,
      { ...fieldGrade, answer: answerText(song, field as IpodWarField) },
    ]),
  );
  return { fields, speedBonus: grade.speedBonus, points: grade.points };
};

export const ipodWarPrivateView = (state: IpodWarState, participantId: string): IpodWarPrivateView => {
  const standing = toStandings(state).find((candidate) => candidate.participantId === participantId);
  return {
    isPlaying: state.roster.includes(participantId),
    guesses: state.submissions[participantId]?.guesses ?? null,
    result: toResult(state, participantId),
    total: state.totals[participantId] ?? 0,
    rank: standing?.rank ?? null,
    playerCount: state.roster.length,
  };
};
