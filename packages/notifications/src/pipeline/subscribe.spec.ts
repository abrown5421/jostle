import { createInMemoryTransport, createPubSub, notificationTopic, publishTopic } from '@jostle/messaging';
import { describe, expect, it, vi } from 'vitest';
import { createFormatterRegistry } from './registry.js';
import { createNotificationEventSubscriber } from './subscribe.js';
import type { PersistedNotification } from './subscribe.js';

describe('createNotificationEventSubscriber', () => {
  it('formats, persists, and reports a matching inbound event', async () => {
    const pubsub = createPubSub({ transport: createInMemoryTransport() });
    const registry = createFormatterRegistry();
    registry.register(notificationTopic.pattern, (envelope) => ({
      recipientId: (envelope.payload as { targetId: string }).targetId,
      type: 'friend_request',
      payload: envelope.payload,
    }));

    const persisted: PersistedNotification = {
      id: '1',
      recipientId: 'user-1',
      type: 'friend_request',
      readStatus: false,
      payload: {},
      createdAt: new Date().toISOString(),
    };
    const persist = vi.fn().mockResolvedValue(persisted);
    const onNotificationCreated = vi.fn();

    createNotificationEventSubscriber({
      pubsub,
      registry,
      sources: [{ topic: notificationTopic, params: { userId: 'user-1' } }],
      persist,
      onNotificationCreated,
    });

    await publishTopic(pubsub, notificationTopic, {
      params: { userId: 'user-1' },
      payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
    });

    expect(persist).toHaveBeenCalledWith({
      recipientId: 'user-1',
      type: 'friend_request',
      payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
    });
    expect(onNotificationCreated).toHaveBeenCalledWith(persisted);
  });

  it('skips events with no registered formatter for the topic pattern', async () => {
    const pubsub = createPubSub({ transport: createInMemoryTransport() });
    const registry = createFormatterRegistry();
    const persist = vi.fn();

    createNotificationEventSubscriber({
      pubsub,
      registry,
      sources: [{ topic: notificationTopic, params: { userId: 'user-1' } }],
      persist,
    });

    await publishTopic(pubsub, notificationTopic, {
      params: { userId: 'user-1' },
      payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
    });

    expect(persist).not.toHaveBeenCalled();
  });

  it('skips persistence when the formatter declines the event', async () => {
    const pubsub = createPubSub({ transport: createInMemoryTransport() });
    const registry = createFormatterRegistry();
    registry.register(notificationTopic.pattern, () => undefined);
    const persist = vi.fn();

    createNotificationEventSubscriber({
      pubsub,
      registry,
      sources: [{ topic: notificationTopic, params: { userId: 'user-1' } }],
      persist,
    });

    await publishTopic(pubsub, notificationTopic, {
      params: { userId: 'user-1' },
      payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
    });

    expect(persist).not.toHaveBeenCalled();
  });

  it('stops handling events after dispose', async () => {
    const pubsub = createPubSub({ transport: createInMemoryTransport() });
    const registry = createFormatterRegistry();
    registry.register(notificationTopic.pattern, (envelope) => ({
      recipientId: 'user-1',
      type: 'friend_request',
      payload: envelope.payload,
    }));
    const persist = vi.fn().mockResolvedValue({});

    const subscriber = createNotificationEventSubscriber({
      pubsub,
      registry,
      sources: [{ topic: notificationTopic, params: { userId: 'user-1' } }],
      persist,
    });
    subscriber.dispose();

    await publishTopic(pubsub, notificationTopic, {
      params: { userId: 'user-1' },
      payload: { type: 'request_sent', initiatorId: 'user-2', targetId: 'user-1', metadata: {} },
    });

    expect(persist).not.toHaveBeenCalled();
  });
});
