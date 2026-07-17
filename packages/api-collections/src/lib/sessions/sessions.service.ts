import { randomUUID } from 'node:crypto';
import type { Session, SessionPlayer, AccessTokenPayload } from '@inithium/types';
import { createCrudService, CrudService, signTokens } from '@inithium/api-core';
import { buildSessionGroupChannel, buildSessionPlayerChannel, SESSION_EVENTS } from '@inithium/types';
import { SessionModel } from './sessions.model.js';
import { getSessionsPubSub } from './sessions.pubsub.js';

export interface SessionsService extends CrudService<Session> {
  readonly findByLobbyId: (lobbyId: string) => Promise<Session | null>;
  readonly findActiveByHost: (hostId: string) => Promise<Session[]>;
  readonly hostSession: (hostId: string, lobbyId: string) => Promise<Session>;
  readonly joinSession: (
    lobbyId: string,
    displayName: string,
    registeredUserId?: string
  ) => Promise<{ session: Session; player: SessionPlayer; accessToken: string }>;
  readonly kickPlayer: (sessionId: string, hostId: string, playerId: string) => Promise<Session>;
}

const base = createCrudService<Session>(SessionModel);

const normalizeSessionPayload = (data: Partial<Session>): Partial<Session> => ({
  ...data,
  players: data.players ?? [],
  teams: data.teams ?? [],
  playerScores: data.playerScores ?? [],
  teamScores: data.teamScores ?? [],
  status: data.status ?? 'configuring',
  startedAt: data.startedAt ?? null,
  completedAt: data.completedAt ?? null,
  winnerId: data.winnerId ?? null,
  winnerTeamId: data.winnerTeamId ?? null,
});

const issueGuestToken = (playerId: string, lobbyId: string): string => {
  const payload: AccessTokenPayload = { sub: playerId, role: 'guest', lobbyId };
  return signTokens(payload).accessToken;
};

export const sessionsService: SessionsService = {
  ...base,

  findByLobbyId: async (lobbyId) => SessionModel.findOne({ lobbyId: lobbyId.toUpperCase() }).exec(),

  findActiveByHost: async (hostId) => SessionModel.find({ hostId, status: { $in: ['configuring', 'active', 'paused'] } }).exec(),

  createOne: async (data) => base.createOne(normalizeSessionPayload(data)),

  updateOne: async (id, data) => base.updateOne(id, data),

  hostSession: async (hostId, lobbyId) => {
    const normalizedLobbyId = lobbyId.toUpperCase();

    const existing = await SessionModel.findOne({
      hostId,
      status: { $in: ['configuring', 'active', 'paused'] },
    }).exec();
    if (existing) return existing;

    const hostPlayer: SessionPlayer = {
      playerId: hostId,
      displayName: 'Host',
      joinedAt: new Date(),
      isHost: true,
      isConnected: false,
    };

    try {
      return await SessionModel.create({
        lobbyId: normalizedLobbyId,
        hostId,
        config: null,
        players: [hostPlayer],
        teams: [],
        playerScores: [],
        teamScores: [],
        gameState: { game: '', phase: 'lobby' },
        status: 'configuring',
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        const fallback = await SessionModel.findOne({ lobbyId: normalizedLobbyId }).exec();
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  joinSession: async (lobbyId, displayName, registeredUserId) => {
    const playerId = randomUUID();
    const secret = randomUUID();

    const player: SessionPlayer = {
      playerId,
      registeredUser: registeredUserId as unknown as SessionPlayer['registeredUser'],
      displayName,
      secret,
      joinedAt: new Date(),
      isHost: false,
      isConnected: false,
    };

    const session = await SessionModel.findOneAndUpdate(
      { lobbyId: lobbyId.toUpperCase(), status: 'configuring' },
      { $push: { players: player } },
      { new: true }
    ).exec();

    if (!session) throw new Error('Session not found or no longer accepting players');

    const accessToken = issueGuestToken(playerId, session.lobbyId);

    await getSessionsPubSub().publish(buildSessionGroupChannel(session.lobbyId), SESSION_EVENTS.playerJoined, player);

    return { session, player, accessToken };
  },

  kickPlayer: async (sessionId, hostId, playerId) => {
    const session = await SessionModel.findOneAndUpdate(
      { _id: sessionId, hostId },
      { $pull: { players: { playerId } } },
      { new: true }
    ).exec();

    if (!session) throw new Error('Session not found or not owned by host');

    await getSessionsPubSub().publish(buildSessionPlayerChannel(session.lobbyId, playerId), SESSION_EVENTS.playerKicked, {
      reason: 'Removed by host',
    });
    await getSessionsPubSub().publish(buildSessionGroupChannel(session.lobbyId), SESSION_EVENTS.playerLeft, { playerId });

    return session;
  },
};