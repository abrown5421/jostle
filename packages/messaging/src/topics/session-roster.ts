import { defineTopic } from './define-topic.js';

export type SessionRosterEventKind = 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'PLAYER_KICKED';

export interface SessionRosterPlayer {
  readonly sessionId: string;
  readonly playerId: string;
  readonly userId: string | null;
  readonly displayName: string;
  readonly avatarUrl?: string;
}

export interface SessionRosterEventPayload {
  readonly kind: SessionRosterEventKind;
  readonly player: SessionRosterPlayer;
}

export interface SessionRosterTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const sessionRosterTopic = defineTopic<SessionRosterTopicParams, SessionRosterEventPayload>(
  'session:{sessionId}:roster'
);
