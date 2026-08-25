import { describe, expect, it } from 'vitest';
import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  generateAvatarSeed,
  isValidAvatarSeed,
  isValidAvatarStyle,
  resolveDicebearAvatarUrl,
} from './avatar.js';

describe('resolveDicebearAvatarUrl', () => {
  it('builds a DiceBear SVG URL from the seed and style', () => {
    expect(resolveDicebearAvatarUrl('jostle', 'avataaars')).toBe(
      'https://api.dicebear.com/10.x/avataaars/svg?seed=jostle',
    );
  });

  it('URL-encodes seeds with special characters', () => {
    expect(resolveDicebearAvatarUrl('a b&c', 'bottts')).toBe(
      'https://api.dicebear.com/10.x/bottts/svg?seed=a%20b%26c',
    );
  });
});

describe('isValidAvatarStyle', () => {
  it('accepts every curated style', () => {
    for (const style of AVATAR_STYLES) {
      expect(isValidAvatarStyle(style)).toBe(true);
    }
  });

  it('accepts the default style', () => {
    expect(isValidAvatarStyle(DEFAULT_AVATAR_STYLE)).toBe(true);
  });

  it('rejects a style outside the curated list', () => {
    expect(isValidAvatarStyle('adventurer')).toBe(false);
    expect(isValidAvatarStyle('not-a-style')).toBe(false);
    expect(isValidAvatarStyle(42)).toBe(false);
  });
});

describe('generateAvatarSeed', () => {
  it('generates a non-empty string', () => {
    expect(generateAvatarSeed().length).toBeGreaterThan(0);
  });

  it('generates different seeds across calls', () => {
    const seeds = new Set(
      Array.from({ length: 20 }, () => generateAvatarSeed()),
    );
    expect(seeds.size).toBeGreaterThan(1);
  });
});

describe('isValidAvatarSeed', () => {
  it('accepts a reasonable non-empty string', () => {
    expect(isValidAvatarSeed('jostle')).toBe(true);
  });

  it('rejects an empty or whitespace-only string', () => {
    expect(isValidAvatarSeed('')).toBe(false);
    expect(isValidAvatarSeed('   ')).toBe(false);
  });

  it('rejects a seed longer than the max length', () => {
    expect(isValidAvatarSeed('a'.repeat(65))).toBe(false);
    expect(isValidAvatarSeed('a'.repeat(64))).toBe(true);
  });

  it('rejects non-string values', () => {
    expect(isValidAvatarSeed(42)).toBe(false);
    expect(isValidAvatarSeed(null)).toBe(false);
    expect(isValidAvatarSeed(undefined)).toBe(false);
  });
});
