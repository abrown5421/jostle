/**
 * Add new audio files to public/audio/ and register them here — never
 * reference a raw path from consuming code. Empty until the first sound
 * effect exists; the shape mirrors ./images so adding one is a one-line
 * change, e.g.:
 *
 *   import { ASSET_BASE_URL } from '../base-url.js';
 *   export const audio = {
 *     click: `${ASSET_BASE_URL}/audio/click.mp3`,
 *   } as const;
 */
export const audio = {} as const;

export type AudioKey = keyof typeof audio;
