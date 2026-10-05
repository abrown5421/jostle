import type { SessionParticipant } from '../../contracts/session.contract';

// Who's in a round-based game (its roster: everyone seated at the start, minus anyone who leaves
// or is kicked) and how they stand.

export interface PlayerStanding {
  readonly participantId: string;
  readonly total: number;
  // Points from the round just revealed (0 outside a reveal).
  readonly delta: number;
  // Competition ranking - tied totals share a rank (1, 2, 2, 4).
  readonly rank: number;
}

export const toStandings = (
  roster: readonly string[],
  totals: Readonly<Record<string, number>>,
  deltaOf: (participantId: string) => number,
): PlayerStanding[] => {
  const totalOf = (participantId: string) => totals[participantId] ?? 0;
  const sorted = [...roster].sort((a, b) => totalOf(b) - totalOf(a));
  return sorted.map((participantId) => ({
    participantId,
    total: totalOf(participantId),
    delta: deltaOf(participantId),
    rank: 1 + sorted.filter((other) => totalOf(other) > totalOf(participantId)).length,
  }));
};

// Whether `predicate` holds for every *connected* roster member - disconnected phones don't hold
// the room up, and an empty room never counts as "everyone".
export const everyConnectedRosterMember = (
  roster: readonly string[],
  participants: readonly SessionParticipant[],
  predicate: (participantId: string) => boolean,
): boolean => {
  const present = participants.filter((participant) => participant.isConnected && roster.includes(participant.id));
  return present.length > 0 && present.every((participant) => predicate(participant.id));
};

// The roster minus anyone no longer in the session - the same array when nobody left, so a no-op
// stays a no-op (and commits nothing).
export const pruneRoster = (roster: readonly string[], participants: readonly SessionParticipant[]): readonly string[] => {
  const present = new Set(participants.map(({ id }) => id));
  const pruned = roster.filter((id) => present.has(id));
  return pruned.length === roster.length ? roster : pruned;
};
