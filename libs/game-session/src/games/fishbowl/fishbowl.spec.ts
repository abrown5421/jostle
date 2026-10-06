import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameActionResult, GameContext } from '../../contracts/game-definition.contract';
import type { SessionParticipant } from '../../contracts/session.contract';
import { fishbowlGame } from './fishbowl.game';
import { setFishbowlRandomForTesting } from './random';
import type { FishbowlSettings, FishbowlState } from './fishbowl.types';

const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const iso = (ms: number) => new Date(T0 + ms).toISOString();

const SETTINGS: FishbowlSettings = { cluesPerPlayer: 2, teamCount: 2, turnSeconds: 60, allowSkipping: true };

const participant = (id: string, isConnected = true): SessionParticipant => ({
  id,
  name: id,
  userId: null,
  avatar: null,
  isConnected,
  joinedAt: iso(0),
});

let participants: SessionParticipant[];

const context = (role: 'host' | 'player' | 'system', at: number, participantId: string | null = null): GameContext => ({
  participants,
  actor: { role, participantId },
  now: iso(at),
});

const handle = fishbowlGame.handleAction;
const host = (state: FishbowlState, action: GameAction, at = 0) => handle(state, action, context('host', at));
const system = (state: FishbowlState, action: GameAction, at = 0) => handle(state, action, context('system', at));
const player = (state: FishbowlState, id: string, action: GameAction, at = 0) => handle(state, action, context('player', at, id));
const timer = (state: FishbowlState, at: number) => system(state, { type: 'timer', payload: { seq: state.timerSeq } }, at);
const bowlText = (state: FishbowlState) => state.clues[state.bowl[0]].text;

const create = (settings: Partial<FishbowlSettings> = {}): FishbowlState =>
  fishbowlGame.createInitialState({ participants, settings: { ...SETTINGS, ...settings }, now: iso(0), hostUserId: 'host' }, undefined);

const fillBowl = (state: FishbowlState): FishbowlState =>
  state.teams
    .flatMap((team) => team.members)
    .reduce(
      (current, participantId) =>
        Array.from({ length: current.config.cluesPerPlayer }).reduce<FishbowlState>(
          (inner, _, n) => player(inner, participantId, { type: 'submit-clue', payload: { text: `${participantId} clue ${n + 1}` } }).state,
          current,
        ),
      state,
    );

// Setup -> filled bowl -> begun -> the first presenter's turn running from `at`.
const toFirstTurn = (settings: Partial<FishbowlSettings> = {}, at = 0): FishbowlState => {
  const ready = host(fillBowl(create(settings)), { type: 'begin' }).state;
  return player(ready, ready.presenterId!, { type: 'start-turn' }, at).state;
};

// The presenter guesses every clue left in the bowl.
const guessAll = (state: FishbowlState, at = 1_000): GameActionResult<FishbowlState> => {
  let result: GameActionResult<FishbowlState> = { state };
  while (result.state.phase === 'turn') result = player(result.state, result.state.presenterId!, { type: 'correct' }, at);
  return result;
};

beforeEach(() => {
  participants = ['p1', 'p2', 'p3', 'p4'].map((id) => participant(id));
  // Identity shuffles: teams are [p1, p3] and [p2, p4]; the bowl keeps submission order.
  setFishbowlRandomForTesting(() => 0.999999);
});

afterEach(() => {
  setFishbowlRandomForTesting(Math.random);
});

