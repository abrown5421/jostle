// Every channel this lib publishes on goes through the shared @inithium/realtime provider.
// The `session:` prefix is reserved: apps/api blocks it on the general-purpose /realtime gateway
// (see isGameSessionChannel's use in main.ts) so only /realtime/session, which checks the
// subscriber's session token, can ever subscribe a socket to one.
const SESSION_CHANNEL_PREFIX = 'session:';

// Everyone in the session - host screen and every player.
export const sessionChannel = (code: string): string => `${SESSION_CHANNEL_PREFIX}${code}`;

// Host screen(s) only.
export const sessionHostChannel = (code: string): string => `${SESSION_CHANNEL_PREFIX}${code}:host`;

// One participant's device(s) only.
export const sessionParticipantChannel = (code: string, participantId: string): string =>
  `${SESSION_CHANNEL_PREFIX}${code}:participant:${participantId}`;

export const isGameSessionChannel = (channel: string): boolean => channel.startsWith(SESSION_CHANNEL_PREFIX);

export const SESSION_EVENTS = {
  // payload: SessionSnapshot - the full session, on every change. Sessions are small (a handful
  // of players), so full snapshots are simpler and self-healing compared to diffs.
  updated: 'session:updated',
  // payload: { reason: SessionEndReason }
  ended: 'session:ended',
  // payload: { reason: 'left' | 'kicked' } - on the removed participant's own channel.
  participantRemoved: 'participant:removed',
  // payload: a GameDefinition's privateView(state, participantId) - on that participant's channel.
  gamePrivate: 'game:private',
  // payload: a GameDefinition's hostView(state) - on the host channel only.
  gameHost: 'game:host',
} as const;

export type SessionEndReason = 'host-ended' | 'host-disconnected';
export type ParticipantRemovedReason = 'left' | 'kicked';
