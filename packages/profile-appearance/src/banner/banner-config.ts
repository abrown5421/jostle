export interface BannerConfig {
  cellSize: number;
  variance: number;
  xColors: string[];
  yColors: string[];
}

export const MIN_CELL_SIZE = 24;
export const MAX_CELL_SIZE = 140;
export const MIN_VARIANCE = 0;
export const MAX_VARIANCE = 1;
export const MIN_COLORS_PER_AXIS = 1;
export const MAX_COLORS_PER_AXIS = 8;

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  cellSize: 64,
  variance: 0.5,
  xColors: ['#fd6b00', '#02d7e0'],
  yColors: ['#6609f6', '#080f72'],
};

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim());
}

export function isValidColorList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= MIN_COLORS_PER_AXIS &&
    value.length <= MAX_COLORS_PER_AXIS &&
    value.every(isValidHexColor)
  );
}

export function isValidCellSize(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_CELL_SIZE &&
    value <= MAX_CELL_SIZE
  );
}

export function isValidVariance(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_VARIANCE &&
    value <= MAX_VARIANCE
  );
}

export function isValidBannerConfig(value: unknown): value is BannerConfig {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isValidCellSize(candidate.cellSize) &&
    isValidVariance(candidate.variance) &&
    isValidColorList(candidate.xColors) &&
    isValidColorList(candidate.yColors)
  );
}
