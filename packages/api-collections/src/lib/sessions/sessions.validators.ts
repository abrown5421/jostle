import { z } from 'zod';
import type { GameSession } from '@inithium/types';

const SessionPlayerSchema = z.object({
  player_id:    z.string().min(1),
  user_id:      z.string().optional(),
  display_name: z.string().min(1),
  avatar_color: z.string().optional(),
  score:        z.number().default(0),
  connected:    z.boolean().default(true),
  is_host:      z.boolean().default(false),
});

const IpodWarSettingsSchema = z.object({
  game_type:             z.literal('ipod-war'),
  source:                z.enum(['spotify', 'apple-music']),
  rounds:                z.number().int().min(1),
  clip_duration_seconds: z.number().int().min(1),
});

const ColorMatchSettingsSchema = z.object({
  game_type:              z.literal('color-match'),
  rounds:                 z.number().int().min(1),
  round_duration_seconds: z.number().int().min(1),
});

const FishbowlSettingsSchema = z.object({
  game_type:              z.literal('fishbowl'),
  words_per_player:       z.number().int().min(1),
  round_duration_seconds: z.number().int().min(1),
  team_count:             z.number().int().min(2),
});

const GameSettingsSchema = z.discriminatedUnion('game_type', [
  IpodWarSettingsSchema,
  ColorMatchSettingsSchema,
  FishbowlSettingsSchema,
]);

export const CreateSessionSchema = z.object({
  join_code:  z.string().min(1),
  host_id:    z.string().min(1),
  status:     z.enum(['lobby', 'game-select', 'settings', 'in-progress', 'completed']).default('lobby'),
  game_type:  z.enum(['ipod-war', 'color-match', 'fishbowl']).optional(),
  players:    z.array(SessionPlayerSchema).default([]),
  settings:   GameSettingsSchema.optional(),
  game_state: z.unknown().optional(),
  started_at: z.string().optional(),
  ended_at:   z.string().optional(),
}) satisfies z.ZodType<Omit<GameSession, '_id'>>;

export const UpdateSessionSchema = CreateSessionSchema.partial();

export const JoinSessionSchema = SessionPlayerSchema.pick({
  player_id:    true,
  user_id:      true,
  display_name: true,
  avatar_color: true,
}).extend({
  player_id: z.string().min(1).optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;
export type JoinSessionDto = z.infer<typeof JoinSessionSchema>;