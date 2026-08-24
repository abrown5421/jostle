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

export interface UserProfile {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  bio?: string;
  /** ISO date-time string, as returned by JSON.stringify(Date) on the server. */
  birthday?: string;
  gender: Gender;
  customGender?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string | null;
  bio?: string | null;
  birthday?: string | null;
  gender?: Gender;
  customGender?: string | null;
}

interface UserResponse {
  user: UserProfile;
}

interface ErrorResponse {
  error: string;
}

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

async function parseUserResponse(response: Response): Promise<UserProfile> {
  const data = (await response.json().catch(() => null)) as
    UserResponse | ErrorResponse | null;
  if (!response.ok) {
    throw new Error((data && 'error' in data && data.error) || DEFAULT_ERROR);
  }
  return (data as UserResponse).user;
}

export async function fetchMyProfile(): Promise<UserProfile | null> {
  const response = await fetch('/users/me', { credentials: 'include' });
  if (response.status === 401) return null;
  return parseUserResponse(response);
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UserProfile> {
  const response = await fetch('/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return parseUserResponse(response);
}

async function uploadMedia(
  path: string,
  fieldName: string,
  file: File,
): Promise<UserProfile> {
  const formData = new FormData();
  formData.append(fieldName, file);
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return parseUserResponse(response);
}

export function uploadAvatar(file: File): Promise<UserProfile> {
  return uploadMedia('/users/me/avatar', 'avatar', file);
}

export function uploadBanner(file: File): Promise<UserProfile> {
  return uploadMedia('/users/me/banner', 'banner', file);
}
