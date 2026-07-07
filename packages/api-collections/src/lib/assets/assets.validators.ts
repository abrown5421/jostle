import { z } from 'zod';
import type { Asset } from '@inithium/types';

const AssetCategorySchema = z.enum(['image', 'font', 'audio', 'document', 'other']);

export const CreateAssetSchema = z.object({
  filename:        z.string().min(1),
  original_name:   z.string().min(1),
  mimetype:        z.string().min(1),
  size:            z.number().positive(),
  storage_key:     z.string().min(1),
  category:        AssetCategorySchema,
  is_system_asset: z.boolean().default(false),
  owner_type:      z.enum(['app', 'user']).default('app'),
  owner_id:        z.string().nullable().default(null),
}) satisfies z.ZodType<Omit<Asset, '_id' | 'createdAt' | 'updatedAt'>>;

export const UpdateAssetSchema = CreateAssetSchema.partial();

export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetDto = z.infer<typeof UpdateAssetSchema>;
