import type { AvatarConfig, GameSettingValues } from '@inithium/db';

// 'lobby'   - accepting players, no game running.
// 'in-game' - a GameDefinition is active; new joins are refused until it completes.
// 'ended'   - terminal. A record in this state is only ever observed in-flight while
//             endSession() tears it down - the store never holds one afterwards.
export const SESSION_STATUSES = ['lobby', 'in-game', 'ended'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

// The host is deliberately NOT a participant: hosting a session never adds the host to its
// player list. A host who wants to play joins from a second device like anyone else, and gets an
// ordinary participant record + player token for it.
export type SessionRole = 'host' | 'player';

export interface SessionParticipant {
  // Per-join id, not the user's id - the same account can be the host on one device and a
  // player on another, and guests have no user id at all.
  readonly id: string;
  readonly name: string;
  readonly userId: string | null;
  // Captured at join time: the account's saved avatar, or a guest's randomized pick from the join
  // page. Null for a guest who sent none - the client then renders initials from `name`. (An
  // initials-variant avatar also spells `name`, not the account name, just in its own colors/shape.)
  readonly avatar: AvatarConfig | null;
  readonly isConnected: boolean;
  readonly joinedAt: string;
}

export interface SessionParticipantRecord extends SessionParticipant {
  readonly token: string;
}

// The game the host has picked for this session and how they've configured it. Set while the
// session is in the lobby - picking a game doesn't close the lobby, so players keep joining while
// the host fills in settings - and kept after a game completes, so "play again" is one click.
// `settings` is always a complete set, valid against the game's catalogue setting definitions.
export interface SessionGameSelection {
  readonly gameId: string;
  readonly settings: GameSettingValues;
}

export interface ActiveGameRecord<TState = unknown> {
  readonly gameId: string;
  readonly state: TState;
  readonly startedAt: string;
}

// Server-side shape. Holds credentials (hostToken, participant tokens) and raw game state, so it
// is never sent over the wire as-is - toSessionSnapshot() produces the client-facing view.
export interface GameSessionRecord {
  readonly code: string;
  readonly hostUserId: string;
  readonly hostToken: string;
  readonly status: SessionStatus;
  readonly participants: readonly SessionParticipantRecord[];
  // Keyed by participant id. Lives on the session rather than inside a game's state so a score
  // can outlive one game and carry across several played in the same session.
  readonly scores: Readonly<Record<string, number>>;
  readonly selection: SessionGameSelection | null;
  readonly game: ActiveGameRecord | null;
  // Bumped on every mutation - lets a client drop an out-of-order snapshot rather than
  // regressing to an older one after a reconnect.
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SessionGameSnapshot {
  readonly gameId: string;
  // A GameDefinition's publicView(state) - never the raw state, which may hold secrets
  // (another player's answer, the correct answer, ...).
  readonly view: unknown;
  readonly startedAt: string;
}

export interface SessionSnapshot {
  readonly code: string;
  readonly status: SessionStatus;
  readonly participants: readonly SessionParticipant[];
  readonly scores: Readonly<Record<string, number>>;
  // Broadcast to players too, so their devices can show what's coming up.
  readonly selection: SessionGameSelection | null;
  readonly game: SessionGameSnapshot | null;
  readonly version: number;
  readonly createdAt: string;
}

// What an opaque session token resolves to. participantId is null for the host.
export interface SessionCredential {
  readonly code: string;
  readonly role: SessionRole;
  readonly participantId: string | null;
}
