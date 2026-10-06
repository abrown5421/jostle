import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameContext } from '../../contracts/game-definition.contract';
import type { SessionParticipant } from '../../contracts/session.contract';
import { setWordleWarDictionarySource } from './wordleWar.port';
import { MIN_DICTIONARY_SIZE, setWordleWarRandomForTesting, wordleWarGame } from './wordleWar.game';
import { COUNTDOWN_MS } from './wordleWar.reducer';
import type { WordleWarSettings, WordleWarState } from './wordleWar.types';

const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const iso = (ms: number) => new Date(T0 + ms).toISOString();

const SETTINGS: WordleWarSettings = { wordLength: 5, maxGuesses: 3, difficulty: 5, rounds: 2, revealSeconds: 15 };
const DICTIONARY = ['crane', 'react', 'fuzzy', 'about', 'lemon', 'slate', 'pious', 'moody'];
const SECRETS = ['crane', 'lemon'];

const participant = (id: string, isConnected = true): SessionParticipant => ({
  id,
  name: id,
  userId: null,
  avatar: null,
  isConnected,
  joinedAt: iso(0),
});

let participants: SessionParticipant[];

const context = (role: 'host' | 'player' | 'system', at: number, participantId: string | null = null): GameContext => ({
  participants,
  actor: { role, participantId },
  now: iso(at),
});

const handle = wordleWarGame.handleAction;
const host = (state: WordleWarState, action: GameAction, at = 0) => handle(state, action, context('host', at));
const system = (state: WordleWarState, action: GameAction, at = 0) => handle(state, action, context('system', at));
const guess = (state: WordleWarState, id: string, word: string, at = 0) => handle(state, { type: 'guess', payload: { word } }, context('player', at, id));
const timer = (state: WordleWarState, at: number) => system(state, { type: 'timer', payload: { seq: state.timerSeq } }, at);

const create = (settings: Partial<WordleWarSettings> = {}): WordleWarState =>
  wordleWarGame.createInitialState(
    { participants, settings: { ...SETTINGS, ...settings }, now: iso(0), hostUserId: 'host' },
    { dictionary: DICTIONARY, secrets: SECRETS },
  );

const toGuessing = (state: WordleWarState = create()): WordleWarState => {
  const guessing = timer(state, COUNTDOWN_MS).state;
  expect(guessing.phase).toBe('guessing');
  return guessing;
};

beforeEach(() => {
  participants = ['p1', 'p2', 'p3'].map((id) => participant(id));
});

afterEach(() => {
  setWordleWarRandomForTesting(Math.random);
});

describe('Wordle War setup', () => {
  const prepareWith = (count: number, settings: Partial<WordleWarSettings> = {}) => {
    setWordleWarDictionarySource({
      name: 'fake',
      loadDictionary: async () =>
        Array.from({ length: count }, (_, i) => ({ word: `w${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26) % 26)}${String.fromCharCode(97 + Math.floor(i / 676) % 26)}x`, frequency: 1000 - i })),
    });
    return wordleWarGame.prepare!({
      participants,
      settings: { ...SETTINGS, ...settings },
      now: iso(0),
      hostUserId: 'h',
      signal: new AbortController().signal,
    });
  };

  it('fetches the dictionary and draws distinct secrets from the difficulty band', async () => {
    const prepared = await prepareWith(MIN_DICTIONARY_SIZE, { rounds: 3 });
    expect(prepared.dictionary).toHaveLength(MIN_DICTIONARY_SIZE);
    expect(prepared.secrets).toHaveLength(3);
    expect(new Set(prepared.secrets).size).toBe(3);
    prepared.secrets.forEach((secret) => expect(prepared.dictionary).toContain(secret));
  });

  it('refuses to start when the source comes back with too few words', async () => {
    await expect(prepareWith(MIN_DICTIONARY_SIZE - 1)).rejects.toMatchObject({
      code: 'GAME_SETUP_FAILED',
      message: "Couldn't fetch words - try again",
    });
  });

  it('starts with a countdown and empty boards', () => {
    const state = create();
    expect(state).toMatchObject({ phase: 'countdown', phaseEndsAt: iso(COUNTDOWN_MS), roster: ['p1', 'p2', 'p3'], boards: {} });
  });
});

describe('Wordle War guessing', () => {
  it('scores guesses with Wordle marks, rejecting non-words without using a guess', () => {
    let state = toGuessing();
    expect(() => guess(state, 'p1', 'qwert')).toThrow('Not in the word list');
    expect(() => guess(state, 'p1', 'cran')).toThrow('Guesses are 5 letters');
    expect(() => guess(state, 'p1', 'cr4ne')).toThrow('Guesses are 5 letters');
    state = guess(state, 'p1', ' REACT ').state;
    expect(state.boards['p1'].guesses).toEqual([{ word: 'react', marks: ['present', 'present', 'correct', 'present', 'absent'] }]);
  });

  it('never ends the round on the first solve - only once everyone has solved or run out', () => {
    let state = toGuessing();
    state = guess(state, 'p2', 'crane').state;
    expect(state).toMatchObject({ phase: 'guessing' });
    expect(state.boards['p2']).toMatchObject({ place: 1, lockedOut: false });
    expect(() => guess(state, 'p2', 'react')).toThrow('already solved');

    state = guess(state, 'p1', 'react').state;
    state = guess(state, 'p1', 'crane').state;
    expect(state.boards['p1'].place).toBe(2);

    // p3 burns all three guesses - their board locks, and that was the last player still going.
    state = guess(state, 'p3', 'fuzzy').state;
    state = guess(state, 'p3', 'fuzzy').state;
    const ended = guess(state, 'p3', 'about', 10_000);
    expect(ended.state).toMatchObject({ phase: 'reveal', phaseEndsAt: iso(25_000) });
    expect(ended.state.boards['p3']).toMatchObject({ place: null, lockedOut: true });
    // p2: 1st with 2 guesses left; p1: 2nd with 1 left; p3 didn't solve.
    expect(ended.scoreDeltas).toEqual({ p2: 120, p1: 90 });
    expect(ended.state.totals).toEqual({ p1: 90, p2: 120, p3: 0 });
  });

  it('locks a board out of guesses', () => {
    let state = toGuessing();
    ['fuzzy', 'about', 'slate'].forEach((word) => {
      state = guess(state, 'p1', word).state;
    });
    expect(state.boards['p1'].lockedOut).toBe(true);
    expect(() => guess(state, 'p1', 'crane')).toThrow('out of guesses');
  });

  it('does not wait on disconnected players, nor on players who leave', () => {
    participants = [participant('p1'), participant('p2'), participant('p3', false)];
    let state = toGuessing();
    state = guess(state, 'p1', 'crane').state;
    expect(guess(state, 'p2', 'crane').state.phase).toBe('reveal');

    participants = [participant('p1'), participant('p2'), participant('p3')];
    state = guess(toGuessing(), 'p1', 'crane').state;
    state = guess(state, 'p2', 'crane').state;
    expect(state.phase).toBe('guessing');
    participants = participants.filter(({ id }) => id !== 'p3');
    const after = system(state, { type: SYSTEM_ACTIONS.participantsChanged });
    expect(after.state).toMatchObject({ phase: 'reveal', roster: ['p1', 'p2'] });
  });

  it('lets the host end the round, locking whoever is still going', () => {
    let state = guess(toGuessing(), 'p1', 'crane').state;
    const ended = host(state, { type: 'skip' }, 1_000);
    expect(ended.state.phase).toBe('reveal');
    expect(ended.state.boards['p2']).toMatchObject({ lockedOut: true, place: null });
    expect(ended.scoreDeltas).toEqual({ p1: 120 });
    state = ended.state;
    expect(() => guess(state, 'p2', 'crane')).toThrow('Guessing is closed');
  });

  it('plays every round, then finishes', () => {
    let state = toGuessing();
    state = host(state, { type: 'skip' }).state;
    state = timer(state, 30_000).state;
    expect(state).toMatchObject({ phase: 'guessing', index: 1, boards: {} });
    state = guess(state, 'p1', 'lemon').state;
    state = host(state, { type: 'skip' }).state;
    state = timer(state, 60_000).state;
    expect(state.phase).toBe('final');
    expect(wordleWarGame.nextTimeout!(state)).toBeNull();
    expect(host(state, { type: 'back-to-lobby' }).complete).toBe(true);
  });

  it('ignores stale timers, pauses only timed phases, and keeps roles straight', () => {
    const counting = create();
    const skipped = host(counting, { type: 'skip' }).state;
    expect(system(skipped, { type: 'timer', payload: { seq: counting.timerSeq } }, COUNTDOWN_MS).state).toBe(skipped);
    expect(host(skipped, { type: 'pause' }).state).toBe(skipped);
    expect(host(counting, { type: 'pause' }, 1_000).state).toMatchObject({ paused: true, pausedRemainingMs: 4_000 });
    expect(() => guess(counting, 'p1', 'crane')).toThrow('Guessing is closed');
    expect(() => host(skipped, { type: 'guess', payload: { word: 'crane' } })).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => handle(skipped, { type: 'skip' }, context('player', 0, 'p1'))).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => handle(skipped, { type: 'timer', payload: { seq: 1 } }, context('player', 0, 'p1'))).toThrow(
      expect.objectContaining({ code: 'NOT_AUTHORIZED' }),
    );
  });
});

describe('Wordle War views', () => {
  it('never shows the word, or anyone’s letters but your own, before the reveal', () => {
    let state = create();
    const secret = SECRETS[0];
    const leaks = (viewer: string) =>
      JSON.stringify([wordleWarGame.publicView!(state), wordleWarGame.privateView!(state, viewer)]);

    expect(leaks('p1')).not.toContain(secret);
    state = toGuessing(state);
    state = guess(state, 'p1', 'react').state;
    state = guess(state, 'p2', 'crane').state;
    // p3 sees neither p1's letters nor p2's winning word - only colors.
    const seenByP3 = leaks('p3');
    expect(seenByP3).not.toContain('react');
    expect(seenByP3).not.toContain(secret);
    expect(wordleWarGame.publicView!(state).progress['p1']).toEqual({
      rows: [['present', 'present', 'correct', 'present', 'absent']],
      guessCount: 1,
      status: 'playing',
      place: null,
    });
    expect(wordleWarGame.publicView!(state).progress['p2']).toMatchObject({ status: 'solved', place: 1 });
    // Each player sees their own letters and keyboard.
    expect(wordleWarGame.privateView!(state, 'p1')).toMatchObject({
      guesses: [{ word: 'react' }],
      status: 'playing',
      keyboard: { r: 'present', e: 'present', a: 'correct', c: 'present', t: 'absent' },
    });
  });

  it('reveals the word, the round’s points and standings', () => {
    let state = guess(toGuessing(), 'p1', 'crane').state;
    state = host(state, { type: 'skip' }).state;
    expect(wordleWarGame.publicView!(state)).toMatchObject({
      phase: 'reveal',
      secret: 'crane',
      roundScores: { p1: { place: 1, points: 120 } },
      standings: [{ participantId: 'p1', total: 120, delta: 120, rank: 1 }, { rank: 2 }, { rank: 2 }],
    });
    expect(wordleWarGame.privateView!(state, 'p1')).toMatchObject({ lastResult: { placementPoints: 100, guessBonus: 20 }, rank: 1 });
    expect(wordleWarGame.privateView!(state, 'p2')).toMatchObject({ lastResult: null, status: 'out' });
  });
});
