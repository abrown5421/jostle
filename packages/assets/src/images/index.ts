import { ASSET_BASE_URL } from '../base-url.js';

/**
 * Add new images to public/images/ and register them here — never
 * reference a raw path from consuming code. `logo` and `favicon` share
 * the same placeholder file for now (there's no real brand mark yet);
 * replace either one independently once real assets exist.
 */
export const images = {
  favicon: `${ASSET_BASE_URL}/favicon.ico`,
  logo: `${ASSET_BASE_URL}/favicon.ico`,
} as const;

export type ImageKey = keyof typeof images;
