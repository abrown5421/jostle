import { ASSET_BASE_URL } from '../base-url.js';

/**
 * Add new images to public/images/ and register them here — never
 * reference a raw path from consuming code. `favicon` stays the
 * generated placeholder until a proper multi-resolution .ico exists;
 * `logo` is the real brand mark.
 */
export const images = {
  favicon: `${ASSET_BASE_URL}/favicon.ico`,
  logo: `${ASSET_BASE_URL}/images/jostle.png`,
  /** Per-game branding for games hosted on the platform. */
  gameLogos: {
    fishbowl: `${ASSET_BASE_URL}/images/fishbowl-logo.png`,
    ipodWar: `${ASSET_BASE_URL}/images/ipod-war-logo.png`,
    pointOfHue: `${ASSET_BASE_URL}/images/point-of-hue-logo.png`,
  },
} as const;

export type ImageKey = keyof typeof images;
