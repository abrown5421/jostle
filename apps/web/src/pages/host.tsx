import { JoinCodeDisplay, PlayerList, QrCode, useSessionRoster } from '@jostle/lobby';
import { Button, Container, Text } from '@jostle/ui';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { pubsub } from '../messaging/pubsub-client.js';
import { sessionsClient } from '../sessions/sessions-client.js';

export function HostPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const { players, kickPlayer } = useSessionRoster({ pubsub, sessionId: sessionId ?? '', client: sessionsClient });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    sessionsClient.getSessionById(sessionId).then((session) => {
      if (!cancelled) setJoinCode(session?.joinCode ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <Container
      direction="row"
      horizontalAlign="center"
      verticalAlign="center"
      gap={4}
      className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]"
    >
      <Container direction="col" horizontalAlign="center" verticalAlign="around" gap={4} className="w-full min-h-[calc(100vh-var(--navbar-height,8rem))]">
        {joinCode ? (
          <>
            <JoinCodeDisplay joinCode={joinCode} />
            <QrCode joinCode={joinCode} />
            <Button color="primary" className='w-4/5 md:w-1/2'>Pick A Game</Button>
          </>
        ) : (
          <Text textColor="content-secondary">Loading...</Text>
        )}
      </Container>
      <Container direction="col" horizontalAlign="center" verticalAlign={players.length === 0 ? 'center' : 'start'} gap={4} backgroundColor='surface-secondary' margin={4} padding={4} className="w-full border border-surface-tertiary min-h-[calc(100vh-var(--navbar-height,8rem))]">
        <PlayerList players={players} onKick={kickPlayer} />
      </Container>
    </Container>
  );
}
