export type AvatarShape = 'circle' | 'square';
export type AvatarMode = 'gradient' | 'image';
export type UploadStatus = 'idle' | 'requesting-intent' | 'uploading' | 'done' | 'error';

export interface AvatarState {
  mode: AvatarMode;
  shape: AvatarShape;
  src: string;
  colors: string[];
  fontColor: string; 
}

export interface ExtractedAvatarProps {
  src: string | undefined;
  alt: string | undefined;
  fallback: string;
  shape: AvatarShape;
  background: string | undefined;
  fontColor: string; 
}

export const extractAvatarProps = (user: any): ExtractedAvatarProps => ({
  src: user?.user_avatar?.src,
  alt: user?.user_avatar?.alt,
  fallback: user?.user_avatar?.fallback || '??',
  shape: (user?.user_avatar?.shape as AvatarShape) || 'circle',
  background: user?.user_avatar?.background,
  fontColor: user?.user_avatar?.fontColor ?? '#ffffff',
});

export const parseInitialColors = (background: string | undefined): string[] => {
  if (!background) return ['#0f5066, #e2e8f0'];
  const hexMatches = background.match(/#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}/g);
  return hexMatches && hexMatches.length > 0 ? hexMatches : ['#0f5066, #e2e8f0'];
};

export const compileGradient = (colors: string[]): string => {
  if (colors.length === 0) return '';
  if (colors.length === 1) return colors[0];
  return `linear-gradient(135deg, ${colors.join(', ')})`;
};

const origin = import.meta.env.VITE_API_ORIGIN;

export const buildProxyUrl = (assetId: string): string =>
  `${origin}/api/assets/by-id/${assetId}`;