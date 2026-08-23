/**
 * Font family names, keyed the same way as images/audio, for consumers
 * that need to reference a font in a style (e.g. fontFamily: fonts.body).
 * Add the @font-face rule in ./fonts.css (exported as
 * "@jostle/assets/fonts.css") before adding an entry here — no fonts are
 * self-hosted yet.
 */
export const fonts = {} as const;

export type FontKey = keyof typeof fonts;
