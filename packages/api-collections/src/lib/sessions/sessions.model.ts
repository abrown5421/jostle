import { Schema, model } from 'mongoose';
import type { GameSession, SessionPlayer } from '@inithium/types';

const sessionPlayerSchema = new Schema<SessionPlayer>(
  {
    player_id:    { type: String, required: true },
    user_id:      { type: String },
    display_name: { type: String, required: true, trim: true },
    avatar_color: { type: String },
    score:        { type: Number, required: true, default: 0 },
    connected:    { type: Boolean, required: true, default: true },
    is_host:      { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const gameSessionSchema = new Schema<GameSession>(
  {
    join_code:  { type: String, required: true, unique: true, uppercase: true, trim: true },
    host_id:    { type: String, required: true },
    status:     {
      type: String,
      enum: ['lobby', 'game-select', 'settings', 'in-progress', 'completed'],
      required: true,
      default: 'lobby',
    },
    game_type:  { type: String, enum: ['ipod-war', 'color-match', 'fishbowl'] },
    players:    { type: [sessionPlayerSchema], required: true, default: [] },
    settings:   { type: Schema.Types.Mixed },
    game_state: { type: Schema.Types.Mixed },
    started_at: { type: String },
    ended_at:   { type: String },
  },
  { timestamps: true }
);

export const GameSessionModel = model<GameSession>('GameSession', gameSessionSchema);