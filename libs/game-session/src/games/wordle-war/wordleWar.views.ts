import { toStandings as toRosterStandings } from '../shared';
import { keyboardOf } from './evaluate';
import { boardOf } from './wordleWar.reducer';
import type {
  WordleWarBoard,
  WordleWarPrivateView,
  WordleWarProgress,
  WordleWarPublicView,
  WordleWarStanding,
  WordleWarState,
  WordleWarStatus,
} from './wordleWar.types';

// What each screen may see. The rules that matter: the word reaches nobody before its reveal, and
// a player's letters reach nobody but that player - everyone else (the host screen included) sees
// only the colors.

const lastRound = (state: WordleWarState) => (state.phase === 'reveal' ? state.results.at(-1) : undefined);

const statusOf = (board: WordleWarBoard): WordleWarStatus => (board.place !== null ? 'solved' : board.lockedOut ? 'out' : 'playing');

export const toStandings = (state: WordleWarState): WordleWarStanding[] =>
  toRosterStandings(state.roster, state.totals, (participantId) => lastRound(state)?.scores[participantId]?.points ?? 0);

const toProgress = (board: WordleWarBoard): WordleWarProgress => ({
  rows: board.guesses.map(({ marks }) => marks),
  guessCount: board.guesses.length,
  status: statusOf(board),
  place: board.place,
});

export const wordleWarPublicView = (state: WordleWarState): WordleWarPublicView => {
  const round = lastRound(state);
  return {
    phase: state.phase,
    roundNumber: state.index + 1,
    roundCount: state.secrets.length,
    wordLength: state.config.wordLength,
    maxGuesses: state.config.maxGuesses,
    phaseEndsAt: state.phaseEndsAt,
    pausedRemainingMs: state.pausedRemainingMs,
    paused: state.paused,
    autoPaused: state.autoPaused,
    revealMs: state.config.revealMs,
    roster: state.roster,
    progress: Object.fromEntries(state.roster.map((participantId) => [participantId, toProgress(boardOf(state, participantId))])),
    standings: toStandings(state),
    secret: round?.secret ?? null,
    roundScores: round?.scores ?? null,
  };
};

export const wordleWarPrivateView = (state: WordleWarState, participantId: string): WordleWarPrivateView => {
  const board = boardOf(state, participantId);
  const standing = toStandings(state).find((candidate) => candidate.participantId === participantId);
  return {
    isPlaying: state.roster.includes(participantId),
    guesses: board.guesses,
    status: statusOf(board),
    place: board.place,
    keyboard: keyboardOf(board.guesses),
    lastResult: lastRound(state)?.scores[participantId] ?? null,
    total: state.totals[participantId] ?? 0,
    rank: standing?.rank ?? null,
    playerCount: state.roster.length,
  };
};
