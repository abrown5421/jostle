import type { GameSessionStore } from './contracts/session-store.contract';
import { getActiveSessionStore, setActiveSessionStore } from './store/store-registry';
import type { GameCatalog } from './contracts/game-catalog.contract';
import { getActiveGameCatalog, setActiveGameCatalog } from './catalog/catalog-registry';
import type { GameRequirementEvaluator } from './requirements/requirements-registry';
import { getActiveRequirementEvaluator, setActiveRequirementEvaluator } from './requirements/requirements-registry';

export const setGameSessionStore = (store: GameSessionStore): void => setActiveSessionStore(store);
export const getGameSessionStore = (): GameSessionStore => getActiveSessionStore();

// apps/api wires the database-backed game catalogue in at boot - see GameCatalog's own comment.
export const setGameCatalog = (catalog: GameCatalog): void => setActiveGameCatalog(catalog);
export const getGameCatalog = (): GameCatalog => getActiveGameCatalog();

// apps/api wires in the integration-backed evaluator at boot - see GameRequirementEvaluator.
export const setGameRequirementEvaluator = (evaluator: GameRequirementEvaluator): void =>
  setActiveRequirementEvaluator(evaluator);
export const getGameRequirementEvaluator = (): GameRequirementEvaluator => getActiveRequirementEvaluator();

export { memorySessionStore } from './store/memory.session-store';

export {
  hostSession,
  findHostedSession,
  joinSession,
  resolveSessionCredential,
  getSessionSnapshot,
  getSessionWelcome,
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
  GAME_PREPARE_TIMEOUT_MS,
} from './service/session.service';
export type { HostedSession, JoinSessionInput, JoinedSession, SessionWelcome } from './service/session.service';

export { GameSessionError, isGameSessionError, GAME_SESSION_ERROR_CODES } from './service/session.errors';
export type { GameSessionErrorCode, GameSessionErrorDetails } from './service/session.errors';

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
  findMissingRequiredSettings,
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
export type { GameRequirementEvaluator, GameRequirementBlocker } from './requirements/requirements-registry';
export { SYSTEM_ACTIONS } from './contracts/game-definition.contract';
export type {
  GameDefinition,
  GameAction,
  GameActor,
  GameActorRole,
  GameContext,
  GameSetupContext,
  GamePrepareContext,
  GameTimeout,
  GameActionResult,
} from './contracts/game-definition.contract';

// iPod War - its music-source port (wired in by apps/api) and the view/action types its web UI
// codes against.
export * from './games/ipod-war';

// Point of Hue - the view/action types its web UI codes against.
export * from './games/point-of-hue';

// Fishbowl - the view/action types its web UI codes against.
export * from './games/fishbowl';

// Wordle War - its dictionary port (wired in by apps/api) and the view/action types its web UI
// codes against.
export * from './games/wordle-war';

// Shared building blocks for timed, round-based games.
export type { TimedPhaseState, PlayerStanding } from './games/shared';
