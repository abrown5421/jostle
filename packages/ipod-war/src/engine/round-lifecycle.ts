import { listSessionPlayers, updateSessionStatus } from '@jostle/game-sessions';
import {
  ipodWarRoundHostTopic,
  ipodWarRoundPlayerTopic,
  ipodWarRoundResultsTopic,
  publishTopic,
  sessionStatusTopic,
} from '@jostle/messaging';
import type { IpodWarPlayerResult, IpodWarRoundResultsPayload, PubSub } from '@jostle/messaging';
import { scoreSubmission } from '../scoring/index.js';
import {
  appendRoundRecord,
  beginResultsPhase,
  getIpodWarStateDocument,
  listRoundSubmissions,
  markIpodWarEnded,
  recordRoundScores,
} from '../db/index.js';
import type { IpodWarStateDocument } from '../model/index.js';
import { buildLeaderboard } from './leaderboard.js';
import { clearTimer, scheduleTimer } from './timer-registry.js';

const CLIP_START_POSITION_MS = 30_000;
const RESULTS_PHASE_DURATION_MS = 15_000;

export async function buildRoundResultsPayload(
  sessionId: string,
  state: IpodWarStateDocument,
  roundIndex: number,
  phaseEndsAt: Date,
): Promise<IpodWarRoundResultsPayload> {
  const round = state.rounds[roundIndex];
  const [submissions, players, leaderboard] = await Promise.all([
    listRoundSubmissions(sessionId, roundIndex),
    listSessionPlayers(sessionId),
    buildLeaderboard(sessionId),
  ]);

  const submissionByPlayerId = new Map(
    submissions.map((submission) => [submission.playerId.toString(), submission]),
  );

  const perPlayerResults: IpodWarPlayerResult[] = players.map((player) => {
    const submission = submissionByPlayerId.get(player.playerId);
    return {
      playerId: player.playerId,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      submitted: submission !== undefined,
      pointsAwarded: submission?.pointsAwarded ?? 0,
      guess: submission
        ? {
            trackName: submission.guessTrackName,
            artistName: submission.guessArtistName,
            albumName: submission.guessAlbumName,
          }
        : undefined,
    };
  });

  return {
    roundIndex,
    totalRounds: state.songBank.length,
    isFinalRound: roundIndex === state.songBank.length - 1,
    correctAnswer: {
      trackName: round.song.trackName,
      artistNames: round.song.artistNames,
      albumName: round.song.albumName,
      albumImageUrl: round.song.albumImageUrl,
    },
    perPlayerResults,
    leaderboard,
    phaseEndsAt: phaseEndsAt.toISOString(),
  };
}

export async function startRound(
  pubsub: PubSub,
  sessionId: string,
  roundIndex: number,
): Promise<void> {
  const state = await getIpodWarStateDocument(sessionId);
  if (!state || roundIndex >= state.songBank.length) return;

  const song = state.songBank[roundIndex];
  const startedAt = new Date();
  const phaseEndsAt = new Date(startedAt.getTime() + state.config.clipDurationSeconds * 1000);

  await appendRoundRecord({ sessionId, roundIndex, song, startedAt, phaseEndsAt });

  await publishTopic(pubsub, ipodWarRoundHostTopic, {
    params: { sessionId },
    payload: {
      roundIndex,
      totalRounds: state.songBank.length,
      phaseEndsAt: phaseEndsAt.toISOString(),
      clipStartPositionMs: CLIP_START_POSITION_MS,
      song: {
        trackUri: song.trackUri,
        trackId: song.trackId,
        trackName: song.trackName,
        artistNames: song.artistNames,
        albumName: song.albumName,
        albumImageUrl: song.albumImageUrl,
        durationMs: song.durationMs,
      },
    },
  });

  await publishTopic(pubsub, ipodWarRoundPlayerTopic, {
    params: { sessionId },
    payload: {
      roundIndex,
      totalRounds: state.songBank.length,
      phaseEndsAt: phaseEndsAt.toISOString(),
      guessFieldsRequired: { artist: state.config.guessArtist, album: state.config.guessAlbum },
    },
  });

  scheduleTimer(sessionId, state.config.clipDurationSeconds * 1000, () => {
    void advancePhase(pubsub, sessionId, roundIndex);
  });
}

async function advancePhase(
  pubsub: PubSub,
  sessionId: string,
  expectedRoundIndex: number,
): Promise<void> {
  const state = await getIpodWarStateDocument(sessionId);
  if (!state || state.phase !== 'playback' || state.currentRoundIndex !== expectedRoundIndex) return;

  const round = state.rounds[expectedRoundIndex];
  const clipDurationMs = state.config.clipDurationSeconds * 1000;
  const submissions = await listRoundSubmissions(sessionId, expectedRoundIndex);

  const scored = submissions.map((submission) => {
    const result = scoreSubmission({
      guess: {
        trackName: submission.guessTrackName,
        artistName: submission.guessArtistName,
        albumName: submission.guessAlbumName,
      },
      answer: {
        trackName: round.song.trackName,
        artistNames: round.song.artistNames,
        albumName: round.song.albumName,
      },
      requireArtist: state.config.guessArtist,
      requireAlbum: state.config.guessAlbum,
      difficulty: state.config.difficulty,
      submittedAtMsIntoRound: submission.submittedAtMsIntoRound,
      clipDurationMs,
    });
    return {
      playerId: submission.playerId.toString(),
      pointsAwarded: result.pointsAwarded,
      correctnessBreakdown: result.breakdown,
    };
  });

  await recordRoundScores(sessionId, expectedRoundIndex, scored);

  const resultsComputedAt = new Date();
  const phaseEndsAt = new Date(resultsComputedAt.getTime() + RESULTS_PHASE_DURATION_MS);

  const updatedState = await beginResultsPhase({
    sessionId,
    roundIndex: expectedRoundIndex,
    phaseEndsAt,
    resultsComputedAt,
  });
  if (!updatedState) return;

  const payload = await buildRoundResultsPayload(sessionId, updatedState, expectedRoundIndex, phaseEndsAt);

  await publishTopic(pubsub, ipodWarRoundResultsTopic, { params: { sessionId }, payload });

  scheduleTimer(sessionId, RESULTS_PHASE_DURATION_MS, () => {
    void advanceRoundOrEnd(pubsub, sessionId, expectedRoundIndex);
  });
}

async function advanceRoundOrEnd(
  pubsub: PubSub,
  sessionId: string,
  expectedRoundIndex: number,
): Promise<void> {
  const state = await getIpodWarStateDocument(sessionId);
  if (!state || state.phase !== 'results' || state.currentRoundIndex !== expectedRoundIndex) return;

  const nextRoundIndex = expectedRoundIndex + 1;
  if (nextRoundIndex < state.songBank.length) {
    await startRound(pubsub, sessionId, nextRoundIndex);
  } else {
    await endGame(pubsub, sessionId);
  }
}

export async function endGame(pubsub: PubSub, sessionId: string): Promise<void> {
  clearTimer(sessionId);
  await markIpodWarEnded(sessionId);
  await updateSessionStatus(sessionId, 'ended');
  await publishTopic(pubsub, sessionStatusTopic, {
    params: { sessionId },
    payload: { sessionId, status: 'ended' },
  });
}
