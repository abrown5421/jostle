import mongoose, { Schema, Document } from 'mongoose';
import { GAME_REQUIREMENT_KINDS, GAME_SETTING_TYPES } from '../contracts/game.contract';
import type { GameRequirement, GameRule, GameSettingDefinition } from '../contracts/game.contract';

export interface GameDocument extends Document {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  imageUrl?: string;
  icon?: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes?: number;
  tags: string[];
  rules: GameRule[];
  settings: GameSettingDefinition[];
  requirements: GameRequirement[];
  order: number;
  seedVersion: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameRuleSchema = new Schema<GameRule>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

// One flat sub-schema covering every GameSettingDefinition variant - the per-type fields
// (min/max/step/unit for numbers, options for selects, provider/resource/... for integration
// resources) are simply absent on the others. Whether a
// definition is internally consistent (default within range, default among options) is checked by
// @inithium/game-session's settings validator, the same code that validates the host's input.
const gameSettingSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: false },
    type: { type: String, required: true, enum: GAME_SETTING_TYPES },
    default: { type: Schema.Types.Mixed, required: true },
    min: { type: Number, required: false },
    max: { type: Number, required: false },
    step: { type: Number, required: false },
    unit: { type: String, required: false },
    options: {
      type: [new Schema({ value: { type: String, required: true }, label: { type: String, required: true } }, { _id: false })],
      default: undefined,
    },
    provider: { type: String, required: false },
    resource: { type: String, required: false },
    required: { type: Boolean, required: false },
    minItemsFromSetting: { type: String, required: false },
  },
  { _id: false },
);

// Flat for the same reason as gameSettingSchema - kind-specific fields are absent on other kinds.
const gameRequirementSchema = new Schema(
  {
    kind: { type: String, required: true, enum: GAME_REQUIREMENT_KINDS },
    provider: { type: String, required: false },
    capabilities: { type: [String], default: undefined },
  },
  { _id: false },
);

const gameSchema = new Schema<GameDocument>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false },
    icon: { type: String, required: false },
    minPlayers: { type: Number, required: true, min: 1 },
    maxPlayers: { type: Number, required: true, min: 1 },
    estimatedMinutes: { type: Number, required: false },
    tags: { type: [String], required: true, default: [] },
    rules: { type: [gameRuleSchema], required: true, default: [] },
    settings: { type: [gameSettingSchema], required: true, default: [] },
    requirements: { type: [gameRequirementSchema], required: true, default: [] },
    order: { type: Number, required: true, default: 0 },
    seedVersion: { type: Number, required: true, default: 0 },
    isPublished: { type: Boolean, required: true, default: false, index: true },
  },
  { timestamps: true },
);

export const GameModel = mongoose.models['Game'] || mongoose.model<GameDocument>('Game', gameSchema);
