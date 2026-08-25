import type { BannerConfig } from './banner-config.js';

export interface Triangle {
  points: string;
  fill: string;
}

type Point = [number, number];

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.trim().replace('#', '');
  const full =
    normalized.length === 3
      ? normalized.replace(/./g, (c) => c + c)
      : normalized;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHexColor([r, g, b]: [number, number, number]): string {
  const channel = (value: number) =>
    clampChannel(value).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function mixColors(colorA: string, colorB: string, t: number): string {
  const [r1, g1, b1] = parseHexColor(colorA);
  const [r2, g2, b2] = parseHexColor(colorB);
  return toHexColor([
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  ]);
}

export function sampleColorScale(colors: string[], t: number): string {
  if (colors.length === 1) return colors[0];
  const clamped = Math.min(1, Math.max(0, t));
  const segment = clamped * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(segment));
  return mixColors(colors[index], colors[index + 1], segment - index);
}

function edgePinnedCoordinate(
  index: number,
  maxIndex: number,
  extent: number,
): number {
  if (index === 0) return 0;
  if (index === maxIndex) return extent;
  return (index * extent) / maxIndex;
}

function vertexAt(
  col: number,
  row: number,
  cols: number,
  rows: number,
  width: number,
  height: number,
  jitter: number,
): Point {
  const isEdgeCol = col === 0 || col === cols;
  const isEdgeRow = row === 0 || row === rows;
  const baseX = edgePinnedCoordinate(col, cols, width);
  const baseY = edgePinnedCoordinate(row, rows, height);
  const offsetX = isEdgeCol ? 0 : (hash2(col, row) * 2 - 1) * jitter;
  const offsetY = isEdgeRow ? 0 : (hash2(row, col) * 2 - 1) * jitter;
  return [baseX + offsetX, baseY + offsetY];
}

function pointsAttribute(a: Point, b: Point, c: Point): string {
  return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`;
}

export function generateTriangleMesh(
  config: BannerConfig,
  width: number,
  height: number,
): Triangle[] {
  const { cellSize, variance, xColors, yColors } = config;
  const cols = Math.max(1, Math.round(width / cellSize));
  const rows = Math.max(1, Math.round(height / cellSize));
  const jitter = variance * cellSize * 0.5;

  const colorAt = (x: number, y: number): string => {
    const xColor = sampleColorScale(xColors, width === 0 ? 0 : x / width);
    const yColor = sampleColorScale(yColors, height === 0 ? 0 : y / height);
    return mixColors(xColor, yColor, 0.5);
  };

  const triangles: Triangle[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const topLeft = vertexAt(col, row, cols, rows, width, height, jitter);
      const topRight = vertexAt(
        col + 1,
        row,
        cols,
        rows,
        width,
        height,
        jitter,
      );
      const bottomLeft = vertexAt(
        col,
        row + 1,
        cols,
        rows,
        width,
        height,
        jitter,
      );
      const bottomRight = vertexAt(
        col + 1,
        row + 1,
        cols,
        rows,
        width,
        height,
        jitter,
      );
      const splitAscending = hash2(col * 13.7, row * 7.3) > 0.5;

      const halves: [Point, Point, Point][] = splitAscending
        ? [
            [topLeft, topRight, bottomLeft],
            [topRight, bottomRight, bottomLeft],
          ]
        : [
            [topLeft, topRight, bottomRight],
            [topLeft, bottomRight, bottomLeft],
          ];

      for (const [a, b, c] of halves) {
        const centroidX = (a[0] + b[0] + c[0]) / 3;
        const centroidY = (a[1] + b[1] + c[1]) / 3;
        triangles.push({
          points: pointsAttribute(a, b, c),
          fill: colorAt(centroidX, centroidY),
        });
      }
    }
  }

  return triangles;
}