describe('Fishbowl setup', () => {
  it('refuses to start with fewer than two players per team', () => {
    const setup = { participants: participants.slice(0, 5), settings: { ...SETTINGS, teamCount: 3 }, now: iso(0), hostUserId: 'h' };
    expect(() => fishbowlGame.validateSettings!(setup)).toThrow(expect.objectContaining({ code: 'INVALID_SETTINGS' }));
    expect(() => fishbowlGame.validateSettings!({ ...setup, settings: SETTINGS })).not.toThrow();
  });

  it('deals balanced teams and starts in setup with an empty bowl', () => {
    const state = create();
    expect(state.phase).toBe('setup');
    expect(state.teams.map(({ name, members }) => [name, members])).toEqual([
      ['Red', ['p1', 'p3']],
      ['Blue', ['p2', 'p4']],
    ]);
    expect(fishbowlGame.nextTimeout!(state)).toBeNull();
  });

  it('takes each player’s clues up to their quota, rejecting duplicates', () => {
    let state = create();
    state = player(state, 'p1', { type: 'submit-clue', payload: { text: 'Taylor Swift' } }).state;
    expect(() => player(state, 'p2', { type: 'submit-clue', payload: { text: ' taylor   swift ' } })).toThrow('Someone already added that');
    state = player(state, 'p1', { type: 'submit-clue', payload: { text: 'The Moon' } }).state;
    expect(() => player(state, 'p1', { type: 'submit-clue', payload: { text: 'Mars' } })).toThrow("You've already added all 2");
    expect(() => player(state, 'stranger', { type: 'submit-clue', payload: { text: 'Mars' } })).toThrow("You're not in this game");
  });

  it('lets a player remove only their own clue, and only during setup', () => {
    let state = player(create(), 'p1', { type: 'submit-clue', payload: { text: 'Taylor Swift' } }).state;
    const [clueId] = Object.keys(state.clues);
    expect(() => player(state, 'p2', { type: 'remove-clue', payload: { clueId } })).toThrow('isn’t yours');
    state = player(state, 'p1', { type: 'remove-clue', payload: { clueId } }).state;
    expect(state.clues).toEqual({});
    const playing = toFirstTurn();
    expect(() => player(playing, 'p1', { type: 'remove-clue', payload: { clueId: Object.keys(playing.clues)[0] } })).toThrow(
      'The bowl is already full',
    );
  });

  it('only begins once every player has added all their clues', () => {
    const partial = player(create(), 'p1', { type: 'submit-clue', payload: { text: 'Taylor Swift' } }).state;
    expect(() => host(partial, { type: 'begin' })).toThrow('Waiting on 4 players');
    const ready = host(fillBowl(create()), { type: 'begin' }).state;
    expect(ready).toMatchObject({ phase: 'ready', round: 1, presenterId: 'p1', roundJustStarted: true });
    expect(ready.bowl).toHaveLength(8);
  });

  it('lets the host move players between teams, never emptying one', () => {
    let state = host(create(), { type: 'move-player', payload: { participantId: 'p1', teamId: 'team-2' } }).state;
    expect(state.teams.map(({ members }) => members)).toEqual([['p3'], ['p2', 'p4', 'p1']]);
    expect(() => host(state, { type: 'move-player', payload: { participantId: 'p3', teamId: 'team-2' } })).toThrow('without players');
    expect(() => host(state, { type: 'move-player', payload: { participantId: 'nobody', teamId: 'team-2' } })).toThrow('Pick a player');
  });
});

describe('Fishbowl turns', () => {
  it('only lets the presenter start, and times the turn', () => {
    const ready = host(fillBowl(create()), { type: 'begin' }).state;
    expect(() => player(ready, 'p2', { type: 'start-turn' })).toThrow('Only the presenter');
    const turn = player(ready, 'p1', { type: 'start-turn' }, 1_000).state;
    expect(turn).toMatchObject({ phase: 'turn', phaseEndsAt: iso(61_000), roundJustStarted: true });
    expect(fishbowlGame.nextTimeout!(turn)).toEqual({ at: iso(61_000), action: { type: 'timer', payload: { seq: turn.timerSeq } } });
  });

  it('scores a correct clue, skips to the bottom of the bowl, and undoes the last correct', () => {
    let state = toFirstTurn();
    const first = state.bowl[0];
    state = player(state, 'p1', { type: 'correct' }).state;
    expect(state.turnGuessed).toEqual([first]);
    expect(state.bowl).not.toContain(first);

    const skipped = state.bowl[0];
    state = player(state, 'p1', { type: 'skip-clue' }).state;
    expect(state.bowl.at(-1)).toBe(skipped);

    state = player(state, 'p1', { type: 'undo' }).state;
    expect(state.turnGuessed).toEqual([]);
    expect(state.bowl[0]).toBe(first);
    expect(() => player(state, 'p1', { type: 'undo' })).toThrow('Nothing to undo');
  });

  it('refuses skipping when it’s off, and clue actions from anyone but the presenter', () => {
    const state = toFirstTurn({ allowSkipping: false });
    expect(() => player(state, 'p1', { type: 'skip-clue' })).toThrow('Skipping is turned off');
    expect(() => player(state, 'p3', { type: 'correct' })).toThrow('Only the presenter');
    expect(() => host(state, { type: 'correct' })).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => player(state, 'p1', { type: 'begin' })).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => player(state, 'p1', { type: 'timer', payload: { seq: state.timerSeq } })).toThrow(
      expect.objectContaining({ code: 'NOT_AUTHORIZED' }),
    );
  });

  it('ends the turn when time runs out: points banked, the clue left in the bowl, the other team up', () => {
    let state = toFirstTurn();
    state = player(state, 'p1', { type: 'correct' }).state;
    state = player(state, 'p1', { type: 'correct' }).state;
    const inHand = state.bowl[0];

    const ended = timer(state, 60_000);
    expect(ended.scoreDeltas).toEqual({ p1: 2, p3: 2 });
    expect(ended.state).toMatchObject({ phase: 'ready', presenterId: 'p2', activeTeamIndex: 1, turnGuessed: [] });
    expect(ended.state.bowl).toContain(inHand);
    expect(ended.state.bowl).toHaveLength(6);
    expect(ended.state.scores['team-1']).toEqual([2, 0, 0]);
    expect(ended.state.lastTurn).toMatchObject({ teamId: 'team-1', presenterId: 'p1', round: 1, points: 2, roundEnded: false });
    expect(ended.state.lastTurn?.guessed).toEqual(['p1 clue 1', 'p1 clue 2']);
  });

  it('ignores a stale timer', () => {
    const state = toFirstTurn();
    const ended = host(state, { type: 'skip' }, 5_000).state;
    expect(ended.phase).toBe('ready');
    expect(system(ended, { type: 'timer', payload: { seq: state.timerSeq } }, 60_000).state).toBe(ended);
  });

  it('rotates presenters within each team across turns', () => {
    let state = toFirstTurn();
    const presenters: string[] = [];
    for (let turn = 0; turn < 4; turn += 1) {
      presenters.push(state.presenterId!);
      state = timer(state, 60_000).state;
      state = player(state, state.presenterId!, { type: 'start-turn' }).state;
    }
    expect(presenters).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(state.presenterId).toBe('p1');
  });
});

