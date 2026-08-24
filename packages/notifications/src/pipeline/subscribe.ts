import type { MessageEnvelope, PubSub, TopicDefinition, Unsubscribe } from '@jostle/messaging';
import { subscribeTopic } from '@jostle/messaging';
import type { FormatterRegistry } from './registry.js';
import type { NormalizedNotificationInput } from './types.js';

export interface PersistedNotification<TPayload = unknown> {
  readonly id: string;
  readonly recipientId: string;
  readonly type: string;
  readonly readStatus: boolean;
  readonly payload: TPayload;
  readonly createdAt: string;
}

export interface NotificationSubscriptionSource<
  TParams extends Record<string, string> = Record<string, string>,
  TPayload = unknown,
> {
  readonly topic: TopicDefinition<TParams, TPayload>;
  readonly params: TParams;
}

export interface CreateNotificationEventSubscriberOptions {
  readonly pubsub: PubSub;
  readonly registry: FormatterRegistry;
  readonly sources: ReadonlyArray<NotificationSubscriptionSource<any, any>>;
  readonly persist: (input: NormalizedNotificationInput) => Promise<PersistedNotification>;
  readonly onNotificationCreated?: (notification: PersistedNotification) => void | Promise<void>;
}

export interface NotificationEventSubscriber {
  readonly dispose: () => void;
}

export function createNotificationEventSubscriber(
  options: CreateNotificationEventSubscriberOptions
): NotificationEventSubscriber {
  const unsubscribes: Unsubscribe[] = options.sources.map((source) =>
    subscribeTopic(options.pubsub, source.topic, source.params, async (envelope: MessageEnvelope) => {
      const formatter = options.registry.resolve(source.topic.pattern);
      if (!formatter) return;
      const normalized = formatter(envelope);
      if (!normalized) return;
      const notification = await options.persist(normalized);
      await options.onNotificationCreated?.(notification);
    })
  );

  return {
    dispose: () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    },
  };
}
