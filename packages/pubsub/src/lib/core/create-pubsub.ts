import { ChannelMessage, ChannelMessageHandler, PubSubAdapter } from '../types/pubsub.types.js';

export interface PubSub {
  readonly publish: <T>(channel: string, event: string, payload: T) => Promise<void>;
  readonly subscribe: (channel: string, handler: ChannelMessageHandler) => Promise<() => Promise<void>>;
}

export const createPubSub = (adapter: PubSubAdapter): PubSub => ({
  publish: async (channel, event, payload) => {
    const message: ChannelMessage = { channel, event, payload };
    await adapter.publish(message);
  },
  subscribe: async (channel, handler) => {
    await adapter.subscribe(channel, handler);
    return () => adapter.unsubscribe(channel, handler);
  },
});