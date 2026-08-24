import type { MessageEnvelope } from '../envelope/index.js';
import type { TopicDefinition } from '../topics/index.js';
import type { Unsubscribe } from '../transport/index.js';
import type { PubSub } from './create-pub-sub.js';
import type { TypedMessageListener } from './typed-topic.js';

export interface Multiplexer<TParams extends Record<string, string>, TPayload> {
  readonly register: (params: TParams, listener: TypedMessageListener<TPayload>) => Unsubscribe;
}

export function createMultiplexer<TParams extends Record<string, string>, TPayload>(
  pubsub: PubSub,
  topic: TopicDefinition<TParams, TPayload>
): Multiplexer<TParams, TPayload> {
  const listenersByChannel = new Map<string, Set<TypedMessageListener<TPayload>>>();
  const unsubscribeByChannel = new Map<string, Unsubscribe>();

  const dispatch = (channel: string, envelope: MessageEnvelope<TPayload>): void => {
    for (const listener of listenersByChannel.get(channel) ?? []) {
      listener(envelope);
    }
  };

  const register = (params: TParams, listener: TypedMessageListener<TPayload>): Unsubscribe => {
    const channel = topic.channel(params);
    const listeners = listenersByChannel.get(channel) ?? new Set<TypedMessageListener<TPayload>>();
    listeners.add(listener);
    listenersByChannel.set(channel, listeners);

    if (!unsubscribeByChannel.has(channel)) {
      unsubscribeByChannel.set(
        channel,
        pubsub.subscribe(channel, (envelope) => dispatch(channel, envelope as MessageEnvelope<TPayload>))
      );
    }

    return () => {
      const remaining = listenersByChannel.get(channel);
      if (!remaining) return;
      remaining.delete(listener);
      if (remaining.size === 0) {
        listenersByChannel.delete(channel);
        unsubscribeByChannel.get(channel)?.();
        unsubscribeByChannel.delete(channel);
      }
    };
  };

  return { register };
}
