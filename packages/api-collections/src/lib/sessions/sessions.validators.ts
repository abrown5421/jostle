import { z } from 'zod';
import type { Session } from '@inithium/types';

const SessionPlayerSchema = z.object({
  playerId: z.string().min(1),
  registeredUser: z.any().optional(),
  displayName: z.string().min(1),
  secret: z.string().optional(),
  joinedAt: z.coerce.date().default(() => new Date()),
  isHost: z.boolean(),
  isConnected: z.boolean(),
});

const SessionTeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().optional(),
  playerIds: z.array(z.string()).default([]),
});

const RoundScoreSchema = z.object({
  roundIndex: z.number().int().nonnegative(),
  points: z.number(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const PlayerScoreSchema = z.object({
  playerId: z.string().min(1),
  roundScores: z.array(RoundScoreSchema).default([]),
  totalPoints: z.number().default(0),
});

const TeamScoreSchema = z.object({
  teamId: z.string().min(1),
  roundScores: z.array(RoundScoreSchema).default([]),
  totalPoints: z.number().default(0),
});

const SessionConfigSnapshotSchema = z.object({
  gameId: z.string().min(1),
  gameKey: z.string().min(1),
  gameName: z.string().min(1),
  settings: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(['boolean', 'number', 'select', 'range']),
      default: z.union([z.string(), z.number(), z.boolean()]),
      options: z.array(z.any()).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      required: z.boolean(),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ).default([]),
});

const BaseGameStateSchema = z.object({
  game: z.string(),
  phase: z.string().min(1),
}).catchall(z.unknown());

export const CreateSessionSchema = z.object({
  lobbyId: z.string().min(1),
  hostId: z.string().min(1),
  config: SessionConfigSnapshotSchema.nullable().default(null),
  players: z.array(SessionPlayerSchema).default([]),
  teams: z.array(SessionTeamSchema).default([]),
  playerScores: z.array(PlayerScoreSchema).default([]),
  teamScores: z.array(TeamScoreSchema).default([]),
  gameState: BaseGameStateSchema,
  status: z.enum(['configuring', 'active', 'paused', 'completed', 'abandoned']).default('configuring'),
  startedAt: z.coerce.date().nullable().default(null),
  completedAt: z.coerce.date().nullable().default(null),
  winnerId: z.string().nullable().default(null),
  winnerTeamId: z.string().nullable().default(null),
}) satisfies z.ZodType<Omit<Session, '_id' | 'createdAt' | 'updatedAt'>, any, any>;

export const UpdateSessionSchema = CreateSessionSchema.partial();

export const HostSessionSchema = z.object({
  lobbyId: z.string().min(1),
});

export const JoinSessionSchema = z.object({
  displayName: z.string().min(1),
});

export const KickPlayerSchema = z.object({
  hostId: z.string().min(1),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;
export type HostSessionDto = z.infer<typeof HostSessionSchema>;
export type JoinSessionDto = z.infer<typeof JoinSessionSchema>;
export type KickPlayerDto = z.infer<typeof KickPlayerSchema>;