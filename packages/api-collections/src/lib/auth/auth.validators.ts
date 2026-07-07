import { z } from 'zod';

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
  size:       z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  status:     z.enum(['online', 'offline', 'away']).default('offline'),
  shape:      z.enum(['circle', 'square']).default('circle'),
  background: z.string().optional(),
});

const TrianglifyOptionsSchema = z.object({
  variance:  z.number().default(0.75),
  cell_size: z.number().default(40),
  x_colors:  z.union([z.string(), z.array(z.string())]).default('random'),
  y_colors:  z.union([z.string(), z.array(z.string())]).default('random'),
});

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const SignupSchema = z.object({
  email:        z.string().email(),
  password:     z.string().min(8),
  first_name:   z.string().min(1),
  last_name:    z.string().min(1),
  user_banner:  TrianglifyOptionsSchema.partial().default({}),
  user_avatar:  AvatarPropsSchema.partial().default({}),
  bio:          z.string().default(''),
  gender:       GenderSchema.default({ type: 'Prefer Not to Say' }),
  phone_number: z.string().default(''),
  dob:          z.string().default(''),
  address:      AddressSchema.default({}),
  dark_mode:    z.boolean().default(false),
});

export const RefreshSchema = z.object({});

export type LoginDto   = z.infer<typeof LoginSchema>;
export type SignupDto  = z.infer<typeof SignupSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;