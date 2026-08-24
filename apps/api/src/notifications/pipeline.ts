import { notificationFeedTopic, notificationTopic, publishTopic } from '@jostle/messaging';
import { createFormatterRegistry, createNotification, createNotificationEventSubscriber } from '@jostle/notifications';
import type { NotificationEventSubscriber } from '@jostle/notifications';
import { friendRequestFormatter } from '@jostle/notifications/examples';
import { pubsub } from '../messaging/pubsub-client.js';

const registry = createFormatterRegistry();
registry.register(notificationTopic.pattern, friendRequestFormatter);

const knownRecipientIds = new Set<string>();
let subscriber: NotificationEventSubscriber | undefined;

function resubscribe(): void {
  subscriber?.dispose();
  subscriber = createNotificationEventSubscriber({
    pubsub,
    registry,
    sources: [...knownRecipientIds].map((userId) => ({ topic: notificationTopic, params: { userId } })),
    persist: createNotification,
    onNotificationCreated: (notification) =>
      publishTopic(pubsub, notificationFeedTopic, {
        params: { recipientId: notification.recipientId },
        payload: notification,
      }),
  });
}

export function ensureNotificationPipelineSubscription(userId: string): void {
  if (knownRecipientIds.has(userId)) return;
  knownRecipientIds.add(userId);
  resubscribe();
}
