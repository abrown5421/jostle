import { Schema, model } from 'mongoose';
import type { Asset } from '@inithium/types';

const assetCategoryValues = ['image', 'font', 'audio', 'document', 'other'];

const assetSchema = new Schema<Asset>(
  {
    filename:        { type: String, required: true, trim: true },
    original_name:   { type: String, required: true, trim: true },
    mimetype:        { type: String, required: true, trim: true },
    size:            { type: Number, required: true },
    storage_key:     { type: String, required: true, unique: true, trim: true },
    category:        { type: String, enum: assetCategoryValues, required: true },
    is_system_asset: { type: Boolean, required: true, default: false },
    owner_type:      { type: String, enum: ['app', 'user'], required: true, default: 'app' },
    owner_id:        { type: String, default: null },
  },
  { timestamps: true }
);

export const AssetModel = model<Asset>('Asset', assetSchema);
