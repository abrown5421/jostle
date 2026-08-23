import type { ObjectId } from 'mongodb';

/** The real MongoDB document — never sent to a client (has passwordHash). */
export interface UserDocument {
  _id: ObjectId;
  firstName: string;
  lastName?: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

/** Safe to send to the client. */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
}
