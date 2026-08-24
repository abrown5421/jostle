import type { MessageEnvelope } from '../envelope/index.js';
import { createEnvelope } from '../envelope/index.js';
import type { Middleware } from '../middleware/index.js';
import { composeMiddleware } from '../middleware/index.js';
import type { Transport, Unsubscribe } from '../transport/index.js';

export interface PublishInput {
  readonly topic: string;
  readonly payload: unknown;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export type MessageListener = (envelope: MessageEnvelope) => void | Promise<void>;

export interface PubSubOptions {
  readonly transport: Transport;
  readonly outbound?: ReadonlyArray<Middleware>;
  readonly inbound?: ReadonlyArray<Middleware>;
}

export interface PubSub {
  readonly publish: (input: PublishInput) => Promise<void>;
  readonly subscribe: (topic: string, listener: MessageListener) => Unsubscribe;
}

export function createPubSub(options: PubSubOptions): PubSub {
  const runOutbound = composeMiddleware(options.outbound ?? []);
  const runInbound = composeMiddleware(options.inbound ?? []);

  const publish: PubSub['publish'] = (input) => {
    const envelope = createEnvelope(input);
    return runOutbound(envelope, (finalEnvelope) => options.transport.publish(finalEnvelope.topic, finalEnvelope));
  };

  const subscribe: PubSub['subscribe'] = (topic, listener) =>
    options.transport.subscribe(topic, (message) =>
      runInbound(message.payload as MessageEnvelope, async (finalEnvelope) => {
        await listener(finalEnvelope);
      })
    );

  return { publish, subscribe };
}
