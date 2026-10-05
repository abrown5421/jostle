import type { GameSettingValues } from '@inithium/db';
import type { GameAction } from '../contracts/game-definition.contract';
import type { SessionRole, SessionSnapshot } from '../contracts/session.contract';
import type { GameSessionErrorCode } from '../service/session.errors';

// Wire shapes for the `/realtime/session` WebSocket endpoint. Framework-agnostic (no `ws` or DOM
// types) so the browser client in @inithium/api-client can `import type` them - the same
// arrangement as @inithium/realtime's own gateway/protocol.ts.
export const GAME_SESSION_SOCKET_PATH = '/realtime/session';

// 4000-4999 is the range RFC 6455 leaves to applications. Every code here is terminal: the
// client must NOT auto-reconnect after one (reconnecting with the same token can never succeed).
// Any other close (1006 network drop, server restart, ...) is retryable.
export const GAME_SESSION_CLOSE_CODES = {
  invalidToken: 4401,
  removed: 4403,
  sessionEnded: 4410,
} as const;

export interface SessionLeaveMessage {
  readonly type: 'leave';
}

export interface SessionKickMessage {
  readonly type: 'host:kick';
  readonly participantId: string;
}

export interface SessionEndMessage {
  readonly type: 'host:end';
}

// Picks (or switches) the session's game, resetting its settings to the game's defaults.
export interface SessionSelectGameMessage {
  readonly type: 'host:select-game';
  readonly gameId: string;
}

// A partial change - only the keys being changed. Validated against the selected game's catalogue
// setting definitions; any bad key or value rejects the whole message.
export interface SessionUpdateGameSettingsMessage {
  readonly type: 'host:update-game-settings';
  readonly settings: Partial<GameSettingValues>;
}

export interface SessionClearGameMessage {
  readonly type: 'host:clear-game';
}

// Starts the selected game with its configured settings.
export interface SessionStartGameMessage {
  readonly type: 'host:start-game';
}

export interface SessionGameActionMessage {
  readonly type: 'game:action';
  readonly action: GameAction;
}

export type SessionClientMessage =
  | SessionLeaveMessage
  | SessionKickMessage
  | SessionEndMessage
  | SessionSelectGameMessage
  | SessionUpdateGameSettingsMessage
  | SessionClearGameMessage
  | SessionStartGameMessage
  | SessionGameActionMessage;

// First frame on every connection (including reconnects) - a full snapshot, so a client never
// has to reconcile anything it missed while disconnected.
export interface SessionWelcomeMessage {
  readonly type: 'welcome';
  readonly role: SessionRole;
  readonly participantId: string | null;
  readonly session: SessionSnapshot;
}

export interface SessionEventMessage<TPayload = unknown> {
  readonly type: 'event';
  readonly event: string;
  readonly payload: TPayload;
}

export interface SessionErrorMessage {
  readonly type: 'error';
  readonly code: GameSessionErrorCode | 'MALFORMED_MESSAGE' | 'UNKNOWN_MESSAGE' | 'INTERNAL_ERROR';
  readonly message: string;
}

export type SessionServerMessage = SessionWelcomeMessage | SessionEventMessage | SessionErrorMessage;
