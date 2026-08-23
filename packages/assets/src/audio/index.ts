import { ASSET_BASE_URL } from '../base-url.js';

/**
 * Add new audio files to public/audio/ and register them here — never
 * reference a raw path from consuming code.
 */
export const audio = {
  join: `${ASSET_BASE_URL}/audio/join.mp3`,
  leave: `${ASSET_BASE_URL}/audio/leave.mp3`,
  submit: `${ASSET_BASE_URL}/audio/submit.mp3`,
} as const;

export type AudioKey = keyof typeof audio;
