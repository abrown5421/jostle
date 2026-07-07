export type GrowthRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface GrowthStatsQuery {
  range?: GrowthRange;
}

export interface GrowthStatsPoint {
  bucket: string;
  count: number;
}

export interface GrowthStatsResult {
  data: readonly GrowthStatsPoint[];
  baselineCount: number;
}
