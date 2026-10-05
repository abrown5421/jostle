import { Box, Button, Loader, Text } from '@inithium/ui';
import { useListGamesQuery } from '@inithium/api-client';
import type { GameCatalogueItem } from '@inithium/api-client';
import { GameCard } from './GameCard';
import type { GameCardAction } from './GameCard';
import { openGameDetails } from './GameDetails';
import { SECONDARY_BUTTON_PROPS, SURFACE_TEXT } from './surfaceColors';

export interface GameCatalogueProps {
  // What each card's primary button does - resolved per game so a caller can vary the label
  // (e.g. "Selected" on the session's current pick).
  readonly resolveAction: (game: GameCatalogueItem) => GameCardAction;
  // Highlights the session's current pick when a host is choosing for a live session.
  readonly selectedGameId?: string | null;
}

// The catalogue grid. Learn more always opens the game's details, offering the same action as
// the card's primary button, so a game can be hosted with or without opening them.
export const GameCatalogue = ({ resolveAction, selectedGameId }: GameCatalogueProps) => {
  const { data: games, isLoading, isError, refetch } = useListGamesQuery();

  if (isLoading) {
    return (
      <Box flex={{ justify: 'center' }} padding={{ base: 32 }}>
        <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} label="Loading games…" />
      </Box>
    );
  }

  if (isError || !games) {
    return (
      <Box flex={{ direction: 'col', align: 'center', gap: 12 }} padding={{ base: 32 }}>
        <Text as="p" textColor={SURFACE_TEXT}>
          Couldn’t load the games.
        </Text>
        <Button {...SECONDARY_BUTTON_PROPS} onClick={() => void refetch()}>
          Try again
        </Button>
      </Box>
    );
  }

  if (games.length === 0) {
    return (
      <Text as="p" className="text-center" textColor={SURFACE_TEXT} padding={{ base: 32 }}>
        No games are available yet.
      </Text>
    );
  }

  const learnMore = (game: GameCatalogueItem) => {
    const action = resolveAction(game);
    openGameDetails(game, {
      actionLabel: action.label,
      actionDisabled: action.disabled,
      actionHint: action.hint,
      onAction: () => action.onClick(game),
    });
  };

  return (
    <ul className="flex w-full flex-wrap justify-center gap-6">
      {games.map((game) => (
        <li key={game.slug} className="flex w-full sm:w-auto">
          <GameCard game={game} action={resolveAction(game)} onLearnMore={learnMore} isSelected={game.slug === selectedGameId} />
        </li>
      ))}
    </ul>
  );
};
