import type { MessageEnvelope } from '../envelope/index.js';
import type { TopicDefinition } from '../topics/index.js';
import type { Unsubscribe } from '../transport/index.js';
import type { PubSub } from './create-pub-sub.js';

export interface PublishTopicInput<TParams extends Record<string, string>, TPayload> {
  readonly params: TParams;
  readonly payload: TPayload;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export function publishTopic<TParams extends Record<string, string>, TPayload>(
  pubsub: PubSub,
  topic: TopicDefinition<TParams, TPayload>,
  input: PublishTopicInput<TParams, TPayload>
): Promise<void> {
  return pubsub.publish({
    topic: topic.channel(input.params),
    payload: input.payload,
    meta: input.meta,
  });
}

export type TypedMessageListener<TPayload> = (envelope: MessageEnvelope<TPayload>) => void | Promise<void>;

export function subscribeTopic<TParams extends Record<string, string>, TPayload>(
  pubsub: PubSub,
  topic: TopicDefinition<TParams, TPayload>,
  params: TParams,
  listener: TypedMessageListener<TPayload>
): Unsubscribe {
  return pubsub.subscribe(topic.channel(params), (envelope) => listener(envelope as MessageEnvelope<TPayload>));
}
