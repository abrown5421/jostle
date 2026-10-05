// How iPod War decides whether a typed guess names the song, and what it's worth. Pure and
// deterministic - the reducer grades each lock-in once, on the server.

export const POINTS_PER_FIELD = 100;
export const MAX_SPEED_BONUS = 50;
// Difficulty 1 accepts a guess this similar to the answer; difficulty 10 needs an exact match
// (after normalization). Linear in between.
export const LOWEST_THRESHOLD = 0.6;
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 10;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

// Case, accents, punctuation and spacing never count against a guess - nor does a leading "The"
// ("beatles" is "The Beatles"). Apostrophes and dots vanish rather than becoming spaces, so
// "dont" is "Don't" and "pod" is "P.O.D.".
export const normalizeAnswer = (raw: string): string =>
  raw
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`.]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^the /, '');

const DECORATION_KEYWORDS =
  /\b(remaster(ed)?|live|edit|version|mix|remix|mono|stereo|demo|acoustic|deluxe|edition|single|radio|bonus|explicit|instrumental|anniversary|\d{4})\b/i;

// Strips what streaming services bolt onto names: any (...) or [...] segment ("(feat. X)",
// "[Live]", "(Deluxe Edition)"), a " - Remastered 2011"-style tail, and a trailing "feat. X".
export const stripDecorations = (raw: string): string => {
  let stripped = raw.replace(/\s*[([][^)\]]*[)\]]/g, ' ');
  const dash = stripped.search(/\s[-–—]\s/);
  if (dash > 0 && DECORATION_KEYWORDS.test(stripped.slice(dash))) stripped = stripped.slice(0, dash);
  return stripped.replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, '').trim();
};

// The forms of a name a guess may match: as written, and without its decorations - both kept, so
// "(I Can't Get No) Satisfaction" accepts either "satisfaction" or the full title.
export const answerVariants = (raw: string): string[] => {
  const variants = new Set([normalizeAnswer(raw), normalizeAnswer(stripDecorations(raw))]);
  variants.delete('');
  return [...variants];
};

// Optimal string alignment distance: Levenshtein plus adjacent transpositions ("teh" -> "the"),
// the commonest typo.
const editDistance = (a: string, b: string): number => {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
};

// 1 for identical, falling to 0 as the edit distance approaches the longer string's length.
export const similarity = (a: string, b: string): number => {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 0;
  return 1 - editDistance(a, b) / longest;
};

export const thresholdForDifficulty = (difficulty: number): number =>
  LOWEST_THRESHOLD +
  ((clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY) - MIN_DIFFICULTY) * (1 - LOWEST_THRESHOLD)) / (MAX_DIFFICULTY - MIN_DIFFICULTY);

// Whether a guess names any of `answers` (a song's credited artists, or its one title/album).
export const isAnswerMatch = (guess: string, answers: readonly string[], difficulty: number): boolean => {
  if (guess.trim() === '') return false;
  const guesses = answerVariants(guess);
  const threshold = thresholdForDifficulty(difficulty);
  return answers.some((answer) => {
    const variants = answerVariants(answer);
    // A name that's all punctuation/emoji normalizes to nothing - fall back to the raw text.
    if (variants.length === 0) return answer.trim() !== '' && answer.trim().toLowerCase() === guess.trim().toLowerCase();
    return variants.some((variant) => guesses.some((candidate) => isCloseEnough(candidate, variant, threshold)));
  });
};

// Spacing is never held against anyone ("acdc" is "AC/DC", "beyonce" is "Beyoncé").
const isCloseEnough = (guess: string, answer: string, threshold: number): boolean =>
  guess.replace(/ /g, '') === answer.replace(/ /g, '') || similarity(guess, answer) >= threshold - 1e-9;

// Up to MAX_SPEED_BONUS for locking in right as the clip starts, falling linearly to 0 at its end.
export const speedBonus = (elapsedMs: number, clipMs: number): number =>
  clipMs <= 0 ? 0 : Math.round(MAX_SPEED_BONUS * clamp(1 - elapsedMs / clipMs, 0, 1));
