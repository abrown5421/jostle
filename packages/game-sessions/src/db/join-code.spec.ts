import { describe, expect, it } from 'vitest';
import { generateJoinCode } from './join-code.js';

describe('generateJoinCode', () => {
  it('produces a 6-character code', () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it('only uses characters from the ambiguity-free alphabet', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateJoinCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('is deterministic given a deterministic random source', () => {
    const fixed = () => 0;
    expect(generateJoinCode(fixed)).toBe('AAAAAA');
  });

  it('uses the full range of the injected random source', () => {
    const almostOne = () => 0.9999999;
    expect(generateJoinCode(almostOne)).toBe('999999');
  });
});
