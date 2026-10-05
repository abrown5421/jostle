import { describe, expect, it } from 'vitest';
import type { SessionParticipant } from '../../contracts/session.contract';
import { everyConnectedRosterMember, pruneRoster, toStandings } from './roster';
import {
  elapsedInPhase,
  enterTimedPhase,
  enterUntimedPhase,
  isCurrentTimer,
  pausePhase,
  phaseTimeout,
  resumePhase,
  TIMER_ACTION,
} from './timedPhases';
import type { TimedPhaseState } from './timedPhases';

const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const iso = (ms: number) => new Date(T0 + ms).toISOString();

const IDLE: TimedPhaseState = { phaseEndsAt: null, pausedRemainingMs: null, paused: false, autoPaused: false, timerSeq: 0 };

const participant = (id: string, isConnected = true): SessionParticipant => ({
  id,
  name: id,
  userId: null,
  avatar: null,
  isConnected,
  joinedAt: iso(0),
});

describe('timed phases', () => {
  it('times a phase, pauses with what was left, and resumes from there', () => {
    const timed = enterTimedPhase(IDLE, iso(0), 30_000);
    expect(timed).toMatchObject({ phaseEndsAt: iso(30_000), timerSeq: 1 });
    expect(phaseTimeout(timed)).toEqual({ at: iso(30_000), action: { type: TIMER_ACTION, payload: { seq: 1 } } });
    expect(elapsedInPhase(timed, iso(10_000), 30_000)).toBe(10_000);

    const paused = pausePhase(timed, iso(10_000), true);
    expect(paused).toMatchObject({ paused: true, autoPaused: true, phaseEndsAt: null, pausedRemainingMs: 20_000, timerSeq: 2 });
    expect(phaseTimeout(paused)).toBeNull();
    expect(elapsedInPhase(paused, iso(99_000), 30_000)).toBe(10_000);

    const resumed = resumePhase(paused, iso(50_000));
    expect(resumed).toMatchObject({ paused: false, autoPaused: false, phaseEndsAt: iso(70_000), pausedRemainingMs: null, timerSeq: 3 });
    expect(elapsedInPhase(resumed, iso(55_000), 30_000)).toBe(15_000);
  });

  it('recognises only the current, unpaused timer', () => {
    const timed = enterTimedPhase(IDLE, iso(0), 1_000);
    expect(isCurrentTimer(timed, { seq: timed.timerSeq })).toBe(true);
    expect(isCurrentTimer(timed, { seq: timed.timerSeq - 1 })).toBe(false);
    expect(isCurrentTimer(timed, null)).toBe(false);
    expect(isCurrentTimer(pausePhase(timed, iso(0), false), { seq: timed.timerSeq + 1 })).toBe(false);
  });

  it('has no timer in an untimed phase', () => {
    const untimed = enterUntimedPhase(enterTimedPhase(IDLE, iso(0), 1_000));
    expect(untimed).toMatchObject({ phaseEndsAt: null, timerSeq: 2 });
    expect(phaseTimeout(untimed)).toBeNull();
  });
});

describe('roster helpers', () => {
  it('ranks totals with ties sharing a rank', () => {
    expect(toStandings(['a', 'b', 'c', 'd'], { a: 10, b: 30, c: 30 }, (id) => (id === 'b' ? 5 : 0))).toEqual([
      { participantId: 'b', total: 30, delta: 5, rank: 1 },
      { participantId: 'c', total: 30, delta: 0, rank: 1 },
      { participantId: 'a', total: 10, delta: 0, rank: 3 },
      { participantId: 'd', total: 0, delta: 0, rank: 4 },
    ]);
  });

  it('only waits on connected roster members, and never on an empty room', () => {
    const participants = [participant('a'), participant('b', false), participant('stranger')];
    expect(everyConnectedRosterMember(['a', 'b'], participants, (id) => id === 'a')).toBe(true);
    expect(everyConnectedRosterMember(['a', 'b'], participants, () => false)).toBe(false);
    expect(everyConnectedRosterMember(['b'], participants, () => true)).toBe(false);
  });

  it('prunes leavers, keeping the same array when nobody left', () => {
    const roster = ['a', 'b'];
    expect(pruneRoster(roster, [participant('a'), participant('b')])).toBe(roster);
    expect(pruneRoster(roster, [participant('a')])).toEqual(['a']);
  });
});
