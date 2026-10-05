import { hexDeltaE } from './color';

// How a Point of Hue guess scores. Accuracy is the perceptual difference (CIEDE2000) mapped onto
// 0..1: within a just-noticeable difference is perfect, past MAX_DELTA_E it's a different color
// and scores nothing. Speed only counts for a lock-in, and only as much as the guess was accurate -
// a fast wild guess earns no bonus.

export const MAX_ACCURACY_POINTS = 100;
export const MAX_SPEED_BONUS = 50;
export const PERFECT_DELTA_E = 2;
export const MAX_DELTA_E = 40;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const accuracyOf = (deltaE: number): number => clamp01((MAX_DELTA_E - deltaE) / (MAX_DELTA_E - PERFECT_DELTA_E));

export const speedBonusOf = (accuracy: number, elapsedMs: number, guessMs: number): number =>
  guessMs <= 0 ? 0 : Math.round(MAX_SPEED_BONUS * accuracy * clamp01(1 - elapsedMs / guessMs));

export interface PointOfHueGrade {
  readonly hex: string;
  readonly deltaE: number;
  // 0..1.
  readonly accuracy: number;
  readonly accuracyPoints: number;
  readonly speedBonus: number;
  readonly points: number;
  // Locked in (vs auto-submitted from the picker when time ran out).
  readonly lockedIn: boolean;
}

// `elapsedMs` is how far into guessing they locked in, or null for an auto-submitted color.
export const gradeGuess = (targetHex: string, guessHex: string, elapsedMs: number | null, guessMs: number): PointOfHueGrade => {
  const deltaE = hexDeltaE(targetHex, guessHex);
  const accuracy = accuracyOf(deltaE);
  const accuracyPoints = Math.round(MAX_ACCURACY_POINTS * accuracy);
  const speedBonus = elapsedMs === null ? 0 : speedBonusOf(accuracy, elapsedMs, guessMs);
  return { hex: guessHex, deltaE, accuracy, accuracyPoints, speedBonus, points: accuracyPoints + speedBonus, lockedIn: elapsedMs !== null };
};
