import { Button, Container, Text, cn } from '@jostle/ui';
import type { GameCatalogEntry } from './types.js';

export interface GameCardProps {
  readonly game: GameCatalogEntry;
  readonly actionLabel: string;
  readonly onAction: (game: GameCatalogEntry) => void;
  readonly className?: string;
}

export function GameCard({ game, actionLabel, onAction, className }: GameCardProps) {
  return (
    <Container
      direction="col"
      gap={3}
      padding={4}
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className={cn('w-full rounded-lg border', className)}
    >
      <div className="flex h-[250px] w-full items-center justify-center rounded-md bg-black">
        <img src={game.coverImageUrl} alt={game.title} className="max-h-full max-w-full object-contain" />
      </div>
      <Text fontSize="xl" fontWeight="bold" textColor="content-primary">
        {game.title}
      </Text>
      <Text fontSize="sm" textColor="content-secondary">
        {game.description}
      </Text>
      <Text fontSize="sm" textColor="content-tertiary">
        {game.minPlayers}
        {'–'}
        {game.maxPlayers} players
      </Text>
      <Button color="primary" onClick={() => onAction(game)} className="mt-auto w-full">
        {actionLabel}
      </Button>
    </Container>
  );
}
