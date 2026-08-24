import type { ObjectId } from 'mongodb';

export const GENDER_VALUES = [
  'male',
  'female',
  'prefer_not_to_say',
  'other',
] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const DEFAULT_GENDER: Gender = 'prefer_not_to_say';
export const MAX_BIO_LENGTH = 500;

/** The real MongoDB document — never sent to a client (has passwordHash). */
export interface UserDocument {
  _id: ObjectId;
  firstName: string;
  lastName?: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  bio?: string;
  birthday?: Date;
  gender: Gender;
  customGender?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

/** Safe to send to the client. */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  bio?: string;
  birthday?: Date;
  gender: Gender;
  customGender?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}
