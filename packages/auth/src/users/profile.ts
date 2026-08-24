import { ObjectId } from 'mongodb';
import type { UpdateFilter } from 'mongodb';
import { getUsersCollection } from './collection.js';
import { GENDER_VALUES, MAX_BIO_LENGTH } from './types.js';
import type { Gender, UserDocument } from './types.js';

export class InvalidProfileInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProfileInputError';
  }
}

export interface UpdateUserProfileInput {
  firstName?: unknown;
  lastName?: unknown;
  bio?: unknown;
  birthday?: unknown;
  gender?: unknown;
  customGender?: unknown;
}

function sanitizeFirstName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidProfileInputError('firstName is required.');
  }
  return value.trim();
}

function sanitizeLastName(value: unknown): string | undefined {
  if (value === null) return undefined;
  if (typeof value !== 'string')
    throw new InvalidProfileInputError('lastName must be a string.');
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeBio(value: unknown): string | undefined {
  if (value === null) return undefined;
  if (typeof value !== 'string')
    throw new InvalidProfileInputError('bio must be a string.');
  const trimmed = value.trim();
  if (trimmed.length > MAX_BIO_LENGTH) {
    throw new InvalidProfileInputError(
      `bio must be ${MAX_BIO_LENGTH} characters or fewer.`,
    );
  }
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeBirthday(value: unknown): Date | undefined {
  if (value === null || value === '') return undefined;
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    !(value instanceof Date)
  ) {
    throw new InvalidProfileInputError('birthday must be a valid date.');
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new InvalidProfileInputError('birthday must be a valid date.');
  }
  if (date.getTime() > Date.now()) {
    throw new InvalidProfileInputError('birthday cannot be in the future.');
  }
  return date;
}

function sanitizeGender(value: unknown): Gender {
  if (typeof value !== 'string' || !GENDER_VALUES.includes(value as Gender)) {
    throw new InvalidProfileInputError(
      `gender must be one of: ${GENDER_VALUES.join(', ')}.`,
    );
  }
  return value as Gender;
}

function sanitizeCustomGender(
  value: unknown,
  effectiveGender: Gender | undefined,
): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : undefined;

  if (effectiveGender !== 'other') {
    if (trimmed) {
      throw new InvalidProfileInputError(
        'customGender may only be set when gender is "other".',
      );
    }
    return undefined;
  }

  if (!trimmed) {
    throw new InvalidProfileInputError(
      'customGender is required when gender is "other".',
    );
  }
  return trimmed;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserDocument | null> {
  if (!ObjectId.isValid(userId)) return null;

  const setFields: Partial<
    Pick<
      UserDocument,
      'firstName' | 'lastName' | 'bio' | 'birthday' | 'gender' | 'customGender'
    >
  > = {};
  const unsetFields: Partial<
    Record<'lastName' | 'bio' | 'birthday' | 'customGender', ''>
  > = {};

  if (input.firstName !== undefined) {
    setFields.firstName = sanitizeFirstName(input.firstName);
  }

  if (input.lastName !== undefined) {
    const lastName = sanitizeLastName(input.lastName);
    if (lastName === undefined) unsetFields.lastName = '';
    else setFields.lastName = lastName;
  }

  if (input.bio !== undefined) {
    const bio = sanitizeBio(input.bio);
    if (bio === undefined) unsetFields.bio = '';
    else setFields.bio = bio;
  }

  if (input.birthday !== undefined) {
    const birthday = sanitizeBirthday(input.birthday);
    if (birthday === undefined) unsetFields.birthday = '';
    else setFields.birthday = birthday;
  }

  if (input.gender !== undefined) {
    setFields.gender = sanitizeGender(input.gender);
  }

  if (input.customGender !== undefined || setFields.gender === 'other') {
    const customGender = sanitizeCustomGender(
      input.customGender,
      setFields.gender,
    );
    if (customGender === undefined) unsetFields.customGender = '';
    else setFields.customGender = customGender;
  } else if (setFields.gender) {
    unsetFields.customGender = '';
  }

  const hasSetFields = Object.keys(setFields).length > 0;
  const hasUnsetFields = Object.keys(unsetFields).length > 0;
  if (!hasSetFields && !hasUnsetFields) {
    return getUsersCollection().findOne({ _id: new ObjectId(userId) });
  }

  const update: UpdateFilter<UserDocument> = {};
  if (hasSetFields) update.$set = setFields;
  if (hasUnsetFields) update.$unset = unsetFields;

  return getUsersCollection().findOneAndUpdate(
    { _id: new ObjectId(userId) },
    update,
    { returnDocument: 'after' },
  );
}

export async function setUserAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<UserDocument | null> {
  return setUserMediaUrl(userId, 'avatarUrl', avatarUrl);
}

export async function setUserBannerUrl(
  userId: string,
  bannerUrl: string | null,
): Promise<UserDocument | null> {
  return setUserMediaUrl(userId, 'bannerUrl', bannerUrl);
}

async function setUserMediaUrl(
  userId: string,
  field: 'avatarUrl' | 'bannerUrl',
  value: string | null,
): Promise<UserDocument | null> {
  if (!ObjectId.isValid(userId)) return null;

  const update: UpdateFilter<UserDocument> =
    value === null ? { $unset: { [field]: '' } } : { $set: { [field]: value } };

  return getUsersCollection().findOneAndUpdate(
    { _id: new ObjectId(userId) },
    update,
    { returnDocument: 'after' },
  );
}
