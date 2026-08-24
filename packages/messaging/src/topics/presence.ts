import { defineTopic } from './define-topic.js';

export type PresenceStatus = 'online' | 'away' | 'offline' | 'busy';

export interface PresenceEventPayload {
  readonly entityId: string;
  readonly status: PresenceStatus;
  readonly timestamp: number;
}

export interface PresenceTopicParams extends Record<string, string> {
  readonly entityId: string;
}

export const presenceTopic = defineTopic<PresenceTopicParams, PresenceEventPayload>('presence:{entityId}');
