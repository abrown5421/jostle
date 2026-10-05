import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameActionResult, GameContext } from '../../contracts/game-definition.contract';
import { GameSessionError } from '../../service/session.errors';
import { isAnswerMatch, POINTS_PER_FIELD, speedBonus } from './grading';
import type { IpodWarField, IpodWarGrade, IpodWarGuesses, IpodWarSong, IpodWarState } from './ipodWar.types';

// iPod War's state machine. Phases advance on the host screen's playback reports, the host's
// controls, players' lock-ins, and the system's timers (see ipodWar.game.ts's nextTimeout):
//
//   countdown --timer--> loading --playback-started--> playing --timer|skip|all in--> reveal
//   reveal --timer|skip--> loading (next song) ... --> final --back-to-lobby--> (complete)
//
// Every timed phase stores its deadline (phaseEndsAt), so pausing is just "remember what was left".

export const COUNTDOWN_MS = 5_000;
export const MAX_GUESS_LENGTH = 120;
const MAX_ERROR_LENGTH = 200;
const MAX_DEVICE_ID_LENGTH = 128;

type Result = GameActionResult<IpodWarState>;

const invalid = (message: string): GameSessionError => new GameSessionError('INVALID_ACTION', message);

const addMs = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString();
const msUntil = (iso: string, now: string): number => Math.max(0, Date.parse(iso) - Date.parse(now));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireRole = (context: GameContext, role: 'host' | 'player' | 'system'): void => {
  if (context.actor.role !== role) throw new GameSessionError('NOT_AUTHORIZED', `Only the ${role} can do that`);
};

// Starts (re)loading a song: the host screen sees a new (index, attempt) and plays its clip.
const startLoading = (state: IpodWarState, index: number): IpodWarState => ({
  ...state,
  index,
  phase: 'loading',
  phaseEndsAt: null,
  pausedRemainingMs: null,
  paused: false,
  autoPaused: false,
  timerSeq: state.timerSeq + 1,
  submissions: {},
  playback: { ...state.playback, attempt: state.playback.attempt + 1, error: null },
});

const toFinal = (state: IpodWarState): IpodWarState => ({
  ...state,
  phase: 'final',
  phaseEndsAt: null,
  pausedRemainingMs: null,
  paused: false,
  autoPaused: false,
  timerSeq: state.timerSeq + 1,
  submissions: {},
});

// The song's over: lock-ins are scored into the totals (and the session's scores, via the
// deltas) and everyone sees the answer.
const endSong = (state: IpodWarState, now: string, skipped: boolean): Result => {
  const grades = Object.fromEntries(Object.entries(state.submissions).map(([participantId, { grade }]) => [participantId, grade]));
  const scoreDeltas = Object.fromEntries(Object.entries(grades).map(([participantId, grade]) => [participantId, grade.points]));
  const totals = { ...state.totals };
  Object.entries(scoreDeltas).forEach(([participantId, points]) => {
    totals[participantId] = (totals[participantId] ?? 0) + points;
  });
  return {
    state: {
      ...state,
      phase: 'reveal',
      phaseEndsAt: addMs(now, state.config.revealMs),
      pausedRemainingMs: null,
      paused: false,
      autoPaused: false,
      timerSeq: state.timerSeq + 1,
      results: [...state.results, { songIndex: state.index, skipped, grades }],
      totals,
    },
    scoreDeltas,
  };
};

const nextSong = (state: IpodWarState): IpodWarState =>
  state.index + 1 < state.songs.length ? startLoading(state, state.index + 1) : toFinal(state);

const pause = (state: IpodWarState, now: string, auto: boolean): IpodWarState => ({
  ...state,
  paused: true,
  autoPaused: auto,
  phaseEndsAt: null,
  pausedRemainingMs: state.phaseEndsAt ? msUntil(state.phaseEndsAt, now) : state.pausedRemainingMs,
  timerSeq: state.timerSeq + 1,
});

