import type { GameSessionStore } from './contracts/session-store.contract';
import { getActiveSessionStore, setActiveSessionStore } from './store/store-registry';
import type { GameCatalog } from './contracts/game-catalog.contract';
import { getActiveGameCatalog, setActiveGameCatalog } from './catalog/catalog-registry';

export const setGameSessionStore = (store: GameSessionStore): void => setActiveSessionStore(store);
export const getGameSessionStore = (): GameSessionStore => getActiveSessionStore();

// apps/api wires the database-backed game catalogue in at boot - see GameCatalog's own comment.
export const setGameCatalog = (catalog: GameCatalog): void => setActiveGameCatalog(catalog);
export const getGameCatalog = (): GameCatalog => getActiveGameCatalog();

export { memorySessionStore } from './store/memory.session-store';

export {
  hostSession,
  findHostedSession,
  joinSession,
  resolveSessionCredential,
  getSessionSnapshot,
  leaveSession,
  kickParticipant,
  endSession,
  endSessionAsHost,
  selectGame,
  updateGameSettings,
  clearGameSelection,
  startGame,
  dispatchGameAction,
  toSessionSnapshot,
  MAX_PARTICIPANTS,
  MAX_NAME_LENGTH,
  HOST_RECONNECT_GRACE_MS,
} from './service/session.service';
export type { HostedSession, JoinSessionInput, JoinedSession } from './service/session.service';

export { GameSessionError, isGameSessionError, GAME_SESSION_ERROR_CODES } from './service/session.errors';
export type { GameSessionErrorCode } from './service/session.errors';

export { normalizeSessionCode, SESSION_CODE_LENGTH } from './service/sessionCode';

export {
  sessionChannel,
  sessionHostChannel,
  sessionParticipantChannel,
  isGameSessionChannel,
  SESSION_EVENTS,
} from './service/channels';
export type { SessionEndReason, ParticipantRemovedReason } from './service/channels';

export { getGameDefinition, isGamePlayable, listGameDefinitionIds } from './games/registry';

export {
  defaultGameSettings,
  applyGameSettingsPatch,
  resolveGameSettings,
  assertValidGameSettingDefinitions,
} from './service/gameSettings';

export { attachGameSessionGateway } from './gateway/sessionGateway';
export { GAME_SESSION_SOCKET_PATH, GAME_SESSION_CLOSE_CODES } from './gateway/protocol';
export type {
  SessionClientMessage,
  SessionServerMessage,
  SessionLeaveMessage,
  SessionKickMessage,
  SessionEndMessage,
  SessionSelectGameMessage,
  SessionUpdateGameSettingsMessage,
  SessionClearGameMessage,
  SessionStartGameMessage,
  SessionGameActionMessage,
  SessionWelcomeMessage,
  SessionEventMessage,
  SessionErrorMessage,
} from './gateway/protocol';

export { SESSION_STATUSES } from './contracts/session.contract';
export type {
  SessionStatus,
  SessionRole,
  SessionParticipant,
  SessionSnapshot,
  SessionGameSnapshot,
  SessionGameSelection,
  SessionCredential,
  GameSessionRecord,
} from './contracts/session.contract';
export type { GameSessionStore } from './contracts/session-store.contract';
export type { GameCatalog, GameCatalogEntry } from './contracts/game-catalog.contract';
export type {
  GameDefinition,
  GameAction,
  GameActor,
  GameContext,
  GameSetupContext,
  GameActionResult,
} from './contracts/game-definition.contract';
