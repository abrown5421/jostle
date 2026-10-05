import type { GameTimeout } from '../../contracts/game-definition.contract';
import { isRecord } from './actions';
import { addMs, msUntil } from './time';

// The bookkeeping every round-based game with timed phases shares (iPod War, Point of Hue, ...).
// A timed phase stores its deadline, so pausing is just "remember what was left", and every
// transition, pause and resume bumps timerSeq - the timer action carries it, so one that fires
// after the state moved on (the host skipped just as it was due) is recognised as stale.
//
// Generic over any state with these fields, so a game keeps its own state type.
export interface TimedPhaseState {
  // When the current timed phase ends (server time). Null while paused or in an untimed phase.
  readonly phaseEndsAt: string | null;
  // What was left of the timed phase when it was paused.
  readonly pausedRemainingMs: number | null;
  readonly paused: boolean;
  // Paused by the game itself (the host screen dropped) rather than by the host.
  readonly autoPaused: boolean;
  readonly timerSeq: number;
}

// The action type a game's nextTimeout dispatches - see phaseTimeout.
export const TIMER_ACTION = 'timer';

export const enterTimedPhase = <S extends TimedPhaseState>(state: S, now: string, durationMs: number): S => ({
  ...state,
  phaseEndsAt: addMs(now, durationMs),
  pausedRemainingMs: null,
  paused: false,
  autoPaused: false,
  timerSeq: state.timerSeq + 1,
});

// A phase that ends on something other than time (iPod War's "loading", any game's "final").
export const enterUntimedPhase = <S extends TimedPhaseState>(state: S): S => ({
  ...state,
  phaseEndsAt: null,
  pausedRemainingMs: null,
  paused: false,
  autoPaused: false,
  timerSeq: state.timerSeq + 1,
});

export const pausePhase = <S extends TimedPhaseState>(state: S, now: string, auto: boolean): S => ({
  ...state,
  paused: true,
  autoPaused: auto,
  phaseEndsAt: null,
  pausedRemainingMs: state.phaseEndsAt ? msUntil(state.phaseEndsAt, now) : state.pausedRemainingMs,
  timerSeq: state.timerSeq + 1,
});

export const resumePhase = <S extends TimedPhaseState>(state: S, now: string): S => ({
  ...state,
  paused: false,
  autoPaused: false,
  phaseEndsAt: state.pausedRemainingMs === null ? null : addMs(now, state.pausedRemainingMs),
  pausedRemainingMs: null,
  timerSeq: state.timerSeq + 1,
});

// A GameDefinition's nextTimeout for a timed-phase game: the current deadline, unless paused.
export const phaseTimeout = (state: TimedPhaseState): GameTimeout | null =>
  state.paused || !state.phaseEndsAt
    ? null
    : { at: state.phaseEndsAt, action: { type: TIMER_ACTION, payload: { seq: state.timerSeq } } };

// Whether a timer action is for the phase we're actually in (and we're not paused).
export const isCurrentTimer = (state: TimedPhaseState, payload: unknown): boolean =>
  !state.paused && isRecord(payload) && payload['seq'] === state.timerSeq;

// How far into a timed phase of `durationMs` we are - excluding paused time, since a resume moves
// the deadline. Clamped to the phase.
export const elapsedInPhase = (state: TimedPhaseState, now: string, durationMs: number): number => {
  const remaining = state.phaseEndsAt ? msUntil(state.phaseEndsAt, now) : (state.pausedRemainingMs ?? durationMs);
  return Math.min(durationMs, Math.max(0, durationMs - remaining));
};
