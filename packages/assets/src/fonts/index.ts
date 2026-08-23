/**
 * Font family names, keyed the same way as images/audio. The
 * corresponding @font-face rule lives in ./fonts.css (exported as
 * "@jostle/assets/fonts.css") — add that before adding an entry here.
 */
export const fonts = {
  primary: 'Jostle Primary',
} as const;

export type FontKey = keyof typeof fonts;
