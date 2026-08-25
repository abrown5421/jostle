import { ObjectId } from 'mongodb';
import { ensureIpodWarIndexes, getIpodWarSubmissionsCollection } from './collection.js';
import type {
  IpodWarCorrectnessBreakdown,
  IpodWarSubmissionDocument,
  IpodWarSubmissionGuess,
} from '../model/index.js';

export interface UpsertSubmissionInput {
  readonly sessionId: string;
  readonly roundIndex: number;
  readonly playerId: string;
  readonly guess: IpodWarSubmissionGuess;
  readonly submittedAt: Date;
  readonly submittedAtMsIntoRound: number;
}

export async function upsertSubmission(
  input: UpsertSubmissionInput,
): Promise<IpodWarSubmissionDocument> {
  await ensureIpodWarIndexes();

  const result = await getIpodWarSubmissionsCollection().findOneAndUpdate(
    {
      sessionId: new ObjectId(input.sessionId),
      roundIndex: input.roundIndex,
      playerId: new ObjectId(input.playerId),
    },
    {
      $set: {
        guessTrackName: input.guess.trackName,
        guessArtistName: input.guess.artistName,
        guessAlbumName: input.guess.albumName,
        submittedAt: input.submittedAt,
        submittedAtMsIntoRound: input.submittedAtMsIntoRound,
        scored: false,
      },
      $setOnInsert: {
        _id: new ObjectId(),
        sessionId: new ObjectId(input.sessionId),
        roundIndex: input.roundIndex,
        playerId: new ObjectId(input.playerId),
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (!result) throw new Error('Failed to record submission');
  return result;
}

export async function listRoundSubmissions(
  sessionId: string,
  roundIndex: number,
): Promise<IpodWarSubmissionDocument[]> {
  return getIpodWarSubmissionsCollection()
    .find({ sessionId: new ObjectId(sessionId), roundIndex })
    .toArray();
}

export async function findSubmission(
  sessionId: string,
  roundIndex: number,
  playerId: string,
): Promise<IpodWarSubmissionDocument | null> {
  if (!ObjectId.isValid(playerId)) return null;
  return getIpodWarSubmissionsCollection().findOne({
    sessionId: new ObjectId(sessionId),
    roundIndex,
    playerId: new ObjectId(playerId),
  });
}

export interface ScoredSubmissionInput {
  readonly playerId: string;
  readonly pointsAwarded: number;
  readonly correctnessBreakdown: IpodWarCorrectnessBreakdown;
}

export async function recordRoundScores(
  sessionId: string,
  roundIndex: number,
  scored: ReadonlyArray<ScoredSubmissionInput>,
): Promise<void> {
  if (scored.length === 0) return;

  const collection = getIpodWarSubmissionsCollection();
  await Promise.all(
    scored.map((entry) =>
      collection.updateOne(
        {
          sessionId: new ObjectId(sessionId),
          roundIndex,
          playerId: new ObjectId(entry.playerId),
        },
        {
          $set: {
            scored: true,
            pointsAwarded: entry.pointsAwarded,
            correctnessBreakdown: entry.correctnessBreakdown,
          },
        },
      ),
    ),
  );
}

export interface CumulativeLeaderboardEntry {
  readonly playerId: string;
  readonly totalPoints: number;
}

export async function getCumulativeLeaderboard(
  sessionId: string,
): Promise<CumulativeLeaderboardEntry[]> {
  const results = await getIpodWarSubmissionsCollection()
    .aggregate<{ _id: ObjectId; totalPoints: number }>([
      { $match: { sessionId: new ObjectId(sessionId), scored: true } },
      { $group: { _id: '$playerId', totalPoints: { $sum: '$pointsAwarded' } } },
      { $sort: { totalPoints: -1 } },
    ])
    .toArray();

  return results.map((entry) => ({
    playerId: entry._id.toString(),
    totalPoints: entry.totalPoints,
  }));
}
