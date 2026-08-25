import { listSessionPlayers } from '@jostle/game-sessions';
import { ipodWarSubmissionTopic, publishTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { getIpodWarStateDocument, listRoundSubmissions, upsertSubmission } from '../db/index.js';
import { RoundNotAcceptingSubmissionsError } from '../model/index.js';
import type { IpodWarSubmissionGuess } from '../model/index.js';

export interface RecordSubmissionInput {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly playerId: string;
  readonly guess: IpodWarSubmissionGuess;
}

export async function recordSubmission(input: RecordSubmissionInput): Promise<void> {
  const { pubsub, sessionId, playerId, guess } = input;

  const state = await getIpodWarStateDocument(sessionId);
  if (!state || state.phase !== 'playback' || state.currentRoundIndex < 0) {
    throw new RoundNotAcceptingSubmissionsError();
  }

  const roundIndex = state.currentRoundIndex;
  const round = state.rounds[roundIndex];
  const now = new Date();
  const clipDurationMs = state.config.clipDurationSeconds * 1000;
  const submittedAtMsIntoRound = Math.min(
    clipDurationMs,
    Math.max(0, now.getTime() - round.startedAt.getTime()),
  );

  await upsertSubmission({
    sessionId,
    roundIndex,
    playerId,
    guess,
    submittedAt: now,
    submittedAtMsIntoRound,
  });

  const [submissions, players] = await Promise.all([
    listRoundSubmissions(sessionId, roundIndex),
    listSessionPlayers(sessionId),
  ]);

  await publishTopic(pubsub, ipodWarSubmissionTopic, {
    params: { sessionId },
    payload: {
      roundIndex,
      playerId,
      submittedAt: now.toISOString(),
      submittedCount: submissions.length,
      totalPlayers: players.length,
    },
  });
}
