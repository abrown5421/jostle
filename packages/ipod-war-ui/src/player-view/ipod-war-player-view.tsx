import type { PubSub } from '@jostle/messaging';
import { Container, Text } from '@jostle/ui';
import { useCallback } from 'react';
import { CircularCountdownTimer } from '../countdown/index.js';
import { GuessForm } from '../guess-form/index.js';
import { Leaderboard } from '../leaderboard/index.js';
import { RoundResultsPanel } from '../round-results-panel/index.js';
import { useIpodWarPlayerRound } from '../round-state/index.js';
import type { IpodWarClient, IpodWarSubmissionGuess } from '../client/index.js';

export interface IpodWarPlayerViewProps {
  readonly pubsub: PubSub;
  readonly sessionId: string;
  readonly playerId: string;
  readonly client: IpodWarClient;
}

export function IpodWarPlayerView({ pubsub, sessionId, playerId, client }: IpodWarPlayerViewProps) {
  const roundState = useIpodWarPlayerRound({ pubsub, sessionId, playerId, client });

  const handleSubmit = useCallback(
    (guess: IpodWarSubmissionGuess) => {
      void client.submitGuess(sessionId, { playerId, ...guess });
    },
    [client, sessionId, playerId],
  );

  if (roundState.phase === 'idle') {
    return (
      <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={3} className="w-full min-h-[60vh]">
        <Text fontSize="xl" fontWeight="bold" textColor="content-primary">
          Waiting for the game to start…
        </Text>
      </Container>
    );
  }

  if (roundState.phase === 'ended') {
    return (
      <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={4} className="w-full min-h-[60vh]">
        <Text fontSize="2xl" fontWeight="bold" textColor="content-primary">
          Game Over!
        </Text>
        {roundState.lastResults && (
          <Leaderboard entries={roundState.lastResults.leaderboard} title="Final Standings" />
        )}
      </Container>
    );
  }

  if (roundState.phase === 'results' && roundState.lastResults) {
    return (
      <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={4} className="relative w-full min-h-[60vh] px-4">
        <RoundResultsPanel results={roundState.lastResults} myPlayerId={playerId} />
        <div className="absolute bottom-6 left-6">
          <CircularCountdownTimer
            key={`${roundState.roundIndex}-results`}
            phaseEndsAt={roundState.phaseEndsAt}
            size={72}
          />
        </div>
      </Container>
    );
  }

  return (
    <Container direction="col" horizontalAlign="center" verticalAlign="center" gap={6} className="w-full min-h-[60vh] px-4">
      <Text fontSize="lg" fontWeight="bold" textColor="content-primary">
        Round {roundState.roundIndex + 1} of {roundState.totalRounds}
      </Text>
      <div className="w-full max-w-sm">
        <GuessForm
          key={roundState.roundIndex}
          requireArtist={roundState.guessFieldsRequired.artist}
          requireAlbum={roundState.guessFieldsRequired.album}
          initialGuess={roundState.mySubmission}
          onSubmit={handleSubmit}
        />
      </div>
    </Container>
  );
}
