export const buildSessionGroupChannel = (lobbyId: string): string =>
  `session:${lobbyId.toUpperCase()}`;

export const buildSessionPlayerChannel = (lobbyId: string, playerId: string): string =>
  `session:${lobbyId.toUpperCase()}:player:${playerId}`;

export const SESSION_EVENTS = {
  playerJoined: 'session:player-joined',
  playerLeft: 'session:player-left',
  playerKicked: 'session:player-kicked',
  stateUpdated: 'session:state-updated',
} as const;

export type SessionEvent = (typeof SESSION_EVENTS)[keyof typeof SESSION_EVENTS];