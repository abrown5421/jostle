import type { AvatarStyle, BannerConfig } from '@jostle/profile-appearance';

// Thin fetch wrapper around apps/api's /users routes. Kept local to
// apps/web rather than a shared package — it's tightly coupled to this
// one API's request/response shapes and has a single consumer.
export type Gender = 'male' | 'female' | 'prefer_not_to_say' | 'other';

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

// email and birthday are present only when the fetching viewer owns this
// profile — the API strips them from the payload for every other viewer.
export interface UserProfileView {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  bio?: string;
  /** ISO date-time string, as returned by JSON.stringify(Date) on the server. */
  birthday?: string;
  gender: Gender;
  customGender?: string;
  avatarSeed?: string;
  avatarStyle?: AvatarStyle;
  bannerConfig: BannerConfig;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string | null;
  bio?: string | null;
  birthday?: string | null;
  gender?: Gender;
  customGender?: string | null;
  avatarSeed?: string | null;
  avatarStyle?: AvatarStyle;
  bannerConfig?: BannerConfig;
}

interface UserResponse {
  user: UserProfileView;
}

interface ErrorResponse {
  error: string;
}

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

async function parseUserResponse(response: Response): Promise<UserProfileView> {
  const data = (await response.json().catch(() => null)) as
    UserResponse | ErrorResponse | null;
  if (!response.ok) {
    throw new Error((data && 'error' in data && data.error) || DEFAULT_ERROR);
  }
  return (data as UserResponse).user;
}

export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileView | null> {
  const response = await fetch(`/users/${userId}`, { credentials: 'include' });
  if (response.status === 404) return null;
  return parseUserResponse(response);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfileView> {
  const response = await fetch(`/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return parseUserResponse(response);
}
