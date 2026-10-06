import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameActionResult, GameContext } from '../../contracts/game-definition.contract';
import type { SessionParticipant } from '../../contracts/session.contract';
import {
  enterTimedPhase,
  enterUntimedPhase,
  invalidAction as invalid,
  isCurrentTimer,
  isHostConnected,
  isRecord,
  pausePhase,
  requireRole,
  resumePhase,
  TIMER_ACTION,
} from '../shared';
import { cluesBy, isDuplicateClue, readClueText, shuffle } from './clues';
import { fishbowlRandom } from './random';
import { pickNextTurn, pickPresenter, removeMember, teamOf } from './teams';
import type { FishbowlPauseCause, FishbowlRound, FishbowlState, FishbowlTeam } from './fishbowl.types';

// Fishbowl's state machine:
//
//   setup --begin--> ready --start-turn--> turn --timer|skip|bowl empty--> ready (next team) ...
//   ... the turn that empties round 3's bowl --> final --back-to-lobby--> (complete)
//
// Only a turn is timed (../shared/timedPhases); setup and ready wait on people.

export const ROUND_COUNT = 3;

const PLAYER_ACTIONS = new Set(['submit-clue', 'remove-clue', 'start-turn', 'correct', 'skip-clue', 'undo']);

type Result = GameActionResult<FishbowlState>;

const isConnected = (participants: readonly SessionParticipant[], participantId: string | null): boolean =>
  participants.some(({ id, isConnected: connected }) => id === participantId && connected);

const allClueIds = (state: FishbowlState): string[] => shuffle(Object.keys(state.clues), fishbowlRandom);

// Hands the next turn to whoever's up after team `fromIndex` (inclusive) - or, if every team has
// emptied out, ends the game.
const toReady = (state: FishbowlState, fromIndex: number, participants: readonly SessionParticipant[]): FishbowlState => {
  const pick = pickNextTurn(state.teams, fromIndex, participants);
  if (!pick) return toFinal(state);
  return {
    ...enterUntimedPhase(state),
    phase: 'ready',
    teams: pick.teams,
    activeTeamIndex: pick.teamIndex,
    presenterId: pick.presenterId,
    turnGuessed: [],
    pauseCause: null,
  };
};

const toFinal = (state: FishbowlState): FishbowlState => ({
  ...enterUntimedPhase(state),
  phase: 'final',
  presenterId: null,
  turnGuessed: [],
  pauseCause: null,
});

const addRoundPoints = (scores: FishbowlState['scores'], teamId: string, round: FishbowlRound, points: number): FishbowlState['scores'] => {
  const next = [...(scores[teamId] ?? [0, 0, 0])] as [number, number, number];
  next[round - 1] += points;
  return { ...scores, [teamId]: next };
};

// The turn's over - by the clock, the host, or an empty bowl. Its points are banked (and go to every
// team member's session score), and the turn passes to the next team; an empty bowl also refills
// it for the next round, or ends the game after round 3.
const endTurn = (state: FishbowlState, participants: readonly SessionParticipant[], roundEnded: boolean): Result => {
  const team = state.teams[state.activeTeamIndex];
  const points = state.turnGuessed.length;
  const banked: FishbowlState = {
    ...state,
    scores: addRoundPoints(state.scores, team.id, state.round, points),
    lastTurn: {
      teamId: team.id,
      presenterId: state.presenterId ?? '',
      round: state.round,
      guessed: state.turnGuessed.map((clueId) => state.clues[clueId]?.text ?? ''),
      points,
      roundEnded,
    },
    roundJustStarted: false,
  };
  const scoreDeltas = points > 0 ? Object.fromEntries(team.members.map((member) => [member, points])) : undefined;

  if (roundEnded && state.round === ROUND_COUNT) return { state: toFinal(banked), scoreDeltas };
  const nextRound = roundEnded
    ? { ...banked, round: (state.round + 1) as FishbowlRound, bowl: allClueIds(state), roundJustStarted: true }
    : banked;
  return { state: toReady(nextRound, (state.activeTeamIndex + 1) % state.teams.length, participants), scoreDeltas };
};

const pauseTurn = (state: FishbowlState, now: string, cause: FishbowlPauseCause): FishbowlState => ({
  ...pausePhase(state, now, cause !== 'host'),
  pauseCause: cause,
});

const resumeTurn = (state: FishbowlState, now: string): FishbowlState => ({ ...resumePhase(state, now), pauseCause: null });

// ---- Setup ----

const requireSetup = (state: FishbowlState): void => {
  if (state.phase !== 'setup') throw invalid('The bowl is already full');
};

const requireTeamMember = (state: FishbowlState, context: GameContext): string => {
  const participantId = context.actor.participantId;
  if (!participantId || !teamOf(state.teams, participantId)) throw invalid("You're not in this game");
  return participantId;
};

