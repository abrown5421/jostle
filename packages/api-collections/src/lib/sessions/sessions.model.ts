import { Schema, model } from 'mongoose';
import type { Session } from '@inithium/types';

const sessionPlayerSchema = new Schema(
  {
    playerId: { type: String, required: true },
    registeredUser: { type: Schema.Types.ObjectId, ref: 'User' },
    displayName: { type: String, required: true },
    secret: { type: String },
    joinedAt: { type: Date, required: true, default: Date.now },
    isHost: { type: Boolean, required: true, default: false },
    isConnected: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const sessionTeamSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String },
    playerIds: { type: [String], default: [] },
  },
  { _id: false }
);

const roundScoreSchema = new Schema(
  {
    roundIndex: { type: Number, required: true },
    points: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const playerScoreSchema = new Schema(
  {
    playerId: { type: String, required: true },
    roundScores: { type: [roundScoreSchema], default: [] },
    totalPoints: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const teamScoreSchema = new Schema(
  {
    teamId: { type: String, required: true },
    roundScores: { type: [roundScoreSchema], default: [] },
    totalPoints: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const sessionConfigSnapshotSchema = new Schema(
  {
    gameId: { type: String, required: true },
    gameKey: { type: String, required: true },
    gameName: { type: String, required: true },
    settings: {
      type: [
        new Schema(
          {
            key: { type: String, required: true },
            label: { type: String, required: true },
            description: { type: String },
            type: { type: String, enum: ['boolean', 'number', 'select', 'range'], required: true },
            default: { type: Schema.Types.Mixed, required: true },
            options: { type: [Schema.Types.Mixed] },
            min: { type: Number },
            max: { type: Number },
            step: { type: Number },
            required: { type: Boolean, required: true },
            value: { type: Schema.Types.Mixed, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);

const sessionSchema = new Schema<Session>(
  {
    lobbyId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    hostId: { type: String, required: true },
    config: { type: sessionConfigSnapshotSchema, required: false, default: null },
    players: { type: [sessionPlayerSchema], default: [] },
    teams: { type: [sessionTeamSchema], default: [] },
    playerScores: { type: [playerScoreSchema], default: [] },
    teamScores: { type: [teamScoreSchema], default: [] },
    gameState: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['configuring', 'active', 'paused', 'completed', 'abandoned'], required: true, default: 'configuring' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    winnerId: { type: String, default: null },
    winnerTeamId: { type: String, default: null },
  },
  { timestamps: true }
);

export const SessionModel = model<Session>('Session', sessionSchema);