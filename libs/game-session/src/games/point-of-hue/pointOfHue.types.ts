import type { PlayerStanding } from '../shared/roster';
import type { TimedPhaseState } from '../shared/timedPhases';
import type { PointOfHueGrade } from './scoring';

// Point of Hue's state, actions and views. The view and action types are what the web client
// codes against (imported type-only via @inithium/game-session), so they're the game's wire
// contract.

export const POINT_OF_HUE_GAME_ID = 'point-of-hue';

// The catalogue record's settings (libs/db/src/game-seeds/point-of-hue.game-seed.ts), as validated.
export type PointOfHueSettings = {
  rounds: number;
  viewSeconds: number;
  guessSeconds: number;
  endWhenAllAnswered: boolean;
  revealSeconds: number;
};

export type { PointOfHueGrade };

// countdown - "get ready" before the first round (timed)
// viewing   - the target shows on the host screen only; phones say "memorize it" (timed)
// guessing  - phones get a color picker (timed)
// reveal    - target vs guesses + leaderboard (timed), then the next round
// final     - the podium, until the host takes everyone back to the lobby
export type PointOfHuePhase = 'countdown' | 'viewing' | 'guessing' | 'reveal' | 'final';

export interface PointOfHueLockIn {
  readonly hex: string;
  // How far into guessing (excluding pauses) they locked in.
  readonly elapsedMs: number;
}

export interface PointOfHueRoundResult {
  readonly roundIndex: number;
  // Ended by the host's Skip rather than time running out (or everyone locking in).
  readonly skipped: boolean;
  // Only players who locked in or at least touched their picker.
  readonly grades: Readonly<Record<string, PointOfHueGrade>>;
}

export interface PointOfHueState extends TimedPhaseState {
  readonly config: {
    readonly viewMs: number;
    readonly guessMs: number;
    readonly revealMs: number;
    readonly endWhenAllAnswered: boolean;
  };
  // Every round's target, drawn up front - secret until each round's reveal.
  readonly targets: readonly string[];
  readonly index: number;
  readonly phase: PointOfHuePhase;
  // Who's playing: everyone seated at the start, minus anyone who leaves or is kicked.
  readonly roster: readonly string[];
  readonly lockIns: Readonly<Record<string, PointOfHueLockIn>>;
  // Each player's current picker color, synced (silently) as they drag - graded if time runs out
  // before they lock in. Absent for a player who never touched their picker.
  readonly drafts: Readonly<Record<string, string>>;
  readonly results: readonly PointOfHueRoundResult[];
  readonly totals: Readonly<Record<string, number>>;
}

// ---- Actions (sent as { type: 'game:action', action }) ----

export type PointOfHueHostAction =
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'skip' }
  | { readonly type: 'end' }
  | { readonly type: 'back-to-lobby' };

export type PointOfHuePlayerAction =
  // The picker moved (throttled) - never broadcast.
  | { readonly type: 'draft'; readonly payload: { readonly hex: string } }
  | { readonly type: 'submit'; readonly payload: { readonly hex: string } };

export type PointOfHueAction = PointOfHueHostAction | PointOfHuePlayerAction;

// ---- Views ----

// delta = points from the round just revealed (0 outside the reveal).
export type PointOfHueStanding = PlayerStanding;

export interface PointOfHueGuessSummary {
  readonly hex: string;
  readonly accuracy: number;
  readonly points: number;
}

// Everyone - host screen and every phone. Never holds the current target before its reveal.
export interface PointOfHuePublicView {
  readonly phase: PointOfHuePhase;
  readonly roundNumber: number;
  readonly roundCount: number;
  readonly phaseEndsAt: string | null;
  readonly pausedRemainingMs: number | null;
  readonly paused: boolean;
  readonly autoPaused: boolean;
  readonly viewMs: number;
  readonly guessMs: number;
  readonly revealMs: number;
  readonly roster: readonly string[];
  readonly lockedIn: readonly string[];
  readonly standings: readonly PointOfHueStanding[];
  // Only in the reveal.
  readonly target: string | null;
  readonly guesses: Readonly<Record<string, PointOfHueGuessSummary>> | null;
}

// The host screen only - the target, while it's being shown (viewing) and at the reveal.
export interface PointOfHueHostView {
  readonly phase: PointOfHuePhase;
  readonly targetHex: string | null;
}

// One player's phone.
export interface PointOfHuePrivateView {
  readonly isPlaying: boolean;
  // This round's lock-in, if any.
  readonly lockedHex: string | null;
  // In the reveal: how this round's guess scored (null if they never touched their picker).
  readonly result: (PointOfHueGrade & { readonly targetHex: string }) | null;
  readonly total: number;
  readonly rank: number | null;
  readonly playerCount: number;
}
