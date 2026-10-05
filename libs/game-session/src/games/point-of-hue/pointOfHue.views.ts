import { toStandings as toRosterStandings } from '../shared';
import type {
  PointOfHueGuessSummary,
  PointOfHueHostView,
  PointOfHuePrivateView,
  PointOfHuePublicView,
  PointOfHueStanding,
  PointOfHueState,
} from './pointOfHue.types';

// What each screen may see. The rule that matters: a round's target reaches no phone before its
// reveal - only the host screen, which must show it during the viewing phase.

const lastRound = (state: PointOfHueState) => (state.phase === 'reveal' ? state.results.at(-1) : undefined);

export const toStandings = (state: PointOfHueState): PointOfHueStanding[] =>
  toRosterStandings(state.roster, state.totals, (participantId) => lastRound(state)?.grades[participantId]?.points ?? 0);

const toGuessSummaries = (state: PointOfHueState): Record<string, PointOfHueGuessSummary> | null => {
  const round = lastRound(state);
  if (!round) return null;
  return Object.fromEntries(
    Object.entries(round.grades).map(([participantId, { hex, accuracy, points }]) => [participantId, { hex, accuracy, points }]),
  );
};

export const pointOfHuePublicView = (state: PointOfHueState): PointOfHuePublicView => ({
  phase: state.phase,
  roundNumber: state.index + 1,
  roundCount: state.targets.length,
  phaseEndsAt: state.phaseEndsAt,
  pausedRemainingMs: state.pausedRemainingMs,
  paused: state.paused,
  autoPaused: state.autoPaused,
  viewMs: state.config.viewMs,
  guessMs: state.config.guessMs,
  revealMs: state.config.revealMs,
  roster: state.roster,
  lockedIn: Object.keys(state.lockIns),
  standings: toStandings(state),
  target: state.phase === 'reveal' ? state.targets[state.index] : null,
  guesses: toGuessSummaries(state),
});

export const pointOfHueHostView = (state: PointOfHueState): PointOfHueHostView => ({
  phase: state.phase,
  targetHex: state.phase === 'viewing' || state.phase === 'reveal' ? state.targets[state.index] : null,
});

export const pointOfHuePrivateView = (state: PointOfHueState, participantId: string): PointOfHuePrivateView => {
  const grade = lastRound(state)?.grades[participantId];
  const standing = toStandings(state).find((candidate) => candidate.participantId === participantId);
  return {
    isPlaying: state.roster.includes(participantId),
    lockedHex: state.lockIns[participantId]?.hex ?? null,
    result: grade ? { ...grade, targetHex: state.targets[state.index] } : null,
    total: state.totals[participantId] ?? 0,
    rank: standing?.rank ?? null,
    playerCount: state.roster.length,
  };
};
