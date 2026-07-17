import type { PubSub } from '@inithium/pubsub';

let pubsubInstance: PubSub | null = null;

export const setSessionsPubSub = (pubsub: PubSub): void => {
  pubsubInstance = pubsub;
};

export const getSessionsPubSub = (): PubSub => {
  if (!pubsubInstance) {
    throw new Error('Sessions pubsub not initialized. Call setSessionsPubSub during bootstrap.');
  }
  return pubsubInstance;
};