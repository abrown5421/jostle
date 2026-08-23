import { Container, Text } from '@jostle/ui';

export function HomePage() {
  return (
    <Container direction="col" gap={4} padding={8}>
      <Text fontSize="3xl" fontWeight="bold" textColor="content-primary">
        Home
      </Text>
    </Container>
  );
}
