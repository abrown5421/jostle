import { Button, Container, Input, Select, Text } from '@jostle/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { GENDER_OPTIONS } from '../../users/index.js';
import type { Gender, UserProfileView } from '../../users/index.js';
import { toDateInputValue } from '../../users/birthday.js';

export interface ProfileDetailsInput {
  bio: string | null;
  birthday: string | null;
  gender: Gender;
  customGender: string | null;
}

export interface ProfileDetailsFormProps {
  profile: UserProfileView;
  onSave: (input: ProfileDetailsInput) => Promise<void>;
}

const SELECT_OPTIONS = GENDER_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

export function ProfileDetailsForm({
  profile,
  onSave,
}: ProfileDetailsFormProps) {
  const [bio, setBio] = useState(profile.bio ?? '');
  const [birthday, setBirthday] = useState(toDateInputValue(profile.birthday));
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [customGender, setCustomGender] = useState(profile.customGender ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (gender === 'other' && customGender.trim().length === 0) {
      setError('Please specify your gender.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        bio: bio.trim() || null,
        birthday: birthday || null,
        gender,
        customGender: gender === 'other' ? customGender.trim() : null,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      direction="col"
      gap={4}
      padding={6}
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className="w-full rounded-lg border"
    >
      <Text fontSize="lg" fontWeight="bold" textColor="content-primary">
        Profile Details
      </Text>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Container direction="col" gap={1}>
          <label
            htmlFor="profile-bio"
            className="text-sm font-medium text-content-secondary"
          >
            Bio
          </label>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-content-tertiary bg-transparent px-3 py-2 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Container>

        <Input
          type="date"
          label="Date of Birth"
          value={birthday}
          setValue={setBirthday}
          color="secondary"
        />

        <Select
          label="Gender"
          value={gender}
          setValue={(value) => setGender(value as Gender)}
          options={SELECT_OPTIONS}
          color="accent"
        />

        {gender === 'other' && (
          <Input
            label="Please specify"
            value={customGender}
            setValue={setCustomGender}
            color="accent"
            required
          />
        )}

        {error && (
          <Text fontSize="sm" className="text-red-400">
            {error}
          </Text>
        )}

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Saving…' : 'Save Profile Details'}
        </Button>
      </form>
    </Container>
  );
}
