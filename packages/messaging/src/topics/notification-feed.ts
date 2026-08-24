import { defineTopic } from './define-topic.js';

export interface NotificationFeedEventPayload<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly readStatus: boolean;
  readonly payload: TPayload;
  readonly createdAt: string;
}

export interface NotificationFeedTopicParams extends Record<string, string> {
  readonly recipientId: string;
}

export const notificationFeedTopic = defineTopic<NotificationFeedTopicParams, NotificationFeedEventPayload>(
  'notifications:{recipientId}:feed'
);
