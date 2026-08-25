import { Avatar, Container, Text } from '@jostle/ui';
import type { IpodWarLeaderboardEntry } from '../client/index.js';

export interface LeaderboardProps {
  readonly entries: ReadonlyArray<IpodWarLeaderboardEntry>;
  readonly limit?: number;
  readonly title?: string;
}

export function Leaderboard({ entries, limit, title = 'Leaderboard' }: LeaderboardProps) {
  const visible = limit ? entries.slice(0, limit) : entries;

  return (
    <Container
      direction="col"
      gap={2}
      padding={4}
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className="w-full rounded-lg border"
    >
      <Text fontSize="lg" fontWeight="bold" textColor="content-primary">
        {title}
      </Text>
      {visible.length === 0 ? (
        <Text fontSize="sm" textColor="content-secondary">
          No scores yet.
        </Text>
      ) : (
        visible.map((entry) => (
          <Container
            key={entry.playerId}
            direction="row"
            horizontalAlign="between"
            verticalAlign="center"
            gap={3}
          >
            <Container direction="row" gap={2} verticalAlign="center">
              <Text fontWeight="semibold" textColor="content-secondary" className="w-6">
                #{entry.rank}
              </Text>
              <Avatar imageUrl={entry.avatarUrl} name={entry.displayName} size="sm" />
              <Text textColor="content-primary">{entry.displayName}</Text>
            </Container>
            <Text fontWeight="bold" textColor="content-primary">
              {entry.totalPoints}
            </Text>
          </Container>
        ))
      )}
    </Container>
  );
}
