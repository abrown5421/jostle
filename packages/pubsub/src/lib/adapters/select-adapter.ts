import { createInMemoryAdapter } from './in-memory.adapter.js';
import { createRedisAdapter } from './redis.adapter.js';
import type { PubSubAdapter } from '../types/pubsub.types.js';

export const createDefaultAdapter = (): PubSubAdapter => {
  const redisUrl = process.env['REDIS_URL'];
  if (redisUrl) {
    return createRedisAdapter({ connectionOptions: redisUrl });
  }
  return createInMemoryAdapter();
};