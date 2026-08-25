import { Container, Text } from '@jostle/ui';

export function GamesTab() {
  return (
    <Container
      direction="col"
      gap={2}
      padding={6}
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className="w-full rounded-lg border"
    >
      <Text fontSize="lg" fontWeight="bold" textColor="content-primary">
        Games
      </Text>
      <Text textColor="content-secondary">
        Player stats and game history are coming soon.
      </Text>
    </Container>
  );
}
