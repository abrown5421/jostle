import type { ObjectId } from 'mongodb';

export type SessionStatus = 'lobby' | 'active' | 'ended';

export interface SessionDocument {
  readonly _id: ObjectId;
  readonly joinCode: string;
  readonly hostUserId: ObjectId;
  readonly status: SessionStatus;
  readonly createdAt: Date;
}

export interface PublicSession {
  readonly sessionId: string;
  readonly joinCode: string;
  readonly hostUserId: string;
  readonly status: SessionStatus;
  readonly createdAt: string;
}

export interface SessionPlayerDocument {
  readonly _id: ObjectId;
  readonly sessionId: ObjectId;
  readonly userId: ObjectId | null;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly joinedAt: Date;
}

export interface PublicSessionPlayer {
  readonly playerId: string;
  readonly sessionId: string;
  readonly userId: string | null;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly joinedAt: string;
}
