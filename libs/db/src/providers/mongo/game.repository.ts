import type { Model } from 'mongoose';
import { CreateGameInput, GameEntity, GameRepository, UpdateGameInput } from '../../contracts/game.contract';
import type { GameRequirement, GameSettingDefinition } from '../../contracts/game.contract';
import { GameDocument } from '../../schemas/game.schema';

// Sub-documents come back as mongoose objects carrying every path in the flat setting schema
// (undefined `options` on a number setting, ...) - toObject() reduces them to the plain shapes the
// contract describes, so the API never serializes mongoose internals.
const mapToGameEntity = (doc: GameDocument): GameEntity => ({
  id: doc._id.toString(),
  slug: doc.slug,
  title: doc.title,
  tagline: doc.tagline,
  description: doc.description,
  imageUrl: doc.imageUrl,
  icon: doc.icon,
  minPlayers: doc.minPlayers,
  maxPlayers: doc.maxPlayers,
  estimatedMinutes: doc.estimatedMinutes,
  tags: [...doc.tags],
  rules: doc.rules.map(({ title, description }) => ({ title, description })),
  settings: doc.toObject().settings as GameSettingDefinition[],
  // Records seeded before requirements existed read as having none.
  requirements: (doc.toObject().requirements ?? []) as GameRequirement[],
  order: doc.order,
  // Records created before seedVersion existed read as version 0, so they upgrade on next boot.
  seedVersion: doc.seedVersion ?? 0,
  isPublished: doc.isPublished,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const createMongoGameRepository = (model: Model<GameDocument>): GameRepository => ({
  findBySlug: async (slug: string): Promise<GameEntity | null> => {
    const game = await model.findOne({ slug }).exec();
    return game ? mapToGameEntity(game) : null;
  },
  findPublished: async (): Promise<GameEntity[]> => {
    const games = await model.find({ isPublished: true }).sort({ order: 1, title: 1 }).exec();
    return games.map(mapToGameEntity);
  },
  create: async (input: CreateGameInput): Promise<GameEntity> => {
    const game = await model.create(input);
    return mapToGameEntity(game);
  },
  update: async (id: string, input: UpdateGameInput): Promise<GameEntity | null> => {
    // $set for the same reason as page.repository.ts's update - a bare partial would replace the
    // whole document.
    const game = await model.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).exec();
    return game ? mapToGameEntity(game) : null;
  },
});
