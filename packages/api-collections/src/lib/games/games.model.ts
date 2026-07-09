import { Schema, model } from 'mongoose';
import type { Game } from '@inithium/types';

const gameSettingOptionSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const gameSettingSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['boolean', 'number', 'select', 'range'], required: true },
    default: { type: Schema.Types.Mixed, required: true },
    options: { type: [gameSettingOptionSchema] },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    required: { type: Boolean, required: true },
  },
  { _id: false }
);

const gameRequiredAccountSchema = new Schema(
  {
    provider: { type: String, required: true },
    label: { type: String, required: true },
    isPremium: { type: Boolean },
    description: { type: String },
  },
  { _id: false }
);

const gameSchema = new Schema<Game>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['music', 'trivia', 'drawing', 'word', 'social', 'party'], required: true },
    minPlayers: { type: Number, required: true },
    maxPlayers: { type: Number, required: true },
    estimatedMinutes: { type: Number, required: true },
    thumbnailAsset: { type: String },
    bannerAsset: { type: String },
    settings: { type: [gameSettingSchema], default: [] },
    requiredAccounts: { type: [gameRequiredAccountSchema], default: [] },
    status: { type: String, enum: ['active', 'inactive', 'coming_soon'], required: true, default: 'coming_soon' },
    version: { type: String, required: true },
    isOfficial: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const GameModel = model<Game>('Game', gameSchema);