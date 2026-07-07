import path from 'path';
import fs from 'fs';
import { Model } from 'mongoose';

type SeedPolicy = 'assert' | 'once';

interface SeedRecord {
  seedPolicy: SeedPolicy;
  [key: string]: unknown;
}

interface CollectionConfig {
  name: string;
  model: Model<any>;
  seedFile: string;
  naturalKey: string;
}

const ENV_PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

function interpolateEnvPlaceholders<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(ENV_PLACEHOLDER_PATTERN, (_match, envKey: string) => {
      const envValue = process.env[envKey];
      if (envValue === undefined) {
        throw new Error(`[hydration] Missing environment variable "${envKey}" referenced in seed data`);
      }
      return envValue;
    }) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateEnvPlaceholders(item)) as unknown as T;
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = interpolateEnvPlaceholders(val);
    }
    return result as T;
  }

  return value;
}

async function hydrateCollection(
  config: CollectionConfig,
  ManifestModel: Model<any>
): Promise<void> {
  const { name, model, seedFile, naturalKey } = config;

  if (!fs.existsSync(seedFile)) {
    console.warn(`[hydration] Seed file not found, skipping: ${seedFile}`);
    return;
  }

  const rawSeeds: SeedRecord[] = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
  const seeds: SeedRecord[] = interpolateEnvPlaceholders(rawSeeds);

  let asserted = 0;
  let inserted = 0;
  let skipped  = 0;

  for (const seed of seeds) {
    const { seedPolicy, ...doc } = seed;
    const keyValue = doc[naturalKey] as string;
    const filter = { [naturalKey]: keyValue };
    const manifestKey = `${name}:${keyValue}`;

    if (seedPolicy === 'assert') {
      await model.findOneAndUpdate(filter, { $set: doc }, { upsert: true, returnDocument: 'after' });
      asserted++;
    } else {
      const hasRun = await ManifestModel.findOne({ key: manifestKey }).lean();

      if (!hasRun) {
        const exists = await model.findOne(filter).lean();
        if (!exists) {
          await model.create(doc);
          inserted++;
        } else {
          skipped++;
        }
        await ManifestModel.create({ key: manifestKey, executedAt: new Date() });
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `[hydration] ${name}: ${asserted} asserted | ${inserted} inserted | ${skipped} skipped`
  );
}

export async function runHydration(models: {
  PageModel:     Model<any>;
  SettingModel:  Model<any>;
  UserModel:     Model<any>;
  AssetModel:    Model<any>;
  ManifestModel: Model<any>;
}): Promise<void> {
  console.log('[hydration] Starting seed hydration...');

  const seedDir = path.resolve(__dirname, 'seed');

  const collections: CollectionConfig[] = [
    {
      name:       'settings',
      model:      models.SettingModel,
      seedFile:   path.join(seedDir, 'settings.seed.json'),
      naturalKey: 'key',
    },
    {
      name:       'users',
      model:      models.UserModel,
      seedFile:   path.join(seedDir, 'users.seed.json'),
      naturalKey: 'email',
    },
    {
      name:       'pages',
      model:      models.PageModel,
      seedFile:   path.join(seedDir, 'pages.seed.json'),
      naturalKey: 'key',
    },
    {
      name:       'assets',
      model:      models.AssetModel,
      seedFile:   path.join(seedDir, 'assets.seed.json'),
      naturalKey: 'storage_key',
    },
  ];

  for (const config of collections) {
    await hydrateCollection(config, models.ManifestModel);
  }

  console.log('[hydration] Seed hydration complete.');
}