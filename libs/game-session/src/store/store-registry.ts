import type { GameSessionStore } from '../contracts/session-store.contract';
import { memorySessionStore } from './memory.session-store';

// Same shared-mutable-reference recipe as @inithium/realtime's provider-registry.ts - both the
// service and index.ts's setter need the one current store without importing each other.
let current: GameSessionStore = memorySessionStore;

export const setActiveSessionStore = (store: GameSessionStore): void => {
  current = store;
};

export const getActiveSessionStore = (): GameSessionStore => current;
