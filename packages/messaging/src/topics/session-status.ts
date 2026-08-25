import { defineTopic } from './define-topic.js';

export type SessionStatusValue = 'lobby' | 'active' | 'ended';

export interface SessionStatusEventPayload {
  readonly sessionId: string;
  readonly status: SessionStatusValue;
}

export interface SessionStatusTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const sessionStatusTopic = defineTopic<SessionStatusTopicParams, SessionStatusEventPayload>(
  'session:{sessionId}:status'
);
