import { z } from 'zod';
import type { Setting } from '@inithium/types';

const SettingValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.record(z.string(), z.any())
]);

export const CreateSettingSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9-_]+$/, {
    message: "Key must be kebab-case or snake_case alphanumeric characters",
  }),
  value: SettingValueSchema,
  description: z.string().optional(),
  is_public: z.boolean().default(false),
}) satisfies z.ZodType<Omit<Setting, '_id'>>;

export const UpdateSettingSchema = CreateSettingSchema.partial();

export type CreateSettingDto = z.infer<typeof CreateSettingSchema>;
export type UpdateSettingDto = z.infer<typeof UpdateSettingSchema>;