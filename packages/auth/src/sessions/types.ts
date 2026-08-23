import type { ObjectId } from 'mongodb';

export interface SessionDocument {
  _id: ObjectId;
  token: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}
