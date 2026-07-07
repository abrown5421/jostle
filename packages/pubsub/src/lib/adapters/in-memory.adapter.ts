import { EventEmitter } from 'node:events';
import { ChannelMessage, ChannelMessageHandler, PubSubAdapter } from '../types/pubsub.types.js';

export const createInMemoryAdapter = (): PubSubAdapter => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);

  return {
    publish: async (message: ChannelMessage) => {
      emitter.emit(message.channel, message);
    },
    subscribe: async (channel: string, handler: ChannelMessageHandler) => {
      emitter.on(channel, handler);
    },
    unsubscribe: async (channel: string, handler: ChannelMessageHandler) => {
      emitter.off(channel, handler);
    },
    dispose: async () => {
      emitter.removeAllListeners();
    },
  };
};