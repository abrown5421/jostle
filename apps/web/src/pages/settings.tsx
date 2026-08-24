import { ConfigurationForm, useSessionConfiguration } from '@jostle/game-catalog';
import type { GameCatalogEntry, SelectedSettingsMap } from '@jostle/game-catalog';
import { Button, Container, Text } from '@jostle/ui';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { gamesClient } from '../games/games-client.js';
import { pubsub } from '../messaging/pubsub-client.js';
import { sessionsClient } from '../sessions/sessions-client.js';

export function SettingsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [currentGame, setCurrentGame] = useState<GameCatalogEntry | null>(null);
  const { configuration, isLoading } = useSessionConfiguration({
    pubsub,
    sessionId: sessionId ?? '',
    client: sessionsClient,
  });

  useEffect(() => {
    if (!configuration?.gameId) {
      setCurrentGame(null);
      return;
    }
    let cancelled = false;
    gamesClient.getGameById(configuration.gameId).then((game) => {
      if (!cancelled) setCurrentGame(game);
    });
    return () => {
      cancelled = true;
    };
  }, [configuration?.gameId]);

  if (!sessionId) return null;

  const handleSave = async (values: SelectedSettingsMap): Promise<void> => {
    if (!currentGame) return;
    await sessionsClient.setSessionConfiguration({ sessionId, gameId: currentGame.gameId, selectedSettings: values });
    navigate(`/host/${sessionId}`);
  };

  return (
    <Container
      direction="col"
      horizontalAlign="center"
      gap={6}
      padding={8}
      className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]"
    >
      <Text fontSize="3xl" fontWeight="bold" textColor="content-primary">
        Game Settings
      </Text>

      {isLoading ? (
        <Text textColor="content-secondary">Loading...</Text>
      ) : !currentGame ? (
        <Container direction="col" horizontalAlign="center" gap={4}>
          <Text textColor="content-secondary">No game selected for this session yet.</Text>
          <Button color="primary" onClick={() => navigate(`/games?sessionId=${sessionId}`)}>
            Pick A Game
          </Button>
        </Container>
      ) : (
        <Container direction="col" gap={4} className="w-full max-w-md">
          <Text fontSize="lg" fontWeight="bold" textColor="content-primary">
            {currentGame.title}
          </Text>
          <Button variant="link" onClick={() => navigate(`/games?sessionId=${sessionId}`)}>
            Change Game
          </Button>
          <ConfigurationForm
            schema={currentGame.defaultSettingsSchema}
            initialValues={configuration?.selectedSettings}
            onSave={handleSave}
          />
        </Container>
      )}
    </Container>
  );
}
