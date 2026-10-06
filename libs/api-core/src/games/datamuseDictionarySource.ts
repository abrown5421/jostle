import { z } from 'zod';
import { GameSessionError, WORDS_UNAVAILABLE_MESSAGE } from '@inithium/game-session';
import type { WordEntry, WordleWarDictionarySource } from '@inithium/game-session';

// Wordle War's words, from the free Datamuse API (https://www.datamuse.com/api/). A query returns
// at most 1,000 words, ranked by Datamuse's own relevance score rather than frequency - so a full
// result has dropped real, common words (one "c????" query misses "crops"). The dictionary for a
// length is gathered by spelling pattern - with frequencies and parts of speech (md=fp) - one query
// per first letter ("a????", ...), and any query that comes back full is split one letter deeper
// ("ca???", "cb???", ...) until none is. Requests run a few at a time, and each length is cached
// for a day since dictionaries rarely change.

const API_URL = 'https://api.datamuse.com/words';
const MAX_PER_QUERY = 1000;
const MAX_CONCURRENT_REQUESTS = 12;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const datamuseResponseSchema = z.array(z.object({ word: z.string(), tags: z.array(z.string()).optional() }));

// Datamuse reports frequency as a tag like "f:12.345678" (occurrences per million words).
const frequencyOf = (tags: readonly string[] | undefined): number => {
  const tag = tags?.find((candidate) => candidate.startsWith('f:'));
  const value = tag ? Number(tag.slice(2)) : 0;
  return Number.isFinite(value) ? value : 0;
};

export const datamuseQueryUrl = (prefix: string, length: number): string => {
  const params = new URLSearchParams({ sp: `${prefix}${'?'.repeat(length - prefix.length)}`, md: 'fp', max: String(MAX_PER_QUERY) });
  return `${API_URL}?${params.toString()}`;
};

type Limit = <T>(task: () => Promise<T>) => Promise<T>;

// Runs at most `size` tasks at once, queueing the rest.
const createLimit = (size: number): Limit => {
  let running = 0;
  const waiting: Array<() => void> = [];
  const release = () => {
    running -= 1;
    waiting.shift()?.();
  };
  return async (task) => {
    if (running >= size) await new Promise<void>((resolve) => waiting.push(resolve));
    running += 1;
    try {
      return await task();
    } finally {
      release();
    }
  };
};

const fetchPattern = async (prefix: string, length: number, signal: AbortSignal): Promise<WordEntry[]> => {
  const response = await fetch(datamuseQueryUrl(prefix, length), { signal });
  if (!response.ok) throw new Error(`Datamuse responded ${response.status}`);
  return datamuseResponseSchema
    .parse(await response.json())
    .map(({ word, tags }) => ({ word, frequency: frequencyOf(tags), properNoun: tags?.includes('prop') ?? false }));
};

const gather = async (prefix: string, length: number, signal: AbortSignal, limit: Limit): Promise<WordEntry[]> => {
  const words = await limit(() => fetchPattern(prefix, length, signal));
  if (words.length < MAX_PER_QUERY || prefix.length >= length - 1) return words;
  const deeper = await Promise.all(Array.from(LETTERS, (letter) => gather(`${prefix}${letter}`, length, signal, limit)));
  return [...words, ...deeper.flat()];
};

const cache = new Map<number, { readonly loadedAt: number; readonly words: readonly WordEntry[] }>();

export const clearDatamuseCache = (): void => cache.clear();

export const datamuseDictionarySource: WordleWarDictionarySource = {
  name: 'Datamuse',
  loadDictionary: async (length, signal) => {
    const cached = cache.get(length);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached.words;
    try {
      const limit = createLimit(MAX_CONCURRENT_REQUESTS);
      const words = (await Promise.all(Array.from(LETTERS, (letter) => gather(letter, length, signal, limit)))).flat();
      cache.set(length, { loadedAt: Date.now(), words });
      return words;
    } catch (error) {
      console.error('Loading words from Datamuse failed:', error);
      throw new GameSessionError('GAME_SETUP_FAILED', WORDS_UNAVAILABLE_MESSAGE);
    }
  },
};