const resume = (state: IpodWarState, now: string): IpodWarState => ({
  ...state,
  paused: false,
  autoPaused: false,
  phaseEndsAt: state.pausedRemainingMs === null ? null : addMs(now, state.pausedRemainingMs),
  pausedRemainingMs: null,
  timerSeq: state.timerSeq + 1,
  // The host screen restarts (loading) or re-seeks and resumes (playing) the clip on a new attempt.
  playback:
    state.phase === 'loading' || state.phase === 'playing'
      ? { ...state.playback, attempt: state.playback.attempt + 1, error: null }
      : state.playback,
});

// Whether every connected player still in the game has locked in - disconnected phones don't
// hold the room up, and an empty room never counts as "everyone".
const everyoneHasAnswered = (state: IpodWarState, context: GameContext): boolean => {
  const waitingOn = context.participants.filter(
    (participant) => participant.isConnected && state.roster.includes(participant.id),
  );
  return waitingOn.length > 0 && waitingOn.every((participant) => state.submissions[participant.id]);
};

const maybeEndEarly = (state: IpodWarState, context: GameContext): Result =>
  state.phase === 'playing' && !state.paused && state.config.endWhenAllAnswered && everyoneHasAnswered(state, context)
    ? endSong(state, context.now, false)
    : { state };

const answersFor = (song: IpodWarSong, field: IpodWarField): readonly string[] => {
  switch (field) {
    case 'title':
      return [song.title];
    case 'artist':
      return song.artists;
    case 'album':
      return [song.album];
  }
};

export const gradeGuesses = (state: IpodWarState, song: IpodWarSong, guesses: IpodWarGuesses, elapsedMs: number): IpodWarGrade => {
  const bonus = speedBonus(elapsedMs, state.config.playbackMs);
  const fields = Object.fromEntries(
    state.config.fields.map((field) => {
      const guess = guesses[field] ?? '';
      const correct = guess.trim() !== '' && isAnswerMatch(guess, answersFor(song, field), state.config.difficulty);
      return [field, { guess, correct, points: correct ? POINTS_PER_FIELD + bonus : 0 }];
    }),
  );
  const points = Object.values(fields).reduce((sum, { points: fieldPoints }) => sum + fieldPoints, 0);
  return { fields, speedBonus: bonus, points, elapsedMs };
};

const readGuesses = (state: IpodWarState, payload: unknown): IpodWarGuesses => {
  if (!isRecord(payload)) throw invalid('Send your answers');
  return Object.fromEntries(
    state.config.fields.map((field) => {
      const raw = payload[field];
      if (raw !== undefined && typeof raw !== 'string') throw invalid(`Your ${field} answer must be text`);
      return [field, (raw ?? '').trim().slice(0, MAX_GUESS_LENGTH)];
    }),
  );
};

// Host playback reports name the (song, attempt) they're about; a report for anything else is
// stale (an earlier attempt, a song already skipped) and simply ignored.
const isCurrentPlayback = (state: IpodWarState, payload: unknown): boolean =>
  isRecord(payload) && payload['index'] === state.index && payload['attempt'] === state.playback.attempt;

const handleTimer = (state: IpodWarState, payload: unknown, now: string): Result => {
  if (!isRecord(payload) || payload['seq'] !== state.timerSeq || state.paused) return { state };
  switch (state.phase) {
    case 'countdown':
      return { state: startLoading(state, 0) };
    case 'playing':
      return endSong(state, now, false);
    case 'reveal':
      return { state: nextSong(state) };
    default:
      return { state };
  }
};

