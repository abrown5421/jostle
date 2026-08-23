import { Container, Text } from '@jostle/ui';

export function LoginPage() {
  return (
    <Container direction="col" gap={4} padding={8}>
      <Text fontSize="3xl" fontWeight="bold" textColor="content-primary">
        Login
      </Text>
    </Container>
  );
}
