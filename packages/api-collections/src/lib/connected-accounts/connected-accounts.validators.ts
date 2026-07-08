import { z } from 'zod';
import type { ConnectedAccount } from '@inithium/types';

const ProviderCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  scope: z.array(z.string()).readonly().optional(),
}).catchall(z.unknown());

export const CreateConnectedAccountSchema = z.object({
  userId: z.string().min(1),
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
  providerUsername: z.string().optional(),
  credentials: ProviderCredentialsSchema,
  status: z.enum(['active', 'expired', 'revoked']).default('active'),
}) satisfies z.ZodType<Omit<ConnectedAccount, '_id' | 'createdAt' | 'updatedAt'>>;

export const UpdateConnectedAccountSchema = CreateConnectedAccountSchema.partial();

export type CreateConnectedAccountDto = z.infer<typeof CreateConnectedAccountSchema>;
export type UpdateConnectedAccountDto = z.infer<typeof UpdateConnectedAccountSchema>;