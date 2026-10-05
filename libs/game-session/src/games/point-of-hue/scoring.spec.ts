import { describe, expect, it } from 'vitest';
import { accuracyOf, gradeGuess, MAX_ACCURACY_POINTS, MAX_DELTA_E, MAX_SPEED_BONUS, PERFECT_DELTA_E, speedBonusOf } from './scoring';

describe('Point of Hue scoring', () => {
  it('maps the perceptual difference onto accuracy: perfect within a just-noticeable difference, zero past MAX_DELTA_E', () => {
    expect(accuracyOf(0)).toBe(1);
    expect(accuracyOf(PERFECT_DELTA_E)).toBe(1);
    expect(accuracyOf((PERFECT_DELTA_E + MAX_DELTA_E) / 2)).toBeCloseTo(0.5);
    expect(accuracyOf(MAX_DELTA_E)).toBe(0);
    expect(accuracyOf(90)).toBe(0);
  });

  it('scales the speed bonus by accuracy, so a fast wild guess earns none', () => {
    expect(speedBonusOf(1, 0, 30_000)).toBe(MAX_SPEED_BONUS);
    expect(speedBonusOf(1, 15_000, 30_000)).toBe(MAX_SPEED_BONUS / 2);
    expect(speedBonusOf(0.5, 0, 30_000)).toBe(MAX_SPEED_BONUS / 2);
    expect(speedBonusOf(0, 0, 30_000)).toBe(0);
    expect(speedBonusOf(1, 30_000, 30_000)).toBe(0);
    expect(speedBonusOf(1, 0, 0)).toBe(0);
  });

  it('grades an exact lock-in at full marks, and gives an auto-submitted guess no speed bonus', () => {
    expect(gradeGuess('#3a7bd5', '#3a7bd5', 0, 30_000)).toMatchObject({
      deltaE: 0,
      accuracy: 1,
      accuracyPoints: MAX_ACCURACY_POINTS,
      speedBonus: MAX_SPEED_BONUS,
      points: MAX_ACCURACY_POINTS + MAX_SPEED_BONUS,
      lockedIn: true,
    });
    expect(gradeGuess('#3a7bd5', '#3a7bd5', null, 30_000)).toMatchObject({ speedBonus: 0, points: MAX_ACCURACY_POINTS, lockedIn: false });
  });

  it('scores a close guess well and a different color not at all', () => {
    const close = gradeGuess('#3a7bd5', '#3d7ed2', 10_000, 30_000);
    expect(close.accuracy).toBeGreaterThan(0.9);
    const wrong = gradeGuess('#3a7bd5', '#e0542b', 0, 30_000);
    expect(wrong).toMatchObject({ accuracy: 0, points: 0 });
  });
});
