import { Button, Container } from '@jostle/ui';

export function HomePage() {
  const handleHost = (): void => {
    // Placeholder for hosting logic
  };

  const handleJoin = (): void => {
    // Placeholder for joining logic
  };

  return (
    <Container
      direction="col"
      horizontalAlign="center"
      verticalAlign="center"
      gap={4}
      className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]"
    >
      <Button
        color="primary"
        onClick={handleHost}
        className="w-[90%] md:w-1/3 lg:w-1/4"
      >
        Host
      </Button>
      <Button
        color="secondary"
        onClick={handleJoin}
        className="w-[90%] md:w-1/3 lg:w-1/4"
      >
        Join
      </Button>
    </Container>
  );
}