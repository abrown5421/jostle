import { z } from 'zod';
import type { Game } from '@inithium/types';

const GameSettingOptionSchema = z.object({
  label: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const GameSettingSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['boolean', 'number', 'select', 'range']),
  default: z.union([z.string(), z.number(), z.boolean()]),
  options: z.array(GameSettingOptionSchema).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  required: z.boolean(),
});

const GameRequiredAccountSchema = z.object({
  provider: z.string().min(1),
  label: z.string().min(1),
  isPremium: z.boolean().optional(),
  description: z.string().optional(),
});

export const CreateGameSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['music', 'trivia', 'drawing', 'word', 'social', 'party']),
  minPlayers: z.number().int().positive(),
  maxPlayers: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  thumbnailAsset: z.string().url().optional(),
  bannerAsset: z.string().url().optional(),
  settings: z.array(GameSettingSchema).default([]),
  requiredAccounts: z.array(GameRequiredAccountSchema).default([]),
  status: z.enum(['active', 'inactive', 'coming_soon']).default('coming_soon'),
  version: z.string().min(1),
  isOfficial: z.boolean().default(false),
  createdBy: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
}) satisfies z.ZodType<Omit<Game, '_id' | 'createdAt' | 'updatedAt'>>;

export const UpdateGameSchema = CreateGameSchema.partial();

export type CreateGameDto = z.infer<typeof CreateGameSchema>;
export type UpdateGameDto = z.infer<typeof UpdateGameSchema>;