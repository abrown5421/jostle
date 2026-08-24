import { Button, Container, Text } from '@jostle/ui';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/index.js';
import type { UserProfile } from '../../users/index.js';

export interface AccountSettingsProps {
  profile: UserProfile;
}

export function AccountSettings({ profile }: AccountSettingsProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
        Account
      </Text>

      <Container direction="col" gap={1}>
        <Text fontSize="sm" textColor="content-secondary">
          Email
        </Text>
        <Text textColor="content-primary">{profile.email}</Text>
      </Container>

      <Button
        variant="outlined"
        className="self-start border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
        onClick={async () => {
          await logout();
          navigate('/');
        }}
      >
        Log Out
      </Button>
    </Container>
  );
}
