import { useSessionConfiguration } from '@jostle/game-catalog';
import type { GameCatalogEntry } from '@jostle/game-catalog';
import { StartGameError } from '@jostle/ipod-war-ui';
import { JoinCodeDisplay, PlayerList, QrCode, useSessionRoster } from '@jostle/lobby';
import type { HostedSession } from '@jostle/lobby';
import { Button, Container, Text } from '@jostle/ui';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/index.js';
import { gamesClient } from '../games/games-client.js';
import { ipodWarClient } from '../ipod-war/ipod-war-client.js';
import { pubsub } from '../messaging/pubsub-client.js';
import { sessionsClient } from '../sessions/sessions-client.js';

export function HostPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<HostedSession | null>(null);
  const [currentGame, setCurrentGame] = useState<GameCatalogEntry | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startErrorNeedsSpotifyLink, setStartErrorNeedsSpotifyLink] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { players, kickPlayer } = useSessionRoster({ pubsub, sessionId: sessionId ?? '', client: sessionsClient });
  const { configuration } = useSessionConfiguration({ pubsub, sessionId: sessionId ?? '', client: sessionsClient });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    sessionsClient.getSessionById(sessionId).then((result) => {
      if (!cancelled) setSession(result);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (session?.status === 'active' && sessionId) {
      navigate(`/host/${sessionId}/play`, { replace: true });
    }
  }, [session?.status, sessionId, navigate]);

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

  const handleStartGame = async () => {
    setStartError(null);
    setStartErrorNeedsSpotifyLink(false);
    setIsStarting(true);
    try {
      await ipodWarClient.startGame(sessionId);
      navigate(`/host/${sessionId}/play`);
    } catch (error) {
      if (error instanceof StartGameError && error.code === 'HOST_SPOTIFY_NOT_CONNECTED') {
        setStartError(error.message);
        setStartErrorNeedsSpotifyLink(true);
      } else if (error instanceof Error) {
        setStartError(error.message);
      } else {
        setStartError('Could not start the game.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Container
      direction="row"
      horizontalAlign="center"
      verticalAlign="center"
      gap={4}
      className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]"
    >
      <Container direction="col" horizontalAlign="center" verticalAlign="around" gap={4} className="w-full min-h-[calc(100vh-var(--navbar-height,8rem))]">
        {session ? (
          <>
            <JoinCodeDisplay joinCode={session.joinCode} />
            <QrCode joinCode={session.joinCode} />
            {currentGame && (
              <Text fontSize="sm" textColor="content-secondary">
                Currently: {currentGame.title}
              </Text>
            )}
            <Button color="primary" className="w-4/5 md:w-1/2" onClick={() => navigate(`/games?sessionId=${sessionId}`)}>
              {currentGame ? 'Change Game' : 'Pick A Game'}
            </Button>
            {currentGame && (
              <Button color="secondary" className="w-4/5 md:w-1/2" onClick={() => navigate(`/host/${sessionId}/settings`)}>
                Game Settings
              </Button>
            )}
            {currentGame?.gameId === 'ipod-war' && (
              <Button
                color="accent"
                className="w-4/5 md:w-1/2"
                disabled={isStarting}
                onClick={handleStartGame}
              >
                {isStarting ? 'Starting…' : 'Start Game'}
              </Button>
            )}
            {startError && (
              <Text fontSize="sm" className="text-red-400 w-4/5 md:w-1/2 text-center">
                {startError}
                {startErrorNeedsSpotifyLink && user && (
                  <>
                    {' '}
                    <a href={`/profile/${user.id}`} className="underline">
                      Connect Spotify from your profile
                    </a>
                  </>
                )}
              </Text>
            )}
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
