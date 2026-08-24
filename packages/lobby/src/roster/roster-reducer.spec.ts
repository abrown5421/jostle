import { describe, expect, it } from 'vitest';
import { INITIAL_ROSTER_STATE, rosterReducer } from './roster-reducer.js';
import type { RosterState } from './types.js';
import type { SessionRosterPlayer } from '@jostle/messaging';

function player(playerId: string): SessionRosterPlayer {
  return { sessionId: 'session-1', playerId, userId: null, displayName: playerId };
}

describe('rosterReducer', () => {
  it('replaces state with a received snapshot', () => {
    const state = rosterReducer(INITIAL_ROSTER_STATE, { kind: 'received_snapshot', players: [player('1'), player('2')] });
    expect(state.players.map((p) => p.playerId)).toEqual(['1', '2']);
  });

  it('appends a joined player', () => {
    const seeded: RosterState = { players: [player('1')] };
    const state = rosterReducer(seeded, { kind: 'player_joined', player: player('2') });
    expect(state.players.map((p) => p.playerId)).toEqual(['1', '2']);
  });

  it('removes a player who left', () => {
    const seeded: RosterState = { players: [player('1'), player('2')] };
    const state = rosterReducer(seeded, { kind: 'player_left', playerId: '1' });
    expect(state.players.map((p) => p.playerId)).toEqual(['2']);
  });

  it('removes a player who was kicked', () => {
    const seeded: RosterState = { players: [player('1'), player('2')] };
    const state = rosterReducer(seeded, { kind: 'player_kicked', playerId: '2' });
    expect(state.players.map((p) => p.playerId)).toEqual(['1']);
  });

  it('does not mutate the previous state object', () => {
    const seeded: RosterState = { players: [player('1')] };
    const state = rosterReducer(seeded, { kind: 'player_joined', player: player('2') });
    expect(state).not.toBe(seeded);
    expect(seeded.players).toHaveLength(1);
  });
});
