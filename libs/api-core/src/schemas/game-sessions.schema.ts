import { z } from 'zod';
import { avatarStyleSchema } from './profile.schema';

// A guest's randomized look from the join page. Stricter than the profile's avatarConfigSchema:
// no imageUrl (a guest must not be able to put an arbitrary URL on the host's TV) and no
// dicebear.options, with style/seed bounded to the URL-safe slugs and short seeds the
// randomizer actually produces - both end up in the DiceBear URL every screen renders.
const guestAvatarSchema = z.object({
  variant: z.enum(['initials', 'dicebear']),
  style: avatarStyleSchema,
  dicebear: z
    .object({
      style: z.string().regex(/^[a-z-]{1,40}$/),
      seed: z.string().regex(/^[a-z0-9]{1,32}$/),
    })
    .optional(),
});

// Length/uniqueness rules live in @inithium/game-session's joinSession so the REST route and any
// future caller enforce the same thing - this only checks shape.
export const joinGameSessionSchema = z.object({
  name: z.string(),
  rejoinToken: z.string().optional(),
  // Ignored for a signed-in player - their saved profile avatar always wins (see the join route).
  avatar: guestAvatarSchema.optional(),
});
