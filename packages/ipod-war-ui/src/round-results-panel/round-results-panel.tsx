import { Container, Text } from '@jostle/ui';
import { Leaderboard } from '../leaderboard/index.js';
import type { IpodWarRoundResults } from '../client/index.js';

export interface RoundResultsPanelProps {
  readonly results: IpodWarRoundResults;
  readonly myPlayerId?: string;
}

export function RoundResultsPanel({ results, myPlayerId }: RoundResultsPanelProps) {
  const mine = myPlayerId
    ? results.perPlayerResults.find((result) => result.playerId === myPlayerId)
    : undefined;

  return (
    <Container direction="col" gap={4} className="w-full max-w-md">
      <Container
        direction="col"
        gap={2}
        padding={4}
        backgroundColor="surface-secondary"
        borderColor="surface-tertiary"
        className="w-full rounded-lg border"
      >
        <Text fontSize="sm" textColor="content-secondary">
          {results.isFinalRound ? 'Final Song' : 'The Answer Was'}
        </Text>
        <Text fontSize="xl" fontWeight="bold" textColor="content-primary">
          {results.correctAnswer.trackName}
        </Text>
        <Text textColor="content-secondary">
          {results.correctAnswer.artistNames.join(', ')}
          {results.correctAnswer.albumName ? ` — ${results.correctAnswer.albumName}` : ''}
        </Text>

        {mine && (
          <Container direction="col" gap={1} className="pt-2">
            <Text fontSize="lg" fontWeight="bold" textColor="content-primary">
              +{mine.pointsAwarded} points
            </Text>
            {mine.guess ? (
              <Text fontSize="sm" textColor="content-secondary">
                Your guess: {mine.guess.trackName}
                {mine.guess.artistName ? ` / ${mine.guess.artistName}` : ''}
                {mine.guess.albumName ? ` / ${mine.guess.albumName}` : ''}
              </Text>
            ) : (
              <Text fontSize="sm" textColor="content-secondary">
                You didn&apos;t submit a guess this round.
              </Text>
            )}
          </Container>
        )}
      </Container>

      <Leaderboard
        entries={results.leaderboard}
        limit={results.isFinalRound ? undefined : 3}
        title={results.isFinalRound ? 'Final Standings' : 'Leaderboard'}
      />
    </Container>
  );
}
