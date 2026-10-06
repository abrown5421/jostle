import type { WordleWarRoundScore } from './wordleWar.types';

// Points for cracking the word: by solve order, plus a bonus for every guess left unused. Not
// solving scores nothing.
export const PLACEMENT_POINTS = [100, 80, 65, 50] as const;
export const LATE_PLACEMENT_POINTS = 40;
export const GUESS_BONUS = 10;

export const placementPoints = (place: number): number => PLACEMENT_POINTS[place - 1] ?? LATE_PLACEMENT_POINTS;

export const scoreSolve = (place: number, guessesUsed: number, maxGuesses: number): WordleWarRoundScore => {
  const placement = placementPoints(place);
  const guessBonus = GUESS_BONUS * Math.max(0, maxGuesses - guessesUsed);
  return { place, guessesUsed, placementPoints: placement, guessBonus, points: placement + guessBonus };
};
