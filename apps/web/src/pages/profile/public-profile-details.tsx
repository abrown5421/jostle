import { Container, Text } from '@jostle/ui';
import type { UserProfileView } from '../../users/index.js';

export interface PublicProfileDetailsProps {
  profile: UserProfileView;
}

export function PublicProfileDetails({ profile }: PublicProfileDetailsProps) {
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
        About
      </Text>

      {profile.bio ? (
        <Text textColor="content-primary">{profile.bio}</Text>
      ) : (
        <Text textColor="content-secondary">
          This user hasn&apos;t shared a bio yet.
        </Text>
      )}
    </Container>
  );
}
