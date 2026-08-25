import type { IpodWarHostRoundSong, IpodWarRoundResultsPayload } from '@jostle/messaging';
import { findSubmission, getIpodWarStateDocument, listRoundSubmissions } from '../db/index.js';
import type { IpodWarRole, IpodWarSnapshot, IpodWarSubmissionGuess } from '../model/index.js';
import { buildRoundResultsPayload } from './round-lifecycle.js';

export interface GetRoundSnapshotInput {
  readonly sessionId: string;
  readonly role: IpodWarRole;
  readonly playerId?: string;
}

export async function getRoundSnapshotForRole(
  input: GetRoundSnapshotInput,
): Promise<IpodWarSnapshot> {
  const { sessionId, role, playerId } = input;
  const state = await getIpodWarStateDocument(sessionId);

  if (!state || state.phase === 'idle' || state.currentRoundIndex < 0) {
    return {
      phase: state?.phase ?? 'idle',
      roundIndex: -1,
      totalRounds: state?.songBank.length ?? 0,
      phaseEndsAt: null,
      song: null,
      submittedPlayerIds: [],
      lastResults: null,
    };
  }

  const roundIndex = state.currentRoundIndex;
  const round = state.rounds[roundIndex];
  const includeSong = role === 'host' || state.phase === 'results' || state.phase === 'ended';

  const song: IpodWarHostRoundSong | null = includeSong
    ? {
        trackUri: round.song.trackUri,
        trackId: round.song.trackId,
        trackName: round.song.trackName,
        artistNames: round.song.artistNames,
        albumName: round.song.albumName,
        albumImageUrl: round.song.albumImageUrl,
        durationMs: round.song.durationMs,
      }
    : null;

  let submittedPlayerIds: string[] = [];
  if (state.phase === 'playback') {
    const submissions = await listRoundSubmissions(sessionId, roundIndex);
    submittedPlayerIds = submissions.map((submission) => submission.playerId.toString());
  }

  let lastResults: IpodWarRoundResultsPayload | null = null;
  if (state.phase === 'results' || state.phase === 'ended') {
    const phaseEndsAtForResults = state.phaseEndsAt ?? new Date();
    lastResults = await buildRoundResultsPayload(sessionId, state, roundIndex, phaseEndsAtForResults);
  }

  let mySubmission: IpodWarSubmissionGuess | null | undefined;
  if (role === 'player' && playerId) {
    const submission = await findSubmission(sessionId, roundIndex, playerId);
    mySubmission = submission
      ? {
          trackName: submission.guessTrackName,
          artistName: submission.guessArtistName,
          albumName: submission.guessAlbumName,
        }
      : null;
  }

  return {
    phase: state.phase,
    roundIndex,
    totalRounds: state.songBank.length,
    phaseEndsAt: state.phaseEndsAt ? state.phaseEndsAt.toISOString() : null,
    song,
    submittedPlayerIds,
    lastResults,
    mySubmission,
  };
}
