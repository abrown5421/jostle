import { cluesBy } from './clues';
import { teamOf } from './teams';
import type { FishbowlPrivateView, FishbowlPublicView, FishbowlState, FishbowlTeamView } from './fishbowl.types';

// What each screen may see. The rule that matters: a clue still in play is shown to nobody but the
// presenter holding it - its author included. Only a finished turn's guessed clues (the recap) are
// public.

const toTeamViews = (state: FishbowlState): FishbowlTeamView[] => {
  const totals = state.teams.map((team) => (state.scores[team.id] ?? [0, 0, 0]).reduce((sum, points) => sum + points, 0));
  return state.teams.map((team, index) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    members: team.members,
    roundScores: state.scores[team.id] ?? [0, 0, 0],
    total: totals[index],
    rank: 1 + totals.filter((total) => total > totals[index]).length,
  }));
};

const submittedCounts = (state: FishbowlState): Record<string, number> =>
  Object.fromEntries(state.teams.flatMap((team) => team.members).map((participantId) => [participantId, cluesBy(state.clues, participantId).length]));

export const fishbowlPublicView = (state: FishbowlState): FishbowlPublicView => ({
  phase: state.phase,
  round: state.round,
  roundCount: 3,
  teams: toTeamViews(state),
  activeTeamId: state.phase === 'ready' || state.phase === 'turn' ? (state.teams[state.activeTeamIndex]?.id ?? null) : null,
  presenterId: state.presenterId,
  phaseEndsAt: state.phaseEndsAt,
  pausedRemainingMs: state.pausedRemainingMs,
  paused: state.paused,
  pauseCause: state.pauseCause,
  turnMs: state.config.turnMs,
  allowSkipping: state.config.allowSkipping,
  cluesPerPlayer: state.config.cluesPerPlayer,
  submitted: submittedCounts(state),
  bowlCount: state.bowl.length,
  totalClues: Object.keys(state.clues).length,
  turnPoints: state.phase === 'turn' ? state.turnGuessed.length : 0,
  lastTurn: state.lastTurn,
  roundJustStarted: state.roundJustStarted,
});

export const fishbowlPrivateView = (state: FishbowlState, participantId: string): FishbowlPrivateView => {
  const isPresenter = state.presenterId === participantId && (state.phase === 'ready' || state.phase === 'turn');
  const isPresenting = isPresenter && state.phase === 'turn';
  return {
    teamId: teamOf(state.teams, participantId)?.id ?? null,
    isPresenter,
    cluesRequired: state.config.cluesPerPlayer,
    myClues: state.phase === 'setup' ? cluesBy(state.clues, participantId).map(({ id, text }) => ({ id, text })) : [],
    currentClue: isPresenting ? (state.clues[state.bowl[0]]?.text ?? null) : null,
    canUndo: isPresenting && state.turnGuessed.length > 0,
  };
};
