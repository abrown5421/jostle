import { z } from 'zod';

export const CreateFriendSchema = z.object({
  requester:     z.string().min(1),
  recipient:     z.string().min(1),
  action_user:   z.string().min(1),
  date_sent:     z.string().datetime().optional(),
  date_accepted: z.string().datetime().optional(),
  status:        z.enum(['pending', 'accepted', 'declined', 'blocked']).default('pending'),
});

export const UpdateFriendSchema = CreateFriendSchema.partial();

export type CreateFriendDto = z.infer<typeof CreateFriendSchema>;
export type UpdateFriendDto = z.infer<typeof UpdateFriendSchema>;