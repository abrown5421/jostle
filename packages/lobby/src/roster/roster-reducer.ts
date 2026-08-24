import type { RosterAction, RosterState } from './types.js';

export const INITIAL_ROSTER_STATE: RosterState = { players: [] };

export function rosterReducer(state: RosterState, action: RosterAction): RosterState {
  switch (action.kind) {
    case 'received_snapshot':
      return { players: action.players };
    case 'player_joined':
      return { players: [...state.players, action.player] };
    case 'player_left':
    case 'player_kicked':
      return { players: state.players.filter((player) => player.playerId !== action.playerId) };
    default:
      return state;
  }
}
