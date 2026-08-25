// blobs, disco, waves, critters, moods, landscape, and planets only exist
// from 10.x onward — 9.x 404s on all seven, so this can't be pinned back.
const DICEBEAR_VERSION = '10.x';
const MAX_SEED_LENGTH = 64;

export const AVATAR_STYLES = [
  'blobs',
  'disco',
  'glass',
  'identicon',
  'rings',
  'shapes',
  'waves',
  'avataaars',
  'bottts',
  'critters',
  'moods',
  'landscape',
  'planets',
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

export const DEFAULT_AVATAR_STYLE: AvatarStyle = 'avataaars';

export function isValidAvatarStyle(value: unknown): value is AvatarStyle {
  return (
    typeof value === 'string' &&
    (AVATAR_STYLES as readonly string[]).includes(value)
  );
}

export function resolveDicebearAvatarUrl(
  seed: string,
  style: AvatarStyle,
): string {
  return `https://api.dicebear.com/${DICEBEAR_VERSION}/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export function generateAvatarSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function isValidAvatarSeed(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_SEED_LENGTH;
}
