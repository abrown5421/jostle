// Choosing secret words and the guess dictionary from a raw word source (Datamuse in production).

export interface WordEntry {
  readonly word: string;
  // Occurrences per million words of English text.
  readonly frequency: number;
  // A name (Patti, Knesset) - fine as a guess, never the answer.
  readonly properNoun?: boolean;
}

// Secret words are at least this common (per million) - rarer words still count as guesses, but
// they're mostly too obscure (or junk) to be the answer.
export const MIN_FREQUENCY = 0.5;
export const DIFFICULTY_LEVELS = 10;

// Every word a guess may be: plain lowercase words of exactly `length` letters (so no capitalised
// proper nouns, hyphens or phrases), each once, most frequent first.
export const filterDictionary = (entries: readonly WordEntry[], length: number): WordEntry[] => {
  const pattern = new RegExp(`^[a-z]{${length}}$`);
  const byWord = new Map<string, WordEntry>();
  entries.forEach((entry) => {
    if (!pattern.test(entry.word)) return;
    const existing = byWord.get(entry.word);
    if (!existing || entry.frequency > existing.frequency) byWord.set(entry.word, entry);
  });
  return [...byWord.values()].sort((a, b) => b.frequency - a.frequency);
};

// The words a difficulty draws its secrets from: of the dictionary's reasonably common words that
// aren't names (frequency-sorted), 1 is the most common tenth, 10 the rarest.
export const secretPoolFor = (dictionary: readonly WordEntry[], difficulty: number): string[] => {
  const level = Math.min(DIFFICULTY_LEVELS, Math.max(1, Math.round(difficulty)));
  const candidates = dictionary.filter(({ frequency, properNoun }) => frequency >= MIN_FREQUENCY && !properNoun);
  const size = candidates.length / DIFFICULTY_LEVELS;
  return candidates.slice(Math.floor((level - 1) * size), Math.floor(level * size)).map(({ word }) => word);
};

// `count` different words from the pool, at random.
export const pickSecrets = (pool: readonly string[], count: number, random: () => number): string[] => {
  const remaining = [...pool];
  return Array.from({ length: Math.min(count, remaining.length) }, () => remaining.splice(Math.floor(random() * remaining.length), 1)[0]);
};
