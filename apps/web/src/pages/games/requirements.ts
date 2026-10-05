import type { GameCatalogueItem, GameRequirementBlocker } from '@inithium/api-client';

// Where a host goes to fix an unmet host requirement (every kind so far is an integration),
// coming back to `returnTo` afterwards - the profile integrations tab offers the way back (see
// IntegrationsPanel).
export const resolveRequirementPath = (userId: string, returnTo: string): string =>
  `/profile/${encodeURIComponent(userId)}?tab=integrations&returnTo=${encodeURIComponent(returnTo)}`;

export const firstHostBlocker = (game: Pick<GameCatalogueItem, 'hostBlockers'> | undefined): GameRequirementBlocker | null =>
  game?.hostBlockers?.[0] ?? null;

const PROVIDER_NAMES: Record<string, string> = { spotify: 'Spotify' };

// "Set up Spotify" - the call to action on a blocked game.
export const describeBlockerAction = (blocker: GameRequirementBlocker): string =>
  `Set up ${PROVIDER_NAMES[blocker.requirement.provider] ?? blocker.requirement.provider}`;

// Only same-origin relative paths - the same rule the API applies to OAuth return paths.
export const sanitizeReturnTo = (raw: string | null): string | null =>
  raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : null;
