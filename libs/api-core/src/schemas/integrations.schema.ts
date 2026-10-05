import { z } from 'zod';

export const beginIntegrationAuthorizationSchema = z.object({
  // Where in the SPA to land after the provider redirects back (e.g. "/profile/abc?tab=integrations").
  // Re-validated as a same-origin relative path server-side - see integration.service.ts.
  returnTo: z.string().max(512).optional(),
});
export type BeginIntegrationAuthorizationBody = z.infer<typeof beginIntegrationAuthorizationSchema>;
