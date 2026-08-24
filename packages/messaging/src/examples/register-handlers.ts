import { createInMemoryTransport } from '../adapters/index.js';
import { createAuthorizationMiddleware, createTransformMiddleware } from '../middleware/index.js';
import { createMultiplexer, createPubSub, publishTopic } from '../pubsub/index.js';
import type { PubSub } from '../pubsub/index.js';
import { notificationTopic, presenceTopic, sessionTopic } from '../topics/index.js';
import { describeNotificationEvent, describePresenceEvent, describeSessionEvent } from './describe-events.js';

export interface ExampleMessaging {
  readonly pubsub: PubSub;
  readonly teardown: () => void;
}

export async function bootstrapExampleMessaging(): Promise<ExampleMessaging> {
  const transport = createInMemoryTransport();

  const pubsub = createPubSub({
    transport,
    outbound: [
      createTransformMiddleware((envelope) => ({
        ...envelope,
        meta: { ...envelope.meta, origin: 'example' },
      })),
    ],
    inbound: [createAuthorizationMiddleware((envelope) => envelope.topic.length > 0)],
  });

  const presence = createMultiplexer(pubsub, presenceTopic);
  const notifications = createMultiplexer(pubsub, notificationTopic);
  const session = createMultiplexer(pubsub, sessionTopic);

  const unsubscribePresence = presence.register({ entityId: 'user-1' }, (envelope) => {
    console.log(describePresenceEvent(envelope));
  });

  const unsubscribeNotifications = notifications.register({ userId: 'user-1' }, (envelope) => {
    console.log(describeNotificationEvent(envelope));
  });

  const unsubscribeSession = session.register({ sessionId: 'session-42' }, (envelope) => {
    console.log(describeSessionEvent(envelope));
  });

  await publishTopic(pubsub, presenceTopic, {
    params: { entityId: 'user-1' },
    payload: { entityId: 'user-1', status: 'online', timestamp: Date.now() },
  });

  await publishTopic(pubsub, notificationTopic, {
    params: { userId: 'user-1' },
    payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
  });

  await publishTopic(pubsub, sessionTopic, {
    params: { sessionId: 'session-42' },
    payload: {
      kind: 'state_sync',
      tick: 1,
      scope: 'player',
      host: { nodeId: 'node-a', metadata: {} },
      data: {},
    },
  });

  return {
    pubsub,
    teardown: () => {
      unsubscribePresence();
      unsubscribeNotifications();
      unsubscribeSession();
    },
  };
}
