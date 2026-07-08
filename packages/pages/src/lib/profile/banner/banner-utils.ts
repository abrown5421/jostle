export type BannerMode = 'trianglify' | 'image';


export interface BannerState {
  mode: BannerMode;
  src: string;
  variance: number;
  cellSize: number;
  xColors: string[];
  yColors: string[];
}

export interface ExtractedBannerProps {
  mode: BannerMode;
  src: string | undefined;
  variance: number;
  cellSize: number;
  xColors: string[];
  yColors: string[];
}

const DEFAULT_X_COLORS = ['#E86200', '#1a7a9a'];
const DEFAULT_Y_COLORS = ['#e2e8f0', '#94a3b8'];
const DEFAULT_VARIANCE = 0.75;
const DEFAULT_CELL_SIZE = 60;

const parseColorArray = (raw: string[] | string | undefined, fallback: string[]): string[] => {
  if (!raw) return fallback;
  if (Array.isArray(raw)) return raw.length > 0 ? raw : fallback;
  const hexMatches = raw.match(/#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}/g);
  return hexMatches && hexMatches.length > 0 ? hexMatches : fallback;
};

export const extractBannerProps = (user: any): ExtractedBannerProps => {
  const src = user?.user_banner?.src;
  return {
    mode: src ? 'image' : 'trianglify',
    src,
    variance: user?.user_banner?.variance ?? DEFAULT_VARIANCE,
    cellSize: user?.user_banner?.cell_size ?? DEFAULT_CELL_SIZE,
    xColors: parseColorArray(user?.user_banner?.x_colors, DEFAULT_X_COLORS),
    yColors: parseColorArray(user?.user_banner?.y_colors, DEFAULT_Y_COLORS),
  };
};

export const clampVariance = (v: number): number => Math.min(1, Math.max(0, v));
export const clampCellSize = (v: number): number => Math.min(200, Math.max(10, v));