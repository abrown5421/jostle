import type { PlayerStanding } from '../shared/roster';
import type { TimedPhaseState } from '../shared/timedPhases';

// Wordle War's state, actions and views. The view and action types are what the web client codes
// against (imported type-only via @inithium/game-session), so they're the game's wire contract.

export const WORDLE_WAR_GAME_ID = 'wordle-war';

// The catalogue record's settings (libs/db/src/game-seeds/wordle-war.game-seed.ts), as validated.
export type WordleWarSettings = {
  wordLength: number;
  maxGuesses: number;
  difficulty: number;
  rounds: number;
  revealSeconds: number;
};

// Wordle's three verdicts on a guessed letter.
export type LetterMark = 'correct' | 'present' | 'absent';

export interface WordleWarGuess {
  readonly word: string;
  readonly marks: readonly LetterMark[];
}

export interface WordleWarBoard {
  readonly guesses: readonly WordleWarGuess[];
  // Solve order this round (1 = first to crack it), null until solved.
  readonly place: number | null;
  // Out of guesses without solving - or still playing when the host ended the round.
  readonly lockedOut: boolean;
}

export interface WordleWarRoundScore {
  readonly place: number;
  readonly guessesUsed: number;
  readonly placementPoints: number;
  readonly guessBonus: number;
  readonly points: number;
}

export interface WordleWarRoundResult {
  readonly roundIndex: number;
  readonly secret: string;
  // Only players who solved it.
  readonly scores: Readonly<Record<string, WordleWarRoundScore>>;
}

// countdown - "get ready" before the first round (timed)
// guessing  - everyone races on the same word; ends once every connected player has solved or run
//             out, or when the host ends it (untimed)
// reveal    - the word, and the round's points (timed), then the next round
// final     - the podium, until the host takes everyone back to the lobby
export type WordleWarPhase = 'countdown' | 'guessing' | 'reveal' | 'final';

export interface WordleWarState extends TimedPhaseState {
  readonly config: {
    readonly wordLength: number;
    readonly maxGuesses: number;
    readonly revealMs: number;
  };
  // Every word a guess may be - fetched once, when the game starts.
  readonly dictionary: readonly string[];
  // Every round's word, drawn up front - secret until each round's reveal.
  readonly secrets: readonly string[];
  readonly index: number;
  readonly phase: WordleWarPhase;
  // Who's playing: everyone seated at the start, minus anyone who leaves or is kicked.
  readonly roster: readonly string[];
  readonly boards: Readonly<Record<string, WordleWarBoard>>;
  readonly solveCount: number;
  readonly results: readonly WordleWarRoundResult[];
  readonly totals: Readonly<Record<string, number>>;
}

// ---- Actions (sent as { type: 'game:action', action }) ----

export type WordleWarHostAction =
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  // Countdown: start now. Guessing: end the round now. Reveal: next round now.
  | { readonly type: 'skip' }
  | { readonly type: 'end' }
  | { readonly type: 'back-to-lobby' };

export type WordleWarPlayerAction = { readonly type: 'guess'; readonly payload: { readonly word: string } };

export type WordleWarAction = WordleWarHostAction | WordleWarPlayerAction;

// ---- Views ----

export type WordleWarStatus = 'playing' | 'solved' | 'out';

// One player's board as everyone sees it - colors only, never letters.
export interface WordleWarProgress {
  readonly rows: readonly (readonly LetterMark[])[];
  readonly guessCount: number;
  readonly status: WordleWarStatus;
  readonly place: number | null;
}

// delta = points from the round just revealed (0 outside the reveal).
export type WordleWarStanding = PlayerStanding;

// Everyone - host screen and every phone. Never holds a letter anyone guessed, nor the word, before
// the reveal.
export interface WordleWarPublicView {
  readonly phase: WordleWarPhase;
  readonly roundNumber: number;
  readonly roundCount: number;
  readonly wordLength: number;
  readonly maxGuesses: number;
  readonly phaseEndsAt: string | null;
  readonly pausedRemainingMs: number | null;
  readonly paused: boolean;
  readonly autoPaused: boolean;
  readonly revealMs: number;
  readonly roster: readonly string[];
  readonly progress: Readonly<Record<string, WordleWarProgress>>;
  readonly standings: readonly WordleWarStanding[];
  // Only in the reveal.
  readonly secret: string | null;
  readonly roundScores: Readonly<Record<string, WordleWarRoundScore>> | null;
}

// One player's phone - their own board, letters and all.
export interface WordleWarPrivateView {
  readonly isPlaying: boolean;
  readonly guesses: readonly WordleWarGuess[];
  readonly status: WordleWarStatus;
  readonly place: number | null;
  // Each letter guessed so far and the best verdict it has earned - for colouring the keyboard.
  readonly keyboard: Readonly<Record<string, LetterMark>>;
  // In the reveal: how this round scored for them (null if they didn't solve it).
  readonly lastResult: WordleWarRoundScore | null;
  readonly total: number;
  readonly rank: number | null;
  readonly playerCount: number;
}