describe('Fishbowl rounds', () => {
  it('ends the turn and the round when the bowl empties, refilling it for the next team in round 2', () => {
    const result = guessAll(toFirstTurn());
    expect(result.scoreDeltas).toEqual({ p1: 8, p3: 8 });
    expect(result.state).toMatchObject({ phase: 'ready', round: 2, presenterId: 'p2', roundJustStarted: true });
    expect(result.state.bowl).toHaveLength(8);
    expect(result.state.lastTurn).toMatchObject({ round: 1, points: 8, roundEnded: true });
  });

  it('finishes after round 3 with each round scored separately', () => {
    let state = toFirstTurn();
    for (let round = 1; round <= 3; round += 1) {
      state = guessAll(state).state;
      if (state.phase === 'ready') state = player(state, state.presenterId!, { type: 'start-turn' }).state;
    }
    expect(state.phase).toBe('final');
    expect(state.scores).toEqual({ 'team-1': [8, 0, 8], 'team-2': [0, 8, 0] });
    expect(fishbowlGame.publicView!(state).teams.map(({ name, total, rank }) => [name, total, rank])).toEqual([
      ['Red', 16, 1],
      ['Blue', 8, 2],
    ]);
    expect(host(state, { type: 'back-to-lobby' }).complete).toBe(true);
  });
});

