import { Button, Container } from '@jostle/ui';
import { useNavigate } from 'react-router';
import { sessionsClient } from '../sessions/sessions-client.js';

export function HomePage() {
  const navigate = useNavigate();
  const handleHost = async (): Promise<void> => {
    const session = await sessionsClient.createSession();
    navigate(`/host/${session.sessionId}`, { replace: true });
  };

  const handleJoin = (): void => {
    // Placeholder for joining logic
    navigate('/join')
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