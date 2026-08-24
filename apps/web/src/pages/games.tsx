import { deriveInitialValues, GameCard, useGameCatalog } from '@jostle/game-catalog';
import type { GameCatalogEntry } from '@jostle/game-catalog';
import { Container, Text } from '@jostle/ui';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/index.js';
import { gamesClient } from '../games/games-client.js';
import { sessionsClient } from '../sessions/sessions-client.js';

export function GamesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { isAuthenticated } = useAuth();
  const { games, isLoading } = useGameCatalog({ client: gamesClient });
  const [error, setError] = useState<string | null>(null);

  const handleSelectForSession = async (game: GameCatalogEntry): Promise<void> => {
    if (!sessionId) return;

    setError(null);
    try {
      await sessionsClient.setSessionConfiguration({
        sessionId,
        gameId: game.gameId,
        selectedSettings: deriveInitialValues(game.defaultSettingsSchema),
      });
      navigate(`/host/${sessionId}/settings`);
    } catch {
      setError('Could not select that game. Please try again.');
    }
  };

  const handleLaunchSession = async (game: GameCatalogEntry): Promise<void> => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setError(null);
    try {
      const session = await sessionsClient.createSession();
      await sessionsClient.setSessionConfiguration({
        sessionId: session.sessionId,
        gameId: game.gameId,
        selectedSettings: deriveInitialValues(game.defaultSettingsSchema),
      });
      navigate(`/host/${session.sessionId}`, { replace: true });
    } catch {
      setError('Could not launch a session for that game. Please try again.');
    }
  };

  const actionLabel = sessionId ? 'Select' : 'Launch Session';
  const onAction = sessionId ? handleSelectForSession : handleLaunchSession;

  return (
    <Container direction="col" horizontalAlign="center" gap={6} padding={8} className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]">
      
      {error && (
        <Text fontSize="sm" className="text-red-400">
          {error}
        </Text>
      )}
      {isLoading ? (
        <Text textColor="content-secondary">Loading...</Text>
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.gameId} game={game} actionLabel={actionLabel} onAction={onAction} />
          ))}
        </div>
      )}
    </Container>
  );
}
