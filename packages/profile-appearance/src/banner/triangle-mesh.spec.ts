import { describe, expect, it } from 'vitest';
import { DEFAULT_BANNER_CONFIG } from './banner-config.js';
import {
  generateTriangleMesh,
  mixColors,
  sampleColorScale,
} from './triangle-mesh.js';

describe('mixColors', () => {
  it('returns the first color at t=0 and the second at t=1', () => {
    expect(mixColors('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('interpolates midway between two colors', () => {
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('sampleColorScale', () => {
  it('returns the single color unchanged for a one-color list', () => {
    expect(sampleColorScale(['#fd6b00'], 0.7)).toBe('#fd6b00');
  });

  it('returns the endpoints at t=0 and t=1', () => {
    const colors = ['#000000', '#ffffff'];
    expect(sampleColorScale(colors, 0)).toBe('#000000');
    expect(sampleColorScale(colors, 1)).toBe('#ffffff');
  });

  it('clamps out-of-range t values', () => {
    const colors = ['#000000', '#ffffff'];
    expect(sampleColorScale(colors, -1)).toBe('#000000');
    expect(sampleColorScale(colors, 2)).toBe('#ffffff');
  });
});

describe('generateTriangleMesh', () => {
  it('is deterministic for the same config and dimensions', () => {
    const a = generateTriangleMesh(DEFAULT_BANNER_CONFIG, 400, 160);
    const b = generateTriangleMesh(DEFAULT_BANNER_CONFIG, 400, 160);
    expect(a).toEqual(b);
  });

  it('produces a non-empty set of triangles covering the canvas', () => {
    const triangles = generateTriangleMesh(DEFAULT_BANNER_CONFIG, 400, 160);
    expect(triangles.length).toBeGreaterThan(0);
    for (const triangle of triangles) {
      expect(triangle.points.split(' ')).toHaveLength(3);
      expect(triangle.fill).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('produces more triangles for a smaller cell size', () => {
    const coarse = generateTriangleMesh(
      { ...DEFAULT_BANNER_CONFIG, cellSize: 120 },
      400,
      160,
    );
    const fine = generateTriangleMesh(
      { ...DEFAULT_BANNER_CONFIG, cellSize: 30 },
      400,
      160,
    );
    expect(fine.length).toBeGreaterThan(coarse.length);
  });

  it('places the first grid vertex exactly at the origin when variance is 0', () => {
    const config = { ...DEFAULT_BANNER_CONFIG, variance: 0 };
    const triangles = generateTriangleMesh(config, 400, 160);
    expect(triangles[0].points.startsWith('0,0 ')).toBe(true);
  });

  it('keeps every triangle vertex within the exact canvas rectangle regardless of variance', () => {
    const width = 400;
    const height = 160;
    for (const variance of [0, 0.5, 1]) {
      const triangles = generateTriangleMesh(
        { ...DEFAULT_BANNER_CONFIG, variance },
        width,
        height,
      );
      for (const triangle of triangles) {
        const points = triangle.points
          .split(' ')
          .map((pair) => pair.split(',').map(Number));
        for (const [x, y] of points) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(height);
        }
      }
    }
  });

  it('fully covers every edge of the canvas even at maximum variance', () => {
    const width = 400;
    const height = 160;
    const triangles = generateTriangleMesh(
      { ...DEFAULT_BANNER_CONFIG, variance: 1 },
      width,
      height,
    );

    const allX = triangles.flatMap((t) =>
      t.points.split(' ').map((pair) => Number(pair.split(',')[0])),
    );
    const allY = triangles.flatMap((t) =>
      t.points.split(' ').map((pair) => Number(pair.split(',')[1])),
    );

    expect(Math.min(...allX)).toBe(0);
    expect(Math.max(...allX)).toBe(width);
    expect(Math.min(...allY)).toBe(0);
    expect(Math.max(...allY)).toBe(height);
  });
});
