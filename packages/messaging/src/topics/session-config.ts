import { defineTopic } from './define-topic.js';

export type SessionConfigEventKind = 'GAME_SELECTED' | 'CONFIGURATION_UPDATED';

export interface SessionConfigEventPayload {
  readonly kind: SessionConfigEventKind;
  readonly sessionId: string;
  readonly gameId: string;
  readonly selectedSettings: Readonly<Record<string, string | number | boolean>>;
}

export interface SessionConfigTopicParams extends Record<string, string> {
  readonly sessionId: string;
}

export const sessionConfigTopic = defineTopic<SessionConfigTopicParams, SessionConfigEventPayload>(
  'session:{sessionId}:config'
);
