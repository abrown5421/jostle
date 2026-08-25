import { describe, expect, it } from 'vitest';
import { scoreSubmission } from './score-submission.js';

const ANSWER = {
  trackName: 'Bohemian Rhapsody',
  artistNames: ['Queen'],
  albumName: 'A Night at the Opera',
};

describe('scoreSubmission', () => {
  it('awards full track-name credit for an exact match', () => {
    const result = scoreSubmission({
      guess: { trackName: 'Bohemian Rhapsody' },
      answer: ANSWER,
      requireArtist: false,
      requireAlbum: false,
      difficulty: 5,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    expect(result.breakdown.trackNameScore).toBe(1);
    expect(result.pointsAwarded).toBeGreaterThan(0);
  });

  it('awards zero for a wildly wrong guess', () => {
    const result = scoreSubmission({
      guess: { trackName: 'Purple Rain' },
      answer: ANSWER,
      requireArtist: false,
      requireAlbum: false,
      difficulty: 5,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    expect(result.pointsAwarded).toBe(0);
  });

  it('is tolerant of minor typos at low difficulty but not at high difficulty', () => {
    const guess = { trackName: 'Bohemian Rapsody' };
    const lenient = scoreSubmission({
      guess,
      answer: ANSWER,
      requireArtist: false,
      requireAlbum: false,
      difficulty: 1,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    const strict = scoreSubmission({
      guess,
      answer: ANSWER,
      requireArtist: false,
      requireAlbum: false,
      difficulty: 10,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    expect(lenient.breakdown.trackNameScore).toBe(1);
    expect(strict.breakdown.trackNameScore).toBeLessThan(1);
  });

  it('scores an empty guess as zero without throwing', () => {
    const result = scoreSubmission({
      guess: { trackName: '' },
      answer: ANSWER,
      requireArtist: true,
      requireAlbum: true,
      difficulty: 5,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    expect(result.pointsAwarded).toBe(0);
  });

  it('matches an artist guess against any artist on the track', () => {
    const result = scoreSubmission({
      guess: { trackName: 'Bohemian Rhapsody', artistName: 'Queen' },
      answer: { ...ANSWER, artistNames: ['Freddie Mercury', 'Queen'] },
      requireArtist: true,
      requireAlbum: false,
      difficulty: 8,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    expect(result.breakdown.artistScore).toBe(1);
  });

  it('rewards a faster submission with a higher speed multiplier', () => {
    const fast = scoreSubmission({
      guess: { trackName: 'Bohemian Rhapsody' },
      answer: ANSWER,
      requireArtist: false,
      requireAlbum: false,
      difficulty: 5,
      submittedAtMsIntoRound: 0,
      clipDurationMs: 60_000,
    });
    const slow = scoreSubmission({
      guess: { trackName: 'Bohemian Rhapsody' },
      answer: ANSWER,
      requireArtist: false,
      requireAlbum: false,
      difficulty: 5,
      submittedAtMsIntoRound: 59_000,
      clipDurationMs: 60_000,
    });
    expect(fast.breakdown.speedMultiplier).toBeGreaterThan(slow.breakdown.speedMultiplier);
    expect(fast.pointsAwarded).toBeGreaterThan(slow.pointsAwarded);
  });
});
