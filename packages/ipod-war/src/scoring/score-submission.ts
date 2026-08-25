import { jaroWinklerSimilarity } from './jaro-winkler.js';
import { normalizeForComparison } from './normalize-string.js';
import type { IpodWarCorrectnessBreakdown, IpodWarSubmissionGuess } from '../model/index.js';

const TRACK_NAME_BASE_POINTS = 100;
const ARTIST_BASE_POINTS = 50;
const ALBUM_BASE_POINTS = 50;
const PARTIAL_CREDIT_BAND_WIDTH = 0.15;
const PARTIAL_CREDIT_WEIGHT = 0.5;
const MIN_SPEED_MULTIPLIER = 1;
const MAX_SPEED_MULTIPLIER = 1.5;
const SPEED_BONUS_RANGE = 0.5;

export interface ScoreSubmissionAnswer {
  readonly trackName: string;
  readonly artistNames: ReadonlyArray<string>;
  readonly albumName: string;
}

export interface ScoreSubmissionInput {
  readonly guess: IpodWarSubmissionGuess;
  readonly answer: ScoreSubmissionAnswer;
  readonly requireArtist: boolean;
  readonly requireAlbum: boolean;
  readonly difficulty: number;
  readonly submittedAtMsIntoRound: number;
  readonly clipDurationMs: number;
}

export interface ScoreSubmissionResult {
  readonly pointsAwarded: number;
  readonly breakdown: IpodWarCorrectnessBreakdown;
}

function requiredSimilarityForDifficulty(difficulty: number): number {
  const clamped = Math.min(10, Math.max(1, difficulty));
  return 0.5 + (clamped / 10) * 0.5;
}

function fieldScore(similarity: number, requiredSimilarity: number): number {
  if (similarity >= requiredSimilarity) return 1;
  const partialCreditFloor = requiredSimilarity - PARTIAL_CREDIT_BAND_WIDTH;
  if (similarity < partialCreditFloor) return 0;
  return similarity * PARTIAL_CREDIT_WEIGHT;
}

function similarityBetween(guess: string | undefined, truth: string): number {
  if (!guess || guess.trim().length === 0) return 0;
  return jaroWinklerSimilarity(normalizeForComparison(guess), normalizeForComparison(truth));
}

function bestArtistSimilarity(
  guess: string | undefined,
  artistNames: ReadonlyArray<string>,
): number {
  if (!guess || guess.trim().length === 0) return 0;
  return artistNames.reduce(
    (best, name) => Math.max(best, similarityBetween(guess, name)),
    0,
  );
}

function computeSpeedMultiplier(submittedAtMsIntoRound: number, clipDurationMs: number): number {
  const progressRatio =
    clipDurationMs > 0
      ? Math.min(1, Math.max(0, submittedAtMsIntoRound / clipDurationMs))
      : 1;
  const multiplier = 1 + SPEED_BONUS_RANGE * (1 - progressRatio);
  return Math.min(MAX_SPEED_MULTIPLIER, Math.max(MIN_SPEED_MULTIPLIER, multiplier));
}

export function scoreSubmission(input: ScoreSubmissionInput): ScoreSubmissionResult {
  const requiredSimilarity = requiredSimilarityForDifficulty(input.difficulty);

  const trackNameScore = fieldScore(
    similarityBetween(input.guess.trackName, input.answer.trackName),
    requiredSimilarity,
  );

  const artistScore = input.requireArtist
    ? fieldScore(
        bestArtistSimilarity(input.guess.artistName, input.answer.artistNames),
        requiredSimilarity,
      )
    : undefined;

  const albumScore = input.requireAlbum
    ? fieldScore(similarityBetween(input.guess.albumName, input.answer.albumName), requiredSimilarity)
    : undefined;

  const speedMultiplier = computeSpeedMultiplier(input.submittedAtMsIntoRound, input.clipDurationMs);

  const rawPoints =
    trackNameScore * TRACK_NAME_BASE_POINTS +
    (artistScore ?? 0) * ARTIST_BASE_POINTS +
    (albumScore ?? 0) * ALBUM_BASE_POINTS;

  return {
    pointsAwarded: Math.round(rawPoints * speedMultiplier),
    breakdown: { trackNameScore, artistScore, albumScore, speedMultiplier },
  };
}
