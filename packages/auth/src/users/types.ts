import type { AvatarStyle, BannerConfig } from '@jostle/profile-appearance';
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
  /** DiceBear seed + style. Absent until the user customizes their avatar — falls back to a letter avatar. */
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  bannerConfig: BannerConfig;
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
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  bannerConfig: BannerConfig;
}

/** Safe to send to a viewer who is not the profile owner — omits email and birthday. */
export interface PublicUserProfileView {
  id: string;
  firstName: string;
  lastName?: string;
  bio?: string;
  gender: Gender;
  customGender?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  bannerConfig: BannerConfig;
}