describe('Fishbowl host controls and the room', () => {
  it('pauses and resumes the turn clock, refusing clue actions while paused', () => {
    let state = toFirstTurn({}, 0);
    state = host(state, { type: 'pause' }, 20_000).state;
    expect(state).toMatchObject({ paused: true, pauseCause: 'host', pausedRemainingMs: 40_000 });
    expect(() => player(state, 'p1', { type: 'correct' })).toThrow('The turn is paused');
    state = host(state, { type: 'resume' }, 90_000).state;
    expect(state).toMatchObject({ paused: false, pauseCause: null, phaseEndsAt: iso(130_000) });
  });

  it('passes over a presenter before their turn, and ends a turn early', () => {
    const ready = host(fillBowl(create()), { type: 'begin' }).state;
    const passed = host(ready, { type: 'skip' }).state;
    expect(passed).toMatchObject({ phase: 'ready', presenterId: 'p3', activeTeamIndex: 0 });
    const turn = player(passed, 'p3', { type: 'start-turn' }).state;
    expect(host(turn, { type: 'skip' }).state).toMatchObject({ phase: 'ready', presenterId: 'p2' });
  });

  it('ends the game early without banking the turn in progress', () => {
    let state = toFirstTurn();
    state = player(state, 'p1', { type: 'correct' }).state;
    const ended = host(state, { type: 'end' });
    expect(ended.state.phase).toBe('final');
    expect(ended.scoreDeltas).toBeUndefined();
    expect(ended.state.scores['team-1']).toEqual([0, 0, 0]);
  });

  it('pauses the turn when the presenter drops, and resumes it when they’re back', () => {
    const state = toFirstTurn({}, 0);
    participants = [participant('p1', false), ...participants.slice(1)];
    const dropped = system(state, { type: SYSTEM_ACTIONS.participantsChanged }, 10_000).state;
    expect(dropped).toMatchObject({ paused: true, autoPaused: true, pauseCause: 'presenter-disconnected', pausedRemainingMs: 50_000 });

    participants = [participant('p1'), ...participants.slice(1)];
    const back = system(dropped, { type: SYSTEM_ACTIONS.participantsChanged }, 30_000).state;
    expect(back).toMatchObject({ paused: false, pauseCause: null, phaseEndsAt: iso(80_000) });
  });

  it('pauses the turn when the host screen drops', () => {
    const state = toFirstTurn();
    expect(system(state, { type: SYSTEM_ACTIONS.hostConnection, payload: { connected: false } }, 5_000).state).toMatchObject({
      paused: true,
      pauseCause: 'host-disconnected',
    });
  });

  it('replaces a presenter who drops before starting, and ends the turn of one who leaves', () => {
    const ready = host(fillBowl(create()), { type: 'begin' }).state;
    participants = [participant('p1', false), ...participants.slice(1)];
    expect(system(ready, { type: SYSTEM_ACTIONS.participantsChanged }).state).toMatchObject({ presenterId: 'p3', activeTeamIndex: 0 });

    participants = ['p1', 'p2', 'p3', 'p4'].map((id) => participant(id));
    let turn = toFirstTurn();
    turn = player(turn, 'p1', { type: 'correct' }).state;
    participants = participants.filter(({ id }) => id !== 'p1');
    const left = system(turn, { type: SYSTEM_ACTIONS.participantsChanged });
    expect(left.state).toMatchObject({ phase: 'ready', presenterId: 'p2' });
    expect(left.state.teams[0].members).toEqual(['p3']);
    expect(left.scoreDeltas).toEqual({ p3: 1 });
    // Their clues stay in play.
    expect(Object.values(left.state.clues).some(({ authorId }) => authorId === 'p1')).toBe(true);
  });
});

describe('Fishbowl views', () => {
  it('shows a clue in play only to the presenter holding it', () => {
    let state = fillBowl(create());
    const everyClue = Object.values(state.clues).map(({ text }) => text);
    const leaks = (seenBy: string[]) => {
      const visible = JSON.stringify([fishbowlGame.publicView!(state), ...seenBy.map((id) => fishbowlGame.privateView!(state, id))]);
      return everyClue.filter((text) => visible.includes(text));
    };

    // Setup: each player sees only their own clues.
    expect(fishbowlGame.privateView!(state, 'p2').myClues.map(({ text }) => text)).toEqual(['p2 clue 1', 'p2 clue 2']);
    expect(leaks([])).toEqual([]);

    state = host(state, { type: 'begin' }).state;
    expect(leaks(['p1', 'p2', 'p3', 'p4'])).toEqual([]);

    state = player(state, 'p1', { type: 'start-turn' }).state;
    expect(fishbowlGame.privateView!(state, 'p1')).toMatchObject({ isPresenter: true, currentClue: bowlText(state), canUndo: false });
    expect(leaks(['p2', 'p3', 'p4'])).toEqual([]);

    state = player(state, 'p1', { type: 'correct' }).state;
    expect(fishbowlGame.privateView!(state, 'p1').canUndo).toBe(true);
    expect(fishbowlGame.publicView!(state)).toMatchObject({ turnPoints: 1, bowlCount: 7, totalClues: 8 });
    expect(leaks(['p2', 'p3', 'p4'])).toEqual([]);

    // Once the turn is over, only what it guessed is public.
    state = timer(state, 60_000).state;
    expect(leaks(['p1', 'p2', 'p3', 'p4'])).toEqual(['p1 clue 1']);
  });

  it('reports setup progress and team standings', () => {
    const state = player(create(), 'p1', { type: 'submit-clue', payload: { text: 'Taylor Swift' } }).state;
    expect(fishbowlGame.publicView!(state)).toMatchObject({
      phase: 'setup',
      submitted: { p1: 1, p2: 0, p3: 0, p4: 0 },
      cluesPerPlayer: 2,
      teams: [
        { name: 'Red', color: 'red', total: 0, rank: 1 },
        { name: 'Blue', color: 'blue', total: 0, rank: 1 },
      ],
    });
    expect(fishbowlGame.privateView!(state, 'p3')).toMatchObject({ teamId: 'team-1', isPresenter: false, cluesRequired: 2, myClues: [] });
  });
});
