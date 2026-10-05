import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameActionResult, GameContext } from '../../contracts/game-definition.contract';
import {
  elapsedInPhase,
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
import { isHexColor } from './color';
import { gradeGuess } from './scoring';
import type { PointOfHueGrade, PointOfHueState } from './pointOfHue.types';

// Point of Hue's state machine. Every phase but the last is timed (see ../shared/timedPhases):
//
//   countdown -> viewing -> guessing --timer|skip|all in--> reveal -> viewing (next round) ...
//   ... -> final --back-to-lobby--> (complete)
//
// Guesses are graded when the round ends: a lock-in with its speed bonus, otherwise whatever the
// player's picker last showed (their draft), without one.

export const COUNTDOWN_MS = 5_000;

type Result = GameActionResult<PointOfHueState>;

const startViewing = (state: PointOfHueState, index: number, now: string): PointOfHueState => ({
  ...enterTimedPhase(state, now, state.config.viewMs),
  index,
  phase: 'viewing',
  lockIns: {},
  drafts: {},
});

const startGuessing = (state: PointOfHueState, now: string): PointOfHueState => ({
  ...enterTimedPhase(state, now, state.config.guessMs),
  phase: 'guessing',
});

const toFinal = (state: PointOfHueState): PointOfHueState => ({ ...enterUntimedPhase(state), phase: 'final', lockIns: {}, drafts: {} });

const gradeRound = (state: PointOfHueState): Record<string, PointOfHueGrade> => {
  const target = state.targets[state.index];
  const grades: Record<string, PointOfHueGrade> = {};
  state.roster.forEach((participantId) => {
    const lockIn = state.lockIns[participantId];
    const draft = state.drafts[participantId];
    if (lockIn) grades[participantId] = gradeGuess(target, lockIn.hex, lockIn.elapsedMs, state.config.guessMs);
    else if (draft) grades[participantId] = gradeGuess(target, draft, null, state.config.guessMs);
  });
  return grades;
};

// The round's over: guesses are scored into the totals (and the session's scores, via the deltas)
// and everyone sees the target.
const endRound = (state: PointOfHueState, now: string, skipped: boolean): Result => {
  const grades = gradeRound(state);
  const scoreDeltas = Object.fromEntries(Object.entries(grades).map(([participantId, grade]) => [participantId, grade.points]));
  const totals = { ...state.totals };
  Object.entries(scoreDeltas).forEach(([participantId, points]) => {
    totals[participantId] = (totals[participantId] ?? 0) + points;
  });
  return {
    state: {
      ...enterTimedPhase(state, now, state.config.revealMs),
      phase: 'reveal',
      results: [...state.results, { roundIndex: state.index, skipped, grades }],
      totals,
    },
    scoreDeltas,
  };
};

const nextRound = (state: PointOfHueState, now: string): PointOfHueState =>
  state.index + 1 < state.targets.length ? startViewing(state, state.index + 1, now) : toFinal(state);

const everyoneLockedIn = (state: PointOfHueState, context: GameContext): boolean =>
  everyConnectedRosterMember(state.roster, context.participants, (participantId) => Boolean(state.lockIns[participantId]));

const maybeEndEarly = (state: PointOfHueState, context: GameContext): Result =>
  state.phase === 'guessing' && !state.paused && state.config.endWhenAllAnswered && everyoneLockedIn(state, context)
    ? endRound(state, context.now, false)
    : { state };

const readHex = (payload: unknown): string => {
  const hex = isRecord(payload) ? payload['hex'] : undefined;
  if (!isHexColor(hex)) throw invalid('Send a color as #rrggbb');
  return hex.toLowerCase();
};

const handleTimer = (state: PointOfHueState, payload: unknown, now: string): Result => {
  if (!isCurrentTimer(state, payload)) return { state };
  switch (state.phase) {
    case 'countdown':
      return { state: startViewing(state, 0, now) };
    case 'viewing':
      return { state: startGuessing(state, now) };
    case 'guessing':
      return endRound(state, now, false);
    case 'reveal':
      return { state: nextRound(state, now) };
    default:
      return { state };
  }
};

const handleHostAction = (state: PointOfHueState, action: GameAction, now: string): Result => {
  switch (action.type) {
    case 'pause':
      if (state.phase === 'final' || state.paused) return { state };
      return { state: pausePhase(state, now, false) };
    case 'resume':
      if (!state.paused) return { state };
      return { state: resumePhase(state, now) };
    case 'skip':
      switch (state.phase) {
        case 'countdown':
          return { state: startViewing(state, 0, now) };
        case 'viewing':
          return { state: startGuessing(state, now) };
        case 'guessing':
          return endRound(state, now, true);
        case 'reveal':
          return { state: nextRound(state, now) };
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

const requireRosterMember = (state: PointOfHueState, context: GameContext): string => {
  const participantId = context.actor.participantId;
  if (!participantId || !state.roster.includes(participantId)) throw invalid("You're not in this game");
  return participantId;
};

// Drafts stream in while players drag - one landing just after the buzzer (or the host's pause)
// is expected, not an error, so it's dropped quietly rather than bounced back at the phone.
const handleDraft = (state: PointOfHueState, payload: unknown, context: GameContext): Result => {
  const participantId = requireRosterMember(state, context);
  const hex = readHex(payload);
  const canGuess = state.phase === 'guessing' && !state.paused && !state.lockIns[participantId];
  if (!canGuess || state.drafts[participantId] === hex) return { state };
  return { state: { ...state, drafts: { ...state.drafts, [participantId]: hex } }, silent: true };
};

const handleSubmit = (state: PointOfHueState, payload: unknown, context: GameContext): Result => {
  const participantId = requireRosterMember(state, context);
  const hex = readHex(payload);
  if (state.lockIns[participantId]) throw invalid("You've already locked in");
  if (state.paused) throw invalid('The game is paused');
  if (state.phase !== 'guessing') throw invalid('Guessing is closed');

  const lockIn = { hex, elapsedMs: elapsedInPhase(state, context.now, state.config.guessMs) };
  const next = { ...state, lockIns: { ...state.lockIns, [participantId]: lockIn } };
  return maybeEndEarly(next, context);
};

export const handlePointOfHueAction = (state: PointOfHueState, action: GameAction, context: GameContext): Result => {
  switch (action.type) {
    case TIMER_ACTION:
      requireRole(context, 'system');
      return handleTimer(state, action.payload, context.now);
    case SYSTEM_ACTIONS.participantsChanged: {
      requireRole(context, 'system');
      const roster = pruneRoster(state.roster, context.participants);
      return maybeEndEarly(roster === state.roster ? state : { ...state, roster }, context);
    }
    case SYSTEM_ACTIONS.hostConnection:
      requireRole(context, 'system');
      if (isHostConnected(action.payload) || state.paused || state.phase === 'final') return { state };
      return { state: pausePhase(state, context.now, true) };
    case 'draft':
      requireRole(context, 'player');
      return handleDraft(state, action.payload, context);
    case 'submit':
      requireRole(context, 'player');
      return handleSubmit(state, action.payload, context);
    default:
      requireRole(context, 'host');
      return handleHostAction(state, action, context.now);
  }
};