const submitClue = (state: FishbowlState, payload: unknown, context: GameContext): Result => {
  requireSetup(state);
  const authorId = requireTeamMember(state, context);
  const text = readClueText(payload);
  if (cluesBy(state.clues, authorId).length >= state.config.cluesPerPlayer) {
    throw invalid(`You've already added all ${state.config.cluesPerPlayer} of your clues`);
  }
  if (isDuplicateClue(state.clues, text)) throw invalid('Someone already added that - try another');
  const id = `clue-${state.clueSeq + 1}`;
  return { state: { ...state, clueSeq: state.clueSeq + 1, clues: { ...state.clues, [id]: { id, text, authorId } } } };
};

const removeClue = (state: FishbowlState, payload: unknown, context: GameContext): Result => {
  requireSetup(state);
  const authorId = requireTeamMember(state, context);
  const clueId = isRecord(payload) ? payload['clueId'] : undefined;
  if (typeof clueId !== 'string' || state.clues[clueId]?.authorId !== authorId) throw invalid('That clue isn’t yours to remove');
  const { [clueId]: _removed, ...clues } = state.clues;
  return { state: { ...state, clues } };
};

const movePlayer = (state: FishbowlState, payload: unknown): Result => {
  requireSetup(state);
  const participantId = isRecord(payload) ? payload['participantId'] : undefined;
  const teamId = isRecord(payload) ? payload['teamId'] : undefined;
  const from = typeof participantId === 'string' ? teamOf(state.teams, participantId) : undefined;
  const to = state.teams.find((team) => team.id === teamId);
  if (!from || !to || typeof participantId !== 'string') throw invalid('Pick a player and a team');
  if (from.id === to.id) return { state };
  if (from.members.length === 1) throw invalid(`${from.name} can’t be left without players`);
  const teams = state.teams.map((team) => {
    if (team.id === from.id) return { ...team, members: team.members.filter((member) => member !== participantId) };
    if (team.id === to.id) return { ...team, members: [...team.members, participantId] };
    return team;
  });
  return { state: { ...state, teams } };
};

const begin = (state: FishbowlState, participants: readonly SessionParticipant[]): Result => {
  requireSetup(state);
  const waitingOn = state.teams
    .flatMap((team) => team.members)
    .filter((participantId) => cluesBy(state.clues, participantId).length < state.config.cluesPerPlayer);
  if (waitingOn.length > 0) {
    throw invalid(`Waiting on ${waitingOn.length} ${waitingOn.length === 1 ? 'player' : 'players'} to finish their clues`);
  }
  return { state: toReady({ ...state, round: 1, bowl: allClueIds(state), roundJustStarted: true }, 0, participants) };
};

// ---- Turns ----

const requirePresenter = (state: FishbowlState, context: GameContext): void => {
  if (!context.actor.participantId || context.actor.participantId !== state.presenterId) throw invalid('Only the presenter can do that');
};

const requireLiveTurn = (state: FishbowlState): void => {
  if (state.phase !== 'turn') throw invalid('No turn is running');
  if (state.paused) throw invalid('The turn is paused');
};

const startTurn = (state: FishbowlState, context: GameContext): Result => {
  if (state.phase !== 'ready') throw invalid('It isn’t time to start a turn');
  requirePresenter(state, context);
  return {
    state: {
      ...enterTimedPhase(state, context.now, state.config.turnMs),
      phase: 'turn',
      bowl: shuffle(state.bowl, fishbowlRandom),
      turnGuessed: [],
      pauseCause: null,
    },
  };
};

const correct = (state: FishbowlState, context: GameContext): Result => {
  requirePresenter(state, context);
  requireLiveTurn(state);
  const [clueId, ...rest] = state.bowl;
  const next = { ...state, bowl: rest, turnGuessed: [...state.turnGuessed, clueId] };
  return rest.length === 0 ? endTurn(next, context.participants, true) : { state: next };
};

const skipClue = (state: FishbowlState, context: GameContext): Result => {
  requirePresenter(state, context);
  requireLiveTurn(state);
  if (!state.config.allowSkipping) throw invalid('Skipping is turned off');
  const [clueId, ...rest] = state.bowl;
  return { state: rest.length === 0 ? state : { ...state, bowl: [...rest, clueId] } };
};

const undo = (state: FishbowlState, context: GameContext): Result => {
  requirePresenter(state, context);
  requireLiveTurn(state);
  const clueId = state.turnGuessed.at(-1);
  if (!clueId) throw invalid('Nothing to undo');
  return { state: { ...state, bowl: [clueId, ...state.bowl], turnGuessed: state.turnGuessed.slice(0, -1) } };
};

// ---- Host controls ----

