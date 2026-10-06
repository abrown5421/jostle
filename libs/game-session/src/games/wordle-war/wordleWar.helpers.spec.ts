import { describe, expect, it } from 'vitest';
import { evaluateGuess, isSolved, isWellFormedGuess, keyboardOf, normalizeGuess } from './evaluate';
import { GUESS_BONUS, LATE_PLACEMENT_POINTS, PLACEMENT_POINTS, scoreSolve } from './scoring';
import { filterDictionary, MIN_FREQUENCY, pickSecrets, secretPoolFor } from './words';

describe('Wordle War guess evaluation', () => {
  it.each([
    ['crane', 'crane', ['correct', 'correct', 'correct', 'correct', 'correct']],
    ['fuzzy', 'crane', ['absent', 'absent', 'absent', 'absent', 'absent']],
    ['react', 'crane', ['present', 'present', 'correct', 'present', 'absent']],
    // Repeated guessed letters only count as often as the secret has them.
    ['speed', 'abide', ['absent', 'absent', 'present', 'absent', 'present']],
    ['eerie', 'there', ['present', 'absent', 'present', 'absent', 'correct']],
    // An exact match claims its letter before any "present".
    ['lolly', 'hello', ['absent', 'present', 'correct', 'correct', 'absent']],
  ])('%s against %s', (guess, secret, expected) => {
    expect(evaluateGuess(guess, secret)).toEqual(expected);
  });

  it('recognises a solve, a well-formed guess and normalizes input', () => {
    expect(isSolved(evaluateGuess('crane', 'crane'))).toBe(true);
    expect(isSolved(evaluateGuess('crate', 'crane'))).toBe(false);
    expect(normalizeGuess('  CrAnE ')).toBe('crane');
    expect(isWellFormedGuess('crane', 5)).toBe(true);
    expect(isWellFormedGuess('cran', 5)).toBe(false);
    expect(isWellFormedGuess('cr4ne', 5)).toBe(false);
  });

  it('keeps the best verdict per letter for the keyboard', () => {
    const guesses = [
      { word: 'react', marks: evaluateGuess('react', 'crane') },
      { word: 'crane', marks: evaluateGuess('crane', 'crane') },
    ];
    expect(keyboardOf(guesses)).toEqual({ r: 'correct', e: 'correct', a: 'correct', c: 'correct', t: 'absent', n: 'correct' });
  });
});

describe('Wordle War words', () => {
  const entries = [
    { word: 'about', frequency: 900 },
    { word: 'Paris', frequency: 300 },
    { word: 'self-', frequency: 50 },
    { word: 'zzzzz', frequency: MIN_FREQUENCY / 2 },
    { word: 'crane', frequency: 20 },
    { word: 'crane', frequency: 25 },
    { word: 'toolong', frequency: 100 },
  ];

  it('keeps every plain word of the right length as a guess, once each, most frequent first', () => {
    expect(filterDictionary(entries, 5)).toEqual([
      { word: 'about', frequency: 900 },
      { word: 'crane', frequency: 25 },
      { word: 'zzzzz', frequency: MIN_FREQUENCY / 2 },
    ]);
  });

  it('never draws a secret rarer than MIN_FREQUENCY, nor a name', () => {
    const dictionary = filterDictionary([...entries, { word: 'patti', frequency: 500, properNoun: true }], 5);
    expect(dictionary.map(({ word }) => word)).toContain('patti');
    const secrets = Array.from({ length: 10 }, (_, i) => secretPoolFor(dictionary, i + 1)).flat();
    expect(secrets).not.toContain('zzzzz');
    expect(secrets).not.toContain('patti');
  });

  it('draws easy words from the most common tenth and hard ones from the rarest', () => {
    const dictionary = Array.from({ length: 100 }, (_, i) => ({ word: `w${String(i).padStart(4, '0')}`, frequency: 1000 - i }));
    expect(secretPoolFor(dictionary, 1)).toEqual(dictionary.slice(0, 10).map(({ word }) => word));
    expect(secretPoolFor(dictionary, 10)).toEqual(dictionary.slice(90).map(({ word }) => word));
    expect(secretPoolFor(dictionary, 99)).toEqual(secretPoolFor(dictionary, 10));
  });

  it('picks distinct secrets', () => {
    const secrets = pickSecrets(['a', 'b', 'c', 'd'], 3, Math.random);
    expect(new Set(secrets).size).toBe(3);
    expect(pickSecrets(['a', 'b'], 5, Math.random)).toHaveLength(2);
  });
});

describe('Wordle War scoring', () => {
  it('awards placement points plus a bonus per unused guess', () => {
    expect(scoreSolve(1, 3, 6)).toEqual({ place: 1, guessesUsed: 3, placementPoints: 100, guessBonus: 3 * GUESS_BONUS, points: 130 });
    expect(PLACEMENT_POINTS.map((_, i) => scoreSolve(i + 1, 6, 6).points)).toEqual([100, 80, 65, 50]);
    expect(scoreSolve(5, 6, 6).points).toBe(LATE_PLACEMENT_POINTS);
    expect(scoreSolve(9, 1, 6).points).toBe(LATE_PLACEMENT_POINTS + 5 * GUESS_BONUS);
  });
});
