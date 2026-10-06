import type { LetterMark } from './wordleWar.types';

export const normalizeGuess = (raw: string): string => raw.trim().toLowerCase();

export const isWellFormedGuess = (word: string, length: number): boolean => word.length === length && /^[a-z]+$/.test(word);

// Wordle's verdict on each letter of a guess. Two passes so repeated letters are counted fairly:
// exact matches claim their letters first, then each remaining guessed letter is "present" only
// while an unclaimed copy of it is left in the secret ("speed" against "abide": one e present, one
// absent).
export const evaluateGuess = (guess: string, secret: string): LetterMark[] => {
  const marks: LetterMark[] = Array.from(guess, (letter, i) => (letter === secret[i] ? 'correct' : 'absent'));
  const unclaimed = new Map<string, number>();
  Array.from(secret).forEach((letter, i) => {
    if (marks[i] !== 'correct') unclaimed.set(letter, (unclaimed.get(letter) ?? 0) + 1);
  });
  Array.from(guess).forEach((letter, i) => {
    const left = unclaimed.get(letter) ?? 0;
    if (marks[i] === 'correct' || left === 0) return;
    marks[i] = 'present';
    unclaimed.set(letter, left - 1);
  });
  return marks;
};

export const isSolved = (marks: readonly LetterMark[]): boolean => marks.every((mark) => mark === 'correct');

const MARK_RANK: Record<LetterMark, number> = { absent: 0, present: 1, correct: 2 };

// The best verdict each letter has earned across guesses - what an on-screen keyboard shows.
export const keyboardOf = (guesses: readonly { word: string; marks: readonly LetterMark[] }[]): Record<string, LetterMark> => {
  const keyboard: Record<string, LetterMark> = {};
  guesses.forEach(({ word, marks }) =>
    Array.from(word).forEach((letter, i) => {
      const current = keyboard[letter];
      if (!current || MARK_RANK[marks[i]] > MARK_RANK[current]) keyboard[letter] = marks[i];
    }),
  );
  return keyboard;
};
