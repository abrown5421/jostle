import type { GameSessionStore } from '../contracts/session-store.contract';
import type { GameSessionRecord, SessionCredential } from '../contracts/session.contract';

const sessionsByCode = new Map<string, GameSessionRecord>();
const codeByHostUserId = new Map<string, string>();
const credentialsByToken = new Map<string, SessionCredential>();

const removeIndexes = (record: GameSessionRecord): void => {
  if (codeByHostUserId.get(record.hostUserId) === record.code) codeByHostUserId.delete(record.hostUserId);
  credentialsByToken.delete(record.hostToken);
  record.participants.forEach((participant) => credentialsByToken.delete(participant.token));
};

const addIndexes = (record: GameSessionRecord): void => {
  codeByHostUserId.set(record.hostUserId, record.code);
  credentialsByToken.set(record.hostToken, { code: record.code, role: 'host', participantId: null });
  record.participants.forEach((participant) =>
    credentialsByToken.set(participant.token, { code: record.code, role: 'player', participantId: participant.id }),
  );
};

// Zero-infra default, same tradeoff as @inithium/realtime's memoryProvider: sessions live and
// die with this process. Fine for a party game (a session is minutes-to-hours long and
// worthless after the host leaves), but a horizontally-scaled API needs a shared store.
export const memorySessionStore: GameSessionStore = {
  name: 'In-Memory (single-process)',
  get: async (code) => sessionsByCode.get(code) ?? null,
  save: async (record) => {
    const previous = sessionsByCode.get(record.code);
    if (previous) removeIndexes(previous);
    sessionsByCode.set(record.code, record);
    addIndexes(record);
  },
  delete: async (code) => {
    const previous = sessionsByCode.get(code);
    if (!previous) return;
    removeIndexes(previous);
    sessionsByCode.delete(code);
  },
  findByHostUserId: async (hostUserId) => {
    const code = codeByHostUserId.get(hostUserId);
    return code ? (sessionsByCode.get(code) ?? null) : null;
  },
  resolveToken: async (token) => credentialsByToken.get(token) ?? null,
};
