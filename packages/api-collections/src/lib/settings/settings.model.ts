import { Schema, model } from 'mongoose';
import type { Setting } from '@inithium/types';

const settingSchema = new Schema<Setting>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
    is_public: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const SettingModel = model<Setting>('Setting', settingSchema);