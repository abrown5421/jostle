import { describe, expect, it } from 'vitest';
import { deltaE2000, hexDeltaE, hexToLab, hslToHex, isHexColor, rgbToHex } from './color';

describe('Point of Hue color math', () => {
  // Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference Formula: Implementation Notes,
  // Supplementary Test Data, and Mathematical Observations" - table 1, selected pairs covering
  // the hue-wraparound, neutral-axis and blue-region corner cases.
  it.each([
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[50, 2.5, 0], [56, -27, -3], 31.903],
    [[50, 2.5, 0], [50, 3.1736, 0.5854], 1],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
  ])('ΔE00 of %j and %j is %d', ([L1, a1, b1], [L2, a2, b2], expected) => {
    expect(deltaE2000({ L: L1, a: a1, b: b1 }, { L: L2, a: a2, b: b2 })).toBeCloseTo(expected, 4);
    // Symmetric.
    expect(deltaE2000({ L: L2, a: a2, b: b2 }, { L: L1, a: a1, b: b1 })).toBeCloseTo(expected, 4);
  });

  it('converts sRGB hex to Lab', () => {
    const white = hexToLab('#ffffff');
    expect(white.L).toBeCloseTo(100, 2);
    expect(white.a).toBeCloseTo(0, 2);
    expect(white.b).toBeCloseTo(0, 2);
    expect(hexToLab('#000000').L).toBeCloseTo(0, 5);
    const red = hexToLab('#ff0000');
    expect(red.L).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 1);
    expect(red.b).toBeCloseTo(67.2, 1);
  });

  it('measures identical colors as no difference and very different ones as large', () => {
    expect(hexDeltaE('#3a7bd5', '#3A7BD5')).toBe(0);
    expect(hexDeltaE('#ff0000', '#00ff00')).toBeGreaterThan(50);
  });

  it('builds hex from HSL and validates hex', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000');
    expect(hslToHex(120, 1, 0.5)).toBe('#00ff00');
    expect(hslToHex(240, 1, 0.25)).toBe('#000080');
    expect(hslToHex(0, 0, 1)).toBe('#ffffff');
    expect(rgbToHex({ r: 300, g: -5, b: 15.6 })).toBe('#ff0010');
    expect(isHexColor('#A1b2C3')).toBe(true);
    for (const value of ['#abc', 'a1b2c3', '#a1b2c3d4', '#zzzzzz', 42, null]) expect(isHexColor(value)).toBe(false);
  });
});
