import { defineTopic } from './define-topic.js';

export type NotificationEventType = 'request_sent' | 'request_accepted' | 'request_declined';

export interface NotificationEventPayload {
  readonly type: NotificationEventType;
  readonly initiatorId: string;
  readonly targetId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface NotificationTopicParams extends Record<string, string> {
  readonly userId: string;
}

export const notificationTopic = defineTopic<NotificationTopicParams, NotificationEventPayload>(
  'user:{userId}:notifications'
);
