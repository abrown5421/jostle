import type { Session } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import { SessionModel } from './sessions.model.js';

export interface SessionsService extends CrudService<Session> {
  readonly findByLobbyId: (lobbyId: string) => Promise<Session | null>;
  readonly findActiveByHost: (hostId: string) => Promise<Session[]>;
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

export const sessionsService: SessionsService = {
  ...base,

  findByLobbyId: async (lobbyId) => SessionModel.findOne({ lobbyId: lobbyId.toUpperCase() }).exec(),

  findActiveByHost: async (hostId) => SessionModel.find({ hostId, status: { $in: ['configuring', 'active', 'paused'] } }).exec(),

  createOne: async (data) => base.createOne(normalizeSessionPayload(data)),

  updateOne: async (id, data) => base.updateOne(id, data),
};