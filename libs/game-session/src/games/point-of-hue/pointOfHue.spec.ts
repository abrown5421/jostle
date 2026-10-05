import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SYSTEM_ACTIONS } from '../../contracts/game-definition.contract';
import type { GameAction, GameContext } from '../../contracts/game-definition.contract';
import type { SessionParticipant } from '../../contracts/session.contract';
import { hexDeltaE } from './color';
import { MAX_ACCURACY_POINTS, MAX_SPEED_BONUS } from './scoring';
import { drawTargets, MIN_TARGET_SEPARATION, pointOfHueGame, setPointOfHueRandomForTesting } from './pointOfHue.game';
import { COUNTDOWN_MS } from './pointOfHue.reducer';
import type { PointOfHueSettings, PointOfHueState } from './pointOfHue.types';

const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const iso = (ms: number) => new Date(T0 + ms).toISOString();

const SETTINGS: PointOfHueSettings = { rounds: 3, viewSeconds: 10, guessSeconds: 30, endWhenAllAnswered: false, revealSeconds: 10 };

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

const handle = pointOfHueGame.handleAction;
const host = (state: PointOfHueState, action: GameAction, at: number) => handle(state, action, context('host', at));
const system = (state: PointOfHueState, action: GameAction, at: number) => handle(state, action, context('system', at));
const player = (state: PointOfHueState, id: string, action: GameAction, at: number) => handle(state, action, context('player', at, id));
const timer = (state: PointOfHueState, at: number) => system(state, { type: 'timer', payload: { seq: state.timerSeq } }, at);

const create = (settings: Partial<PointOfHueSettings> = {}): PointOfHueState =>
  pointOfHueGame.createInitialState({ participants, settings: { ...SETTINGS, ...settings }, now: iso(0), hostUserId: 'host' }, undefined);

// Countdown -> viewing -> guessing, with guessing starting at `at`.
const toGuessing = (state: PointOfHueState, at: number): PointOfHueState => {
  const viewing = state.phase === 'countdown' ? timer(state, at - 10_000).state : state;
  expect(viewing.phase).toBe('viewing');
  const guessing = timer(viewing, at).state;
  expect(guessing.phase).toBe('guessing');
  return guessing;
};

const target = (state: PointOfHueState) => state.targets[state.index];

beforeEach(() => {
  participants = [participant('p1'), participant('p2'), participant('p3')];
});

afterEach(() => {
  setPointOfHueRandomForTesting(Math.random);
});

describe('Point of Hue setup', () => {
  it('starts with a countdown, one distinct target per round, and everyone on the roster', () => {
    const state = create({ rounds: 12 });
    expect(state).toMatchObject({ phase: 'countdown', phaseEndsAt: iso(COUNTDOWN_MS), roster: ['p1', 'p2', 'p3'] });
    expect(state.targets).toHaveLength(12);
    state.targets.forEach((hex, i) => {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      state.targets.slice(0, i).forEach((earlier) => expect(hexDeltaE(earlier, hex)).toBeGreaterThanOrEqual(MIN_TARGET_SEPARATION));
    });
  });

  it('still draws every target when the random source keeps repeating itself', () => {
    setPointOfHueRandomForTesting(() => 0.5);
    expect(drawTargets(5)).toHaveLength(5);
  });
});

describe('Point of Hue round flow', () => {
  it('shows, then guesses, then grades lock-ins (with speed) and touched pickers (without)', () => {
    let state = toGuessing(create(), 20_000);
    const hex = target(state);

    state = player(state, 'p1', { type: 'submit', payload: { hex: hex.toUpperCase() } }, 20_000).state;
    // p2 drags but never locks in; p3 never touches the picker.
    const drafted = player(state, 'p2', { type: 'draft', payload: { hex } }, 25_000);
    expect(drafted.silent).toBe(true);
    state = drafted.state;

    const ended = timer(state, 50_000);
    expect(ended.state.phase).toBe('reveal');
    expect(ended.scoreDeltas).toEqual({ p1: MAX_ACCURACY_POINTS + MAX_SPEED_BONUS, p2: MAX_ACCURACY_POINTS });
    expect(ended.state.totals).toEqual({ p1: 150, p2: 100, p3: 0 });
    expect(ended.state.phaseEndsAt).toBe(iso(60_000));

    const next = timer(ended.state, 60_000).state;
    expect(next).toMatchObject({ phase: 'viewing', index: 1, lockIns: {}, drafts: {} });
  });

  it('finishes after the last round and only then lets the host go back to the lobby', () => {
    let state = create({ rounds: 2 });
    for (let round = 0; round < 2; round += 1) {
      state = toGuessing(state, 100_000 * (round + 1));
      state = timer(state, 100_000 * (round + 1) + 30_000).state;
      expect(() => host(state, { type: 'back-to-lobby' }, 0)).toThrow(expect.objectContaining({ code: 'INVALID_ACTION' }));
      state = timer(state, 100_000 * (round + 1) + 40_000).state;
    }
    expect(state.phase).toBe('final');
    expect(pointOfHueGame.nextTimeout!(state)).toBeNull();
    expect(host(state, { type: 'back-to-lobby' }, 0).complete).toBe(true);
  });

  it('ends early once every connected player has locked in, when that setting is on', () => {
    participants = [participant('p1'), participant('p2'), participant('p3', false)];
    let state = toGuessing(create({ endWhenAllAnswered: true }), 20_000);
    state = player(state, 'p1', { type: 'submit', payload: { hex: '#112233' } }, 21_000).state;
    expect(state.phase).toBe('guessing');
    expect(player(state, 'p2', { type: 'submit', payload: { hex: '#112233' } }, 22_000).state.phase).toBe('reveal');
  });

  it('plays out the full guessing time when ending early is off', () => {
    let state = toGuessing(create({ endWhenAllAnswered: false }), 20_000);
    ['p1', 'p2', 'p3'].forEach((id) => {
      state = player(state, id, { type: 'submit', payload: { hex: '#112233' } }, 21_000).state;
    });
    expect(state.phase).toBe('guessing');
  });

  it('refuses a second lock-in, lock-ins outside guessing, bad colors and strangers', () => {
    const viewing = timer(create(), COUNTDOWN_MS).state;
    expect(() => player(viewing, 'p1', { type: 'submit', payload: { hex: '#112233' } }, 6_000)).toThrow('Guessing is closed');

    const state = toGuessing(create(), 20_000);
    const once = player(state, 'p1', { type: 'submit', payload: { hex: '#112233' } }, 21_000).state;
    expect(() => player(once, 'p1', { type: 'submit', payload: { hex: '#445566' } }, 22_000)).toThrow("You've already locked in");
    expect(() => player(once, 'stranger', { type: 'submit', payload: { hex: '#445566' } }, 22_000)).toThrow("You're not in this game");
    for (const hex of ['red', '#abc', 42, undefined]) {
      expect(() => player(once, 'p2', { type: 'submit', payload: { hex } }, 22_000)).toThrow('Send a color as #rrggbb');
    }
  });

  it('quietly drops drafts outside guessing, after a lock-in, or unchanged - without an error', () => {
    const viewing = timer(create(), COUNTDOWN_MS).state;
    expect(player(viewing, 'p1', { type: 'draft', payload: { hex: '#112233' } }, 6_000).state).toBe(viewing);

    let state = toGuessing(create(), 20_000);
    state = player(state, 'p1', { type: 'draft', payload: { hex: '#112233' } }, 21_000).state;
    expect(player(state, 'p1', { type: 'draft', payload: { hex: '#112233' } }, 22_000).state).toBe(state);
    state = player(state, 'p1', { type: 'submit', payload: { hex: '#445566' } }, 23_000).state;
    expect(player(state, 'p1', { type: 'draft', payload: { hex: '#778899' } }, 24_000).state).toBe(state);
    // The lock-in, not the earlier draft, is what's graded.
    expect(timer(state, 50_000).state.results.at(-1)?.grades['p1']).toMatchObject({ hex: '#445566', lockedIn: true });
  });

  it('ignores a stale timer and never lets players or the host fire it', () => {
    const state = toGuessing(create(), 20_000);
    const skipped = host(state, { type: 'skip' }, 25_000).state;
    expect(skipped.phase).toBe('reveal');
    expect(system(skipped, { type: 'timer', payload: { seq: state.timerSeq } }, 50_000).state).toBe(skipped);
    expect(() => player(state, 'p1', { type: 'timer', payload: { seq: state.timerSeq } }, 0)).toThrow(
      expect.objectContaining({ code: 'NOT_AUTHORIZED' }),
    );
    expect(() => host(state, { type: 'submit', payload: { hex: '#112233' } }, 0)).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
    expect(() => host(state, { type: 'draft', payload: { hex: '#112233' } }, 0)).toThrow(expect.objectContaining({ code: 'NOT_AUTHORIZED' }));
  });
});

describe('Point of Hue host controls', () => {
  it('freezes the clock on pause and keeps lock-in timing honest across it', () => {
    let state = toGuessing(create(), 20_000);
    state = host(state, { type: 'pause' }, 30_000).state;
    expect(state).toMatchObject({ paused: true, phaseEndsAt: null, pausedRemainingMs: 20_000 });
    expect(pointOfHueGame.nextTimeout!(state)).toBeNull();
    expect(() => player(state, 'p1', { type: 'submit', payload: { hex: '#112233' } }, 31_000)).toThrow('The game is paused');

    state = host(state, { type: 'resume' }, 100_000).state;
    expect(state.phaseEndsAt).toBe(iso(120_000));
    state = player(state, 'p1', { type: 'submit', payload: { hex: '#112233' } }, 105_000).state;
    expect(state.lockIns['p1'].elapsedMs).toBe(15_000);
  });

  it('skips each phase forward', () => {
    let state = create();
    state = host(state, { type: 'skip' }, 1_000).state;
    expect(state.phase).toBe('viewing');
    state = host(state, { type: 'skip' }, 2_000).state;
    expect(state.phase).toBe('guessing');
    state = player(state, 'p1', { type: 'submit', payload: { hex: target(state) } }, 3_000).state;
    const skipped = host(state, { type: 'skip' }, 4_000);
    expect(skipped.state).toMatchObject({ phase: 'reveal' });
    expect(skipped.state.results.at(-1)).toMatchObject({ skipped: true });
    expect(skipped.scoreDeltas?.['p1']).toBeGreaterThan(0);
    expect(host(skipped.state, { type: 'skip' }, 5_000).state).toMatchObject({ phase: 'viewing', index: 1 });
  });

  it('ends the game early without scoring the round in progress', () => {
    let state = toGuessing(create(), 20_000);
    state = player(state, 'p1', { type: 'submit', payload: { hex: target(state) } }, 21_000).state;
    const ended = host(state, { type: 'end' }, 22_000);
    expect(ended.state.phase).toBe('final');
    expect(ended.scoreDeltas).toBeUndefined();
  });

  it('pauses itself when the host screen drops, and prunes players who leave', () => {
    let state = toGuessing(create({ endWhenAllAnswered: true }), 20_000);
    const dropped = system(state, { type: SYSTEM_ACTIONS.hostConnection, payload: { connected: false } }, 25_000).state;
    expect(dropped).toMatchObject({ paused: true, autoPaused: true });

    state = player(state, 'p1', { type: 'submit', payload: { hex: '#112233' } }, 21_000).state;
    state = player(state, 'p2', { type: 'submit', payload: { hex: '#112233' } }, 21_000).state;
    participants = participants.filter(({ id }) => id !== 'p3');
    const result = system(state, { type: SYSTEM_ACTIONS.participantsChanged }, 22_000);
    expect(result.state.roster).toEqual(['p1', 'p2']);
    expect(result.state.phase).toBe('reveal');
  });
});

describe('Point of Hue views', () => {
  it('never shows a phone the target before its reveal, while the host sees it during viewing', () => {
    let state = create();
    const check = () => {
      const hex = target(state);
      const visibleToPhones = JSON.stringify([
        pointOfHueGame.publicView!(state),
        ...['p1', 'p2'].map((id) => pointOfHueGame.privateView!(state, id)),
      ]);
      expect(visibleToPhones.toLowerCase()).not.toContain(hex.toLowerCase());
    };
    check();
    expect(pointOfHueGame.hostView!(state)).toEqual({ phase: 'countdown', targetHex: null });

    state = timer(state, COUNTDOWN_MS).state;
    check();
    expect(pointOfHueGame.hostView!(state)).toEqual({ phase: 'viewing', targetHex: target(state) });

    state = timer(state, 15_000).state;
    state = player(state, 'p1', { type: 'submit', payload: { hex: '#010203' } }, 16_000).state;
    check();
    expect(pointOfHueGame.hostView!(state)).toEqual({ phase: 'guessing', targetHex: null });
  });

  it("never shows a player another's guess before the reveal", () => {
    let state = toGuessing(create(), 20_000);
    state = player(state, 'p1', { type: 'submit', payload: { hex: '#0a0b0c' } }, 21_000).state;
    state = player(state, 'p2', { type: 'draft', payload: { hex: '#0d0e0f' } }, 21_000).state;
    const seenByP3 = JSON.stringify([pointOfHueGame.publicView!(state), pointOfHueGame.privateView!(state, 'p3')]);
    expect(seenByP3).not.toContain('#0a0b0c');
    expect(seenByP3).not.toContain('#0d0e0f');
    expect(pointOfHueGame.privateView!(state, 'p1')).toMatchObject({ lockedHex: '#0a0b0c' });
  });

  it('reveals the target, everyone\'s guesses and standings, and each player their own result', () => {
    let state = toGuessing(create(), 20_000);
    const hex = target(state);
    state = player(state, 'p1', { type: 'submit', payload: { hex } }, 20_000).state;
    state = player(state, 'p2', { type: 'draft', payload: { hex: '#000000' } }, 21_000).state;
    state = timer(state, 50_000).state;

    const publicView = pointOfHueGame.publicView!(state);
    expect(publicView).toMatchObject({
      phase: 'reveal',
      target: hex,
      guesses: { p1: { hex, accuracy: 1, points: 150 } },
      standings: [{ participantId: 'p1', total: 150, delta: 150, rank: 1 }, { rank: 2 }, { rank: 2 }],
    });
    expect(publicView.guesses?.['p3']).toBeUndefined();
    expect(pointOfHueGame.privateView!(state, 'p1')).toMatchObject({
      result: { hex, targetHex: hex, accuracy: 1, accuracyPoints: 100, speedBonus: 50, points: 150, lockedIn: true },
      total: 150,
      rank: 1,
      playerCount: 3,
    });
    expect(pointOfHueGame.privateView!(state, 'p3')).toMatchObject({ result: null, rank: 2 });
  });
});
