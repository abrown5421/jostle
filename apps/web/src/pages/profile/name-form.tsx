import { Button, Container, Input, Text } from '@jostle/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { UserProfileView } from '../../users/index.js';

export interface NameFormProps {
  profile: UserProfileView;
  onSave: (input: {
    firstName: string;
    lastName: string | null;
  }) => Promise<void>;
}

export function NameForm({ profile, onSave }: NameFormProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({ firstName, lastName: lastName.trim() || null });
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
        Name
      </Text>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="First Name *"
          value={firstName}
          setValue={setFirstName}
          color="primary"
          required
        />
        <Input
          label="Last Name"
          value={lastName}
          setValue={setLastName}
          color="secondary"
        />

        {error && (
          <Text fontSize="sm" className="text-red-400">
            {error}
          </Text>
        )}

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Saving…' : 'Save Name'}
        </Button>
      </form>
    </Container>
  );
}
