import { randomInt, randomUUID } from 'node:crypto';
import type { GameSession, SessionPlayer } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import { GameSessionModel } from './sessions.model.js';
import type { PubSub } from '@inithium/pubsub';
import { buildChannel } from '@inithium/pubsub';
import type { JoinSessionDto } from './sessions.validators.js';

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const JOIN_CODE_LENGTH = 5;
export const SESSION_DOMAIN = 'session';

const generateJoinCode = (): string =>
  Array.from({ length: JOIN_CODE_LENGTH }, () => JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)]).join('');

let pubsub: PubSub | null = null;

export const setSessionsPubSub = (instance: PubSub): void => {
  pubsub = instance;
};

const publishSessionEvent = async <T>(sessionId: string, event: string, payload: T): Promise<void> => {
  if (!pubsub) return;
  await pubsub.publish(buildChannel(SESSION_DOMAIN, sessionId), event, payload);
};

export interface SessionsService extends CrudService<GameSession> {
  readonly readOneByJoinCode: (joinCode: string) => Promise<GameSession | null>;
  readonly joinSession: (id: string, player: JoinSessionDto) => Promise<GameSession | null>;
  readonly leaveSession: (id: string, playerId: string) => Promise<GameSession | null>;
  readonly publishStateUpdate: (sessionId: string, payload: unknown) => Promise<void>;
}

const base = createCrudService<GameSession>(GameSessionModel);

export const sessionsService: SessionsService = {
  ...base,

  createOne: async (data) => {
    const rawInput = data as Partial<GameSession>;

    const normalizedPayload: Partial<GameSession> = {
      ...rawInput,
      join_code: rawInput.join_code ?? generateJoinCode(),
      status: rawInput.status ?? 'lobby',
      players: rawInput.players ?? [],
    };

    const session = await base.createOne(normalizedPayload);
    await publishSessionEvent(session._id, 'session:created', session);
    return session;
  },

  updateOne: async (id, data) => {
    const session = await base.updateOne(id, data);
    if (session) {
      await publishSessionEvent(session._id, 'session:updated', session);
    }
    return session;
  },

  deleteOne: async (id) => {
    const session = await base.deleteOne(id);
    if (session) {
      await publishSessionEvent(session._id, 'session:ended', session);
    }
    return session;
  },

  readOneByJoinCode: async (joinCode) =>
    GameSessionModel.findOne({ join_code: joinCode.toUpperCase() }).lean<GameSession>().exec(),

  joinSession: async (id, player) => {
    const newPlayer: SessionPlayer = {
      player_id: player.player_id ?? randomUUID(),
      user_id: player.user_id,
      display_name: player.display_name,
      avatar_color: player.avatar_color,
      score: 0,
      connected: true,
      is_host: false,
    };

    const session = await GameSessionModel.findByIdAndUpdate(
      id,
      { $push: { players: newPlayer } },
      { new: true }
    ).lean<GameSession>().exec();

    if (session) {
      await publishSessionEvent(session._id, 'player:joined', { session, player: newPlayer });
    }

    return session;
  },

  leaveSession: async (id, playerId) => {
    const session = await GameSessionModel.findByIdAndUpdate(
      id,
      { $pull: { players: { player_id: playerId } } },
      { new: true }
    ).lean<GameSession>().exec();

    if (session) {
      await publishSessionEvent(session._id, 'player:left', { session, player_id: playerId });
    }

    return session;
  },

  publishStateUpdate: async (sessionId, payload) => {
    await publishSessionEvent(sessionId, 'session:state-update', payload);
  },
};