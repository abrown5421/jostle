import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BANNER_CONFIG,
  isValidBannerConfig,
  isValidCellSize,
  isValidColorList,
  isValidHexColor,
  isValidVariance,
  MAX_COLORS_PER_AXIS,
} from './banner-config.js';

describe('isValidHexColor', () => {
  it('accepts 3- and 6-digit hex colors', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#fd6b00')).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isValidHexColor('fd6b00')).toBe(false);
    expect(isValidHexColor('#gggggg')).toBe(false);
    expect(isValidHexColor(42)).toBe(false);
  });
});

describe('isValidColorList', () => {
  it('accepts a non-empty list of valid hex colors within the size cap', () => {
    expect(isValidColorList(['#fd6b00', '#02d7e0'])).toBe(true);
  });

  it('rejects an empty list', () => {
    expect(isValidColorList([])).toBe(false);
  });

  it('rejects a list exceeding the max colors per axis', () => {
    expect(isValidColorList(Array(MAX_COLORS_PER_AXIS + 1).fill('#fff'))).toBe(
      false,
    );
  });

  it('rejects a list containing an invalid color', () => {
    expect(isValidColorList(['#fff', 'not-a-color'])).toBe(false);
  });
});

describe('isValidCellSize / isValidVariance', () => {
  it('enforces the cell size bounds', () => {
    expect(isValidCellSize(64)).toBe(true);
    expect(isValidCellSize(1)).toBe(false);
    expect(isValidCellSize(1000)).toBe(false);
  });

  it('enforces the variance bounds', () => {
    expect(isValidVariance(0.5)).toBe(true);
    expect(isValidVariance(-0.1)).toBe(false);
    expect(isValidVariance(1.1)).toBe(false);
  });
});

describe('isValidBannerConfig', () => {
  it('accepts the default config', () => {
    expect(isValidBannerConfig(DEFAULT_BANNER_CONFIG)).toBe(true);
  });

  it('rejects a config missing a field', () => {
    const { xColors: _xColors, ...rest } = DEFAULT_BANNER_CONFIG;
    expect(isValidBannerConfig(rest)).toBe(false);
  });

  it('rejects non-object values', () => {
    expect(isValidBannerConfig(null)).toBe(false);
    expect(isValidBannerConfig('config')).toBe(false);
  });
});
