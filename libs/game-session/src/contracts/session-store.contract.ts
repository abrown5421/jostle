import type { GameSessionRecord, SessionCredential } from './session.contract';

// Mirrors RealtimeProvider's swappable-provider shape. Async throughout even though the default
// in-memory store never awaits anything, so a future Redis-backed store (needed the moment
// apps/api runs more than one process - see memory.provider.ts in @inithium/realtime) drops in
// without touching session.service.ts.
export interface GameSessionStore {
  readonly name: string;
  get: (code: string) => Promise<GameSessionRecord | null>;
  save: (record: GameSessionRecord) => Promise<void>;
  delete: (code: string) => Promise<void>;
  findByHostUserId: (hostUserId: string) => Promise<GameSessionRecord | null>;
  resolveToken: (token: string) => Promise<SessionCredential | null>;
}
