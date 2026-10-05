import { describe, expect, it } from 'vitest';
import {
  answerVariants,
  isAnswerMatch,
  MAX_SPEED_BONUS,
  normalizeAnswer,
  similarity,
  speedBonus,
  stripDecorations,
  thresholdForDifficulty,
} from './grading';

describe('iPod War grading', () => {
  it.each([
    ['Beyoncé', 'beyonce'],
    ['The Beatles', 'beatles'],
    ["Don't Stop Me Now", 'dont stop me now'],
    ['P.O.D.', 'pod'],
    ['Simon & Garfunkel', 'simon and garfunkel'],
    ['  Mr.   Brightside!! ', 'mr brightside'],
    ['AC/DC', 'ac dc'],
  ])('normalizes %j to %j', (raw, expected) => {
    expect(normalizeAnswer(raw)).toBe(expected);
  });

  it.each([
    ['Bohemian Rhapsody - Remastered 2011', 'Bohemian Rhapsody'],
    ['Old Town Road (feat. Billy Ray Cyrus)', 'Old Town Road'],
    ['Wonderwall [Live]', 'Wonderwall'],
    ['Abbey Road (Super Deluxe Edition)', 'Abbey Road'],
    ['Stay - Radio Edit', 'Stay'],
    ['Señorita feat. Camila Cabello', 'Señorita'],
    // A dash that's part of the name, not a decoration, stays.
    ['Run-D.M.C. - Walk This Way', 'Run-D.M.C. - Walk This Way'],
  ])('strips decorations from %j', (raw, expected) => {
    expect(stripDecorations(raw)).toBe(expected);
  });

  it('keeps both the full and the stripped name as acceptable forms', () => {
    expect(answerVariants("(I Can't Get No) Satisfaction")).toEqual(['i cant get no satisfaction', 'satisfaction']);
  });

  it('scales the threshold from forgiving at 1 to exact at 10, clamping out-of-range difficulties', () => {
    expect(thresholdForDifficulty(1)).toBeCloseTo(0.6);
    expect(thresholdForDifficulty(10)).toBeCloseTo(1);
    expect(thresholdForDifficulty(0)).toBeCloseTo(0.6);
    expect(thresholdForDifficulty(99)).toBeCloseTo(1);
  });

  it('counts a transposition as one typo', () => {
    expect(similarity('teh', 'the')).toBeCloseTo(2 / 3);
    expect(similarity('', '')).toBe(0);
  });

  it('accepts typos on easy and wants them exact on the hardest difficulty', () => {
    expect(isAnswerMatch('bohemian rapsody', ['Bohemian Rhapsody - Remastered 2011'], 1)).toBe(true);
    expect(isAnswerMatch('bohemian rapsody', ['Bohemian Rhapsody - Remastered 2011'], 10)).toBe(false);
    expect(isAnswerMatch('BOHEMIAN RHAPSODY!', ['Bohemian Rhapsody - Remastered 2011'], 10)).toBe(true);
    expect(isAnswerMatch('Yesterday', ['Bohemian Rhapsody'], 1)).toBe(false);
  });

  it('never holds spacing or accents against a guess, even at difficulty 10', () => {
    expect(isAnswerMatch('acdc', ['AC/DC'], 10)).toBe(true);
    expect(isAnswerMatch('beyonce', ['Beyoncé'], 10)).toBe(true);
    expect(isAnswerMatch('beatles', ['The Beatles'], 10)).toBe(true);
  });

  it('matches an artist guess against any credited artist', () => {
    expect(isAnswerMatch('david bowie', ['Queen', 'David Bowie'], 10)).toBe(true);
    expect(isAnswerMatch('queen', ['Queen', 'David Bowie'], 10)).toBe(true);
    expect(isAnswerMatch('freddie', ['Queen', 'David Bowie'], 5)).toBe(false);
  });

  it('never accepts an empty guess, and falls back to raw text for names that normalize away', () => {
    expect(isAnswerMatch('   ', ['Anything'], 1)).toBe(false);
    expect(isAnswerMatch('', [''], 1)).toBe(false);
    expect(isAnswerMatch('!!!', ['!!!'], 10)).toBe(true);
  });

  it('awards the speed bonus linearly over the clip', () => {
    expect(speedBonus(0, 30_000)).toBe(MAX_SPEED_BONUS);
    expect(speedBonus(15_000, 30_000)).toBe(MAX_SPEED_BONUS / 2);
    expect(speedBonus(30_000, 30_000)).toBe(0);
    expect(speedBonus(45_000, 30_000)).toBe(0);
    expect(speedBonus(1_000, 0)).toBe(0);
  });
});
