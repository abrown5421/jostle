import { resolveAvatarConfigProps } from '@inithium/ui';
import type { SessionParticipant } from '@inithium/api-client';

// The seat's avatar when it has one - a signed-in player's saved avatar or a guest's randomized
// pick (an uploaded image or dicebear wins outright; an initials avatar keeps its colors/shape
// but spells the *screen name*). Seats with no avatar get plain initials of their screen name.
export const resolveParticipantAvatarProps = (participant: Pick<SessionParticipant, 'avatar' | 'name'>) =>
  participant.avatar
    ? resolveAvatarConfigProps(participant.avatar, participant.name)
    : { source: { variant: 'initials' as const, name: participant.name } };

export const participantsById = (participants: readonly SessionParticipant[]): Map<string, SessionParticipant> =>
  new Map(participants.map((participant) => [participant.id, participant]));
