// Sound effects served from /public/sounds. Each play gets a fresh Audio so overlapping cues
// (two players joining at once) don't cut each other off.
const SOUND_URLS = {
  join: '/sounds/join.mp3',
  leave: '/sounds/leave.mp3',
  submit: '/sounds/submit.mp3',
} as const;

export type SoundName = keyof typeof SOUND_URLS;

export const playSound = (name: SoundName): void => {
  // Browsers reject play() until the page has had a user gesture; a missed cue isn't worth surfacing.
  void new Audio(SOUND_URLS[name]).play().catch(() => undefined);
};
