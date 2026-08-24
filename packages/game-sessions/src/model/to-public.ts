import type {
  PublicSession,
  PublicSessionConfiguration,
  PublicSessionPlayer,
  SessionConfigurationDocument,
  SessionDocument,
  SessionPlayerDocument,
} from './types.js';

export function toPublicSession(document: SessionDocument): PublicSession {
  return {
    sessionId: document._id.toString(),
    joinCode: document.joinCode,
    hostUserId: document.hostUserId.toString(),
    status: document.status,
    createdAt: document.createdAt.toISOString(),
  };
}

export function toPublicSessionPlayer(document: SessionPlayerDocument): PublicSessionPlayer {
  return {
    playerId: document._id.toString(),
    sessionId: document.sessionId.toString(),
    userId: document.userId ? document.userId.toString() : null,
    displayName: document.displayName,
    avatarUrl: document.avatarUrl,
    joinedAt: document.joinedAt.toISOString(),
  };
}

export function toPublicSessionConfiguration(document: SessionConfigurationDocument): PublicSessionConfiguration {
  return {
    sessionId: document.sessionId.toString(),
    gameId: document.gameId,
    selectedSettings: document.selectedSettings,
    updatedAt: document.updatedAt.toISOString(),
  };
}
