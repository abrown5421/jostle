import { GameSessionError } from '../../service/session.errors';
import type { WordEntry } from './words';

// Where Wordle War's words come from - Datamuse in production. A port, like iPod War's music
// source, so this lib makes no network calls itself: apps/api wires the real one in at boot
// (setWordleWarDictionarySource) and tests wire a fake. Throw a GameSessionError for a failure the
// host should read.
export interface WordleWarDictionarySource {
  readonly name: string;
  // Every word of `length` letters the source knows, with how common it is.
  loadDictionary: (length: number, signal: AbortSignal) => Promise<readonly WordEntry[]>;
}

export const WORDS_UNAVAILABLE_MESSAGE = "Couldn't fetch words - try again";

const unconfiguredDictionarySource: WordleWarDictionarySource = {
  name: 'Unconfigured',
  loadDictionary: async () => {
    throw new GameSessionError('GAME_SETUP_FAILED', WORDS_UNAVAILABLE_MESSAGE);
  },
};

let current: WordleWarDictionarySource = unconfiguredDictionarySource;

export const setWordleWarDictionarySource = (source: WordleWarDictionarySource): void => {
  current = source;
};

export const getWordleWarDictionarySource = (): WordleWarDictionarySource => current;
