import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { ChannelMessage, ChannelMessageHandler, PubSubAdapter } from '../types/pubsub.types.js';

export interface RedisAdapterOptions {
  readonly connectionOptions: RedisOptions | string;
}

export const createRedisAdapter = ({ connectionOptions }: RedisAdapterOptions): PubSubAdapter => {
  const publisher = typeof connectionOptions === 'string'
    ? new Redis(connectionOptions)
    : new Redis(connectionOptions);

  const subscriber = typeof connectionOptions === 'string'
    ? new Redis(connectionOptions)
    : new Redis(connectionOptions);

  const handlersByChannel = new Map<string, Set<ChannelMessageHandler>>();

  subscriber.on('message', (channel: string, raw: string) => {
    const handlers = handlersByChannel.get(channel);
    if (!handlers || handlers.size === 0) return;
    const message = JSON.parse(raw) as ChannelMessage;
    handlers.forEach((handler) => handler(message));
  });

  return {
    publish: async (message: ChannelMessage) => {
      await publisher.publish(message.channel, JSON.stringify(message));
    },
    subscribe: async (channel: string, handler: ChannelMessageHandler) => {
      const existing = handlersByChannel.get(channel);
      if (existing) {
        existing.add(handler);
        return;
      }
      const handlers = new Set<ChannelMessageHandler>([handler]);
      handlersByChannel.set(channel, handlers);
      await subscriber.subscribe(channel);
    },
    unsubscribe: async (channel: string, handler: ChannelMessageHandler) => {
      const handlers = handlersByChannel.get(channel);
      if (!handlers) return;
      handlers.delete(handler);
      if (handlers.size === 0) {
        handlersByChannel.delete(channel);
        await subscriber.unsubscribe(channel);
      }
    },
    dispose: async () => {
      handlersByChannel.clear();
      await subscriber.quit();
      await publisher.quit();
    },
  };
};