import { z } from 'zod';
import type { User } from '@inithium/types';

const AddressSchema = z.object({
  street:  z.string().optional(),
  city:    z.string().optional(),
  state:   z.string().optional(),
  zip:     z.string().optional(),
  country: z.string().optional(),
});

const GenderSchema = z.discriminatedUnion('type', [
  z.object({
    type:   z.enum(['Male', 'Female', 'Prefer Not to Say']),
    custom: z.never().optional(),
  }),
  z.object({
    type:   z.literal('Other'),
    custom: z.string().min(1),
  }),
]);

const AvatarPropsSchema = z.object({
  src:        z.string().url().optional().or(z.literal('')),
  alt:        z.string().optional(),
  fallback:   z.string().optional(),
  size:       z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  status:     z.enum(['online', 'offline', 'away']).optional(),
  shape:      z.enum(['circle', 'square']).optional(),
  background: z.string().optional(),
  fontColor:  z.string().optional(),
});

const UserBannerSchema = z.object({
  src:       z.string().optional(),
  variance:  z.number().optional(),
  cell_size: z.number().optional(),
  x_colors:  z.union([z.string(), z.array(z.string())]).optional(),
  y_colors:  z.union([z.string(), z.array(z.string())]).optional(),
});

export const CreateUserSchema = z.object({
  email:        z.string().email(),
  password:     z.string().min(8),
  first_name:   z.string().min(1),
  last_name:    z.string().min(1),
  role:         z.enum(['super-admin', 'admin', 'editor', 'writer', 'user']).default('user'),
  user_banner:  UserBannerSchema.optional(),
  user_avatar:  AvatarPropsSchema.optional(),
  bio:          z.string().optional(),
  gender:       GenderSchema.optional(),
  phone_number: z.string().optional(),
  dob:          z.string().optional(),
  address:      AddressSchema.optional(),
  dark_mode:    z.boolean().default(false),
}) satisfies z.ZodType<Omit<User, '_id'>>;

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;