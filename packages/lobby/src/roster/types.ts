import type { SessionRosterPlayer } from '@jostle/messaging';

export interface RosterState {
  readonly players: ReadonlyArray<SessionRosterPlayer>;
}

export type RosterAction =
  | { readonly kind: 'received_snapshot'; readonly players: ReadonlyArray<SessionRosterPlayer> }
  | { readonly kind: 'player_joined'; readonly player: SessionRosterPlayer }
  | { readonly kind: 'player_left'; readonly playerId: string }
  | { readonly kind: 'player_kicked'; readonly playerId: string };