const skip = (state: FishbowlState, participants: readonly SessionParticipant[]): Result => {
  if (state.phase === 'turn') return endTurn(state, participants, false);
  if (state.phase !== 'ready') return { state };
  const team = state.teams[state.activeTeamIndex];
  const pick = pickPresenter(team, participants.filter(({ id }) => id !== state.presenterId));
  if (!pick) return { state: toReady(state, (state.activeTeamIndex + 1) % state.teams.length, participants) };
  return { state: { ...state, presenterId: pick.presenterId, teams: state.teams.map((candidate) => (candidate.id === team.id ? pick.team : candidate)) } };
};

const handleHostAction = (state: FishbowlState, action: GameAction, context: GameContext): Result => {
  switch (action.type) {
    case 'move-player':
      return movePlayer(state, action.payload);
    case 'begin':
      return begin(state, context.participants);
    case 'pause':
      return state.phase === 'turn' && !state.paused ? { state: pauseTurn(state, context.now, 'host') } : { state };
    case 'resume':
      return state.paused ? { state: resumeTurn(state, context.now) } : { state };
    case 'skip':
      return skip(state, context.participants);
    case 'end':
      // A turn in progress is abandoned unscored.
      return state.phase === 'final' ? { state } : { state: toFinal(state) };
    case 'back-to-lobby':
      if (state.phase !== 'final') throw invalid('Finish the game first');
      return { state, complete: true };
    default:
      throw invalid(`Unknown action "${action.type}"`);
  }
};

const handlePlayerAction = (state: FishbowlState, action: GameAction, context: GameContext): Result => {
  switch (action.type) {
    case 'submit-clue':
      return submitClue(state, action.payload, context);
    case 'remove-clue':
      return removeClue(state, action.payload, context);
    case 'start-turn':
      return startTurn(state, context);
    case 'correct':
      return correct(state, context);
    case 'skip-clue':
      return skipClue(state, context);
    case 'undo':
      return undo(state, context);
    default:
      throw invalid(`Unknown action "${action.type}"`);
  }
};

// ---- The room changing ----

// Leavers come off their teams (their clues stay in the bowl). A presenter who leaves ends their
// turn; one who drops mid-turn pauses it until they're back; one who drops before starting is
// replaced by their team's next connected player.
const onParticipantsChanged = (state: FishbowlState, context: GameContext): Result => {
  const { participants, now } = context;
  const present = new Set(participants.map(({ id }) => id));
  const leavers = state.teams.flatMap((team) => team.members).filter((member) => !present.has(member));
  const teams = leavers.reduce<readonly FishbowlTeam[]>((current, leaver) => removeMember(current, leaver), state.teams);
  const pruned = leavers.length > 0 ? { ...state, teams } : state;
  const presenterLeft = state.presenterId !== null && !present.has(state.presenterId);

  switch (pruned.phase) {
    case 'turn':
      if (presenterLeft) return endTurn(pruned, participants, false);
      if (!pruned.paused && !isConnected(participants, pruned.presenterId)) return { state: pauseTurn(pruned, now, 'presenter-disconnected') };
      if (pruned.pauseCause === 'presenter-disconnected' && isConnected(participants, pruned.presenterId)) return { state: resumeTurn(pruned, now) };
      return { state: pruned };
    case 'ready':
      if (presenterLeft || !isConnected(participants, pruned.presenterId)) {
        const replacement = pickNextTurn(pruned.teams, pruned.activeTeamIndex, participants);
        if (replacement && replacement.presenterId !== pruned.presenterId && isConnected(participants, replacement.presenterId)) {
          return { state: { ...pruned, teams: replacement.teams, activeTeamIndex: replacement.teamIndex, presenterId: replacement.presenterId } };
        }
      }
      return { state: pruned };
    default:
      return { state: pruned };
  }
};

export const handleFishbowlAction = (state: FishbowlState, action: GameAction, context: GameContext): Result => {
  switch (action.type) {
    case TIMER_ACTION:
      requireRole(context, 'system');
      return state.phase === 'turn' && isCurrentTimer(state, action.payload) ? endTurn(state, context.participants, false) : { state };
    case SYSTEM_ACTIONS.participantsChanged:
      requireRole(context, 'system');
      return onParticipantsChanged(state, context);
    case SYSTEM_ACTIONS.hostConnection:
      requireRole(context, 'system');
      if (isHostConnected(action.payload) || state.phase !== 'turn' || state.paused) return { state };
      return { state: pauseTurn(state, context.now, 'host-disconnected') };
    default:
      if (PLAYER_ACTIONS.has(action.type)) {
        requireRole(context, 'player');
        return handlePlayerAction(state, action, context);
      }
      requireRole(context, 'host');
      return handleHostAction(state, action, context);
  }
};
