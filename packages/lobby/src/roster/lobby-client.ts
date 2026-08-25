import type { SessionRosterPlayer } from '@jostle/messaging';

export type SessionStatus = 'lobby' | 'active' | 'ended';

export class DisplayNameTakenError extends Error {
  constructor(message = 'That display name is already taken in this session.') {
    super(message);
    this.name = 'DisplayNameTakenError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(message = 'No session was found for that join code.') {
    super(message);
    this.name = 'SessionNotFoundError';
  }
}

export interface HostedSession {
  readonly sessionId: string;
  readonly joinCode: string;
  readonly status: SessionStatus;
}

export interface JoinSessionInput {
  readonly joinCode: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
}

export interface JoinSessionResult {
  readonly sessionId: string;
  readonly playerId: string;
}

export interface SessionConfigurationShape {
  readonly sessionId: string;
  readonly gameId: string;
  readonly selectedSettings: Readonly<Record<string, string | number | boolean>>;
  readonly updatedAt: string;
}

export interface SetSessionConfigurationInput {
  readonly sessionId: string;
  readonly gameId: string;
  readonly selectedSettings: Readonly<Record<string, string | number | boolean>>;
}

export interface LobbyClient {
  readonly createSession: () => Promise<HostedSession>;
  readonly getSessionById: (sessionId: string) => Promise<HostedSession | null>;
  readonly joinSession: (input: JoinSessionInput) => Promise<JoinSessionResult>;
  readonly listPlayers: (sessionId: string) => Promise<ReadonlyArray<SessionRosterPlayer>>;
  readonly removePlayer: (input: { sessionId: string; playerId: string }) => Promise<void>;
  readonly setSessionConfiguration: (input: SetSessionConfigurationInput) => Promise<SessionConfigurationShape>;
  readonly getSessionConfiguration: (sessionId: string) => Promise<SessionConfigurationShape | null>;
}
