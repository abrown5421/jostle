import { Schema, model } from 'mongoose';

const seedManifestSchema = new Schema({
  key: { type: String, required: true, unique: true },
  executedAt: { type: Date, default: Date.now }
});

export const SeedManifestModel = model('SeedManifest', seedManifestSchema, 'seed_manifests');