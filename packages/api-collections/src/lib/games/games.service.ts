import type { Game } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import { GameModel } from './games.model.js';

export interface GamesService extends CrudService<Game> {
  readonly findByCategory: (category: Game['category']) => Promise<Game[]>;
}

const base = createCrudService<Game>(GameModel);

const normalizeGamePayload = (data: Partial<Game>): Partial<Game> => ({
  ...data,
  settings: data.settings ?? [],
  requiredAccounts: data.requiredAccounts ?? [],
  tags: data.tags ?? [],
  status: data.status ?? 'coming_soon',
  isOfficial: data.isOfficial ?? false,
  createdBy: data.createdBy ?? null,
});

export const gamesService: GamesService = {
  ...base,

  findByCategory: async (category) => GameModel.find({ category }).exec(),

  createOne: async (data) => base.createOne(normalizeGamePayload(data)),

  updateOne: async (id, data) => base.updateOne(id, data),
};