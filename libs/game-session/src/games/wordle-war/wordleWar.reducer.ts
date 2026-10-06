import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameActionResult, GameContext } from '../../contracts/game-definition.contract';
import {
  enterTimedPhase,
  enterUntimedPhase,
  everyConnectedRosterMember,
  invalidAction as invalid,
  isCurrentTimer,
  isHostConnected,
  isRecord,
  pausePhase,
  pruneRoster,
  requireRole,
  resumePhase,
  TIMER_ACTION,
} from '../shared';
import { evaluateGuess, isSolved, isWellFormedGuess, normalizeGuess } from './evaluate';
import { scoreSolve } from './scoring';
import type { WordleWarBoard, WordleWarRoundScore, WordleWarState } from './wordleWar.types';

// Wordle War's state machine:
//
//   countdown -> guessing --everyone solved or out | host ends it--> reveal -> guessing (next word)
//   ... -> final --back-to-lobby--> (complete)
//
// Solving first never ends a round - everyone plays on for their place. Only countdown and reveal
// are timed (../shared/timedPhases).

export const COUNTDOWN_MS = 5_000;

type Result = GameActionResult<WordleWarState>;

const EMPTY_BOARD: WordleWarBoard = { guesses: [], place: null, lockedOut: false };

// Guesses are checked against the game's dictionary many times a round; the Set is built once
// per dictionary.
const dictionarySets = new WeakMap<readonly string[], ReadonlySet<string>>();
const dictionarySetOf = (dictionary: readonly string[]): ReadonlySet<string> => {
  const cached = dictionarySets.get(dictionary);
  if (cached) return cached;
  const built = new Set(dictionary);
  dictionarySets.set(dictionary, built);
  return built;
};

export const boardOf = (state: WordleWarState, participantId: string): WordleWarBoard => state.boards[participantId] ?? EMPTY_BOARD;

const isFinished = (board: WordleWarBoard): boolean => board.place !== null || board.lockedOut;

const startRound = (state: WordleWarState, index: number): WordleWarState => ({
  ...enterUntimedPhase(state),
  index,
  phase: 'guessing',
  boards: {},
  solveCount: 0,
});

// Only the countdown and the reveal run on a clock - guessing waits on the players, so there's
// nothing to pause.
export const isTimedPhase = (state: WordleWarState): boolean => state.phase === 'countdown' || state.phase === 'reveal';

const toFinal = (state: WordleWarState): WordleWarState => ({ ...enterUntimedPhase(state), phase: 'final' });

// The round's over: solvers are scored (into the totals, and the session's scores via the deltas),
// anyone still playing is locked out, and everyone sees the word.
const endRound = (state: WordleWarState, now: string): Result => {
  const scores: Record<string, WordleWarRoundScore> = {};
  state.roster.forEach((participantId) => {
    const board = boardOf(state, participantId);
    if (board.place !== null) scores[participantId] = scoreSolve(board.place, board.guesses.length, state.config.maxGuesses);
  });
  const scoreDeltas = Object.fromEntries(Object.entries(scores).map(([participantId, { points }]) => [participantId, points]));
  const totals = { ...state.totals };
  Object.entries(scoreDeltas).forEach(([participantId, points]) => {
    totals[participantId] = (totals[participantId] ?? 0) + points;
  });
  const boards = Object.fromEntries(
    state.roster.map((participantId) => {
      const board = boardOf(state, participantId);
      return [participantId, isFinished(board) ? board : { ...board, lockedOut: true }];
    }),
  );
  return {
    state: {
      ...enterTimedPhase(state, now, state.config.revealMs),
      phase: 'reveal',
      boards,
      results: [...state.results, { roundIndex: state.index, secret: state.secrets[state.index], scores }],
      totals,
    },
    scoreDeltas,
  };
};

const nextRound = (state: WordleWarState): WordleWarState =>
  state.index + 1 < state.secrets.length ? startRound(state, state.index + 1) : toFinal(state);

const everyoneFinished = (state: WordleWarState, context: GameContext): boolean =>
  everyConnectedRosterMember(state.roster, context.participants, (participantId) => isFinished(boardOf(state, participantId)));

const maybeEndRound = (state: WordleWarState, context: GameContext): Result =>
  state.phase === 'guessing' && everyoneFinished(state, context) ? endRound(state, context.now) : { state };

const readWord = (state: WordleWarState, payload: unknown): string => {
  const raw = isRecord(payload) ? payload['word'] : undefined;
  if (typeof raw !== 'string') throw invalid('Send your guess as a word');
  const word = normalizeGuess(raw);
  if (!isWellFormedGuess(word, state.config.wordLength)) throw invalid(`Guesses are ${state.config.wordLength} letters`);
  if (word !== state.secrets[state.index] && !dictionarySetOf(state.dictionary).has(word)) throw invalid('Not in the word list');
  return word;
};

const handleGuess = (state: WordleWarState, payload: unknown, context: GameContext): Result => {
  const participantId = context.actor.participantId;
  if (!participantId || !state.roster.includes(participantId)) throw invalid("You're not in this game");
  if (state.phase !== 'guessing') throw invalid('Guessing is closed');
  const board = boardOf(state, participantId);
  if (board.place !== null) throw invalid('You’ve already solved it');
  if (board.lockedOut) throw invalid('You’re out of guesses');

  const word = readWord(state, payload);
  const marks = evaluateGuess(word, state.secrets[state.index]);
  const guesses = [...board.guesses, { word, marks }];
  const solved = isSolved(marks);
  const solveCount = solved ? state.solveCount + 1 : state.solveCount;
  const next: WordleWarBoard = {
    guesses,
    place: solved ? solveCount : null,
    lockedOut: !solved && guesses.length >= state.config.maxGuesses,
  };
  return maybeEndRound({ ...state, solveCount, boards: { ...state.boards, [participantId]: next } }, context);
};

const handleTimer = (state: WordleWarState, payload: unknown): Result => {
  if (!isCurrentTimer(state, payload)) return { state };
  switch (state.phase) {
    case 'countdown':
      return { state: startRound(state, 0) };
    case 'reveal':
      return { state: nextRound(state) };
    default:
      return { state };
  }
};

const handleHostAction = (state: WordleWarState, action: GameAction, context: GameContext): Result => {
  const { now } = context;
  switch (action.type) {
    case 'pause':
      return isTimedPhase(state) && !state.paused ? { state: pausePhase(state, now, false) } : { state };
    case 'resume':
      return state.paused ? { state: resumePhase(state, now) } : { state };
    case 'skip':
      switch (state.phase) {
        case 'countdown':
          return { state: startRound(state, 0) };
        case 'guessing':
          return endRound(state, now);
        case 'reveal':
          return { state: nextRound(state) };
        default:
          return { state };
      }
    case 'end':
      // The round in progress (if any) is abandoned unscored.
      return state.phase === 'final' ? { state } : { state: toFinal(state) };
    case 'back-to-lobby':
      if (state.phase !== 'final') throw invalid('Finish the game first');
      return { state, complete: true };
    default:
      throw invalid(`Unknown action "${action.type}"`);
  }
};

export const handleWordleWarAction = (state: WordleWarState, action: GameAction, context: GameContext): Result => {
  switch (action.type) {
    case TIMER_ACTION:
      requireRole(context, 'system');
      return handleTimer(state, action.payload);
    case SYSTEM_ACTIONS.participantsChanged: {
      requireRole(context, 'system');
      const roster = pruneRoster(state.roster, context.participants);
      return maybeEndRound(roster === state.roster ? state : { ...state, roster }, context);
    }
    case SYSTEM_ACTIONS.hostConnection:
      requireRole(context, 'system');
      if (isHostConnected(action.payload) || state.paused || !isTimedPhase(state)) return { state };
      return { state: pausePhase(state, context.now, true) };
    case 'guess':
      requireRole(context, 'player');
      return handleGuess(state, action.payload, context);
    default:
      requireRole(context, 'host');
      return handleHostAction(state, action, context);
  }
};
