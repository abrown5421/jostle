import { GENDER_OPTIONS } from './users-client.js';
import type { UserProfileView } from './users-client.js';

export function genderDisplay(
  profile: Pick<UserProfileView, 'gender' | 'customGender'>,
): string | null {
  if (profile.gender === 'prefer_not_to_say') return null;
  if (profile.gender === 'other') return profile.customGender || null;
  return (
    GENDER_OPTIONS.find((option) => option.value === profile.gender)?.label ??
    null
  );
}
