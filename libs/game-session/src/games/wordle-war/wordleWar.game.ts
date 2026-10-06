import type { GameDefinition } from '../../contracts/game-definition.contract';
import { GameSessionError } from '../../service/session.errors';
import { addMs, phaseTimeout } from '../shared';
import { getWordleWarDictionarySource, WORDS_UNAVAILABLE_MESSAGE } from './wordleWar.port';
import { COUNTDOWN_MS, handleWordleWarAction } from './wordleWar.reducer';
import type { WordleWarSettings, WordleWarState } from './wordleWar.types';
import { WORDLE_WAR_GAME_ID } from './wordleWar.types';
import { wordleWarPrivateView, wordleWarPublicView } from './wordleWar.views';
import { filterDictionary, pickSecrets, secretPoolFor } from './words';

// Fewer real words than this for a length means the source let us down - better to refuse than to
// reject half of everyone's guesses.
export const MIN_DICTIONARY_SIZE = 200;

export interface WordleWarPrepared {
  readonly dictionary: readonly string[];
  readonly secrets: readonly string[];
}

let random: () => number = Math.random;

export const setWordleWarRandomForTesting = (next: () => number): void => {
  random = next;
};

export const wordleWarGame: GameDefinition<WordleWarState, WordleWarSettings, WordleWarPrepared> = {
  id: WORDLE_WAR_GAME_ID,
  // The dictionary (every word a guess may be) and every round's word are settled before anyone
  // plays, so guessing never waits on the network.
  prepare: async ({ settings, signal }) => {
    const dictionary = filterDictionary(await getWordleWarDictionarySource().loadDictionary(settings.wordLength, signal), settings.wordLength);
    const pool = secretPoolFor(dictionary, settings.difficulty);
    if (dictionary.length < MIN_DICTIONARY_SIZE || pool.length < settings.rounds) {
      throw new GameSessionError('GAME_SETUP_FAILED', WORDS_UNAVAILABLE_MESSAGE);
    }
    return { dictionary: dictionary.map(({ word }) => word), secrets: pickSecrets(pool, settings.rounds, random) };
  },
  createInitialState: ({ participants, settings, now }, { dictionary, secrets }) => ({
    config: { wordLength: settings.wordLength, maxGuesses: settings.maxGuesses, revealMs: settings.revealSeconds * 1000 },
    dictionary,
    secrets,
    index: 0,
    phase: 'countdown',
    phaseEndsAt: addMs(now, COUNTDOWN_MS),
    pausedRemainingMs: null,
    paused: false,
    autoPaused: false,
    timerSeq: 0,
    roster: participants.map(({ id }) => id),
    boards: {},
    solveCount: 0,
    results: [],
    totals: Object.fromEntries(participants.map(({ id }) => [id, 0])),
  }),
  handleAction: handleWordleWarAction,
  nextTimeout: phaseTimeout,
  publicView: wordleWarPublicView,
  privateView: wordleWarPrivateView,
};