const handleHostAction = (state: IpodWarState, action: GameAction, context: GameContext): Result => {
  const { now } = context;
  switch (action.type) {
    case 'claim-audio': {
      const deviceId = isRecord(action.payload) ? action.payload['deviceId'] : undefined;
      if (typeof deviceId !== 'string' || !deviceId || deviceId.length > MAX_DEVICE_ID_LENGTH) throw invalid('Unknown audio device');
      if (deviceId === state.playback.deviceId) return { state };
      // The new device takes over whatever should be playing right now.
      return { state: { ...state, playback: { deviceId, attempt: state.playback.attempt + 1, error: null } } };
    }
    case 'playback-started':
      if (state.phase !== 'loading' || state.paused || !isCurrentPlayback(state, action.payload)) return { state };
      return {
        state: {
          ...state,
          phase: 'playing',
          phaseEndsAt: addMs(now, state.config.playbackMs),
          timerSeq: state.timerSeq + 1,
          playback: { ...state.playback, error: null },
        },
      };
    case 'playback-failed': {
      if ((state.phase !== 'loading' && state.phase !== 'playing') || !isCurrentPlayback(state, action.payload)) return { state };
      const raw = isRecord(action.payload) ? action.payload['message'] : undefined;
      const error = (typeof raw === 'string' && raw.trim() ? raw.trim() : 'Playback failed').slice(0, MAX_ERROR_LENGTH);
      const failed = { ...state, playback: { ...state.playback, error } };
      // Mid-clip, stop the clock - nobody should lose answering time to silence.
      return { state: state.phase === 'playing' && !state.paused ? pause(failed, now, false) : failed };
    }
    case 'retry-playback':
      if (state.phase !== 'loading' && state.phase !== 'playing') throw invalid('Nothing is playing');
      if (state.paused) return { state: resume(state, now) };
      return { state: { ...state, playback: { ...state.playback, attempt: state.playback.attempt + 1, error: null } } };
    case 'pause':
      if (state.phase === 'final' || state.paused) return { state };
      return { state: pause(state, now, false) };
    case 'resume':
      if (!state.paused) return { state };
      return { state: resume(state, now) };
    case 'skip':
      switch (state.phase) {
        case 'countdown':
          return { state: startLoading(state, 0) };
        case 'loading':
        case 'playing':
          return endSong(state, now, true);
        case 'reveal':
          return { state: nextSong(state) };
        default:
          return { state };
      }
    case 'end':
      // The song in progress (if any) is abandoned unscored.
      return state.phase === 'final' ? { state } : { state: toFinal(state) };
    case 'back-to-lobby':
      if (state.phase !== 'final') throw invalid('Finish the game first');
      return { state, complete: true };
    default:
      throw invalid(`Unknown action "${action.type}"`);
  }
};

const handleSubmit = (state: IpodWarState, payload: unknown, context: GameContext): Result => {
  const participantId = context.actor.participantId;
  if (!participantId || !state.roster.includes(participantId)) throw invalid("You're not in this game");
  if (state.phase !== 'playing') throw invalid('Answers are closed');
  if (state.paused) throw invalid('The game is paused');
  if (state.submissions[participantId]) throw invalid("You've already locked in");
  if (!state.phaseEndsAt) throw invalid('Answers are closed');

  const guesses = readGuesses(state, payload);
  const elapsedMs = Math.min(state.config.playbackMs, state.config.playbackMs - msUntil(state.phaseEndsAt, context.now));
  const grade = gradeGuesses(state, state.songs[state.index], guesses, Math.max(0, elapsedMs));
  const next = { ...state, submissions: { ...state.submissions, [participantId]: { guesses, grade } } };
  return maybeEndEarly(next, context);
};

export const handleIpodWarAction = (state: IpodWarState, action: GameAction, context: GameContext): Result => {
  switch (action.type) {
    case 'timer':
      requireRole(context, 'system');
      return handleTimer(state, action.payload, context.now);
    case SYSTEM_ACTIONS.participantsChanged: {
      requireRole(context, 'system');
      const present = new Set(context.participants.map(({ id }) => id));
      const roster = state.roster.filter((id) => present.has(id));
      const pruned = roster.length === state.roster.length ? state : { ...state, roster };
      return maybeEndEarly(pruned, context);
    }
    case SYSTEM_ACTIONS.hostConnection: {
      requireRole(context, 'system');
      const connected = isRecord(action.payload) && action.payload['connected'] === true;
      // No auto-resume when the host comes back: their Resume click is also the browser gesture a
      // freshly loaded page needs before it may play audio.
      if (connected || state.paused || state.phase === 'final') return { state };
      return { state: pause(state, context.now, true) };
    }
    case 'submit':
      requireRole(context, 'player');
      return handleSubmit(state, action.payload, context);
    default:
      requireRole(context, 'host');
      return handleHostAction(state, action, context);
  }
};
