import { Container, Text } from '@jostle/ui';
import { useParams } from 'react-router';

export function ProfilePage() {
  const { id } = useParams();

  return (
    <Container direction="col" gap={4} padding={8}>
      <Text fontSize="3xl" fontWeight="bold" textColor="content-primary">
        Profile
      </Text>
      <Text textColor="content-secondary">User ID: {id}</Text>
    </Container>
  );
}
