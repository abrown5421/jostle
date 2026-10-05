import { Box, Button, Card, Icon, Pill, Text, mergeClassNames, resolveColorClass } from '@inithium/ui';
import type { GameCatalogueItem } from '@inithium/api-client';
import { GameMedia } from './GameMedia';
import { formatPlayerCount } from './gameLabels';
import { firstHostBlocker } from './requirements';
import { SECONDARY_BUTTON_PROPS, SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from './surfaceColors';

// The card's main call to action - "Host" from the public catalogue, "Select" when the host
// already has a session waiting. The same action is offered again inside Learn more's details.
export interface GameCardAction {
  readonly label: string;
  readonly onClick: (game: GameCatalogueItem) => void;
  readonly disabled?: boolean;
  // Shown under the button in the details dialog (e.g. why hosting needs an account).
  readonly hint?: string;
}

export interface GameCardProps {
  readonly game: GameCatalogueItem;
  readonly action: GameCardAction;
  readonly onLearnMore: (game: GameCatalogueItem) => void;
  readonly isSelected?: boolean;
}

// Not clickable as a whole - two explicit buttons instead, so hosting never requires opening the
// details and the details are always one deliberate click away.
export const GameCard = ({ game, action, onLearnMore, isSelected = false }: GameCardProps) => {
  const blocker = firstHostBlocker(game);
  return (
    <Card
      media={<GameMedia game={game} />}
      borderColor={isSelected ? { color: 'primary', intensity: 500 } : SURFACE_BORDER}
      bodyClassName="flex flex-1 flex-col"
      className={mergeClassNames(
        'flex flex-none flex-col sm:w-72',
        resolveColorClass('bg', SURFACE_BG),
        resolveColorClass('text', SURFACE_TEXT),
        isSelected && 'ring-2 ring-primary-500',
      )}
    >
      {/* flex-1 + the buttons' mt-auto pin the buttons to the card's bottom, so they line up
          across a row of cards whatever the length of each title or tagline. */}
      <Box flex={{ direction: 'col', gap: 12 }} className="flex-1">
        <Box flex={{ direction: 'col', gap: 8 }}>
          <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 8 }}>
            <Text as="h3" className="text-lg font-bold" textColor={SURFACE_TEXT}>
              {game.title}
            </Text>
            {!game.isPlayable && (
              <Pill
                color={SURFACE_BG}
                className={mergeClassNames('flex-none border', resolveColorClass('border', SURFACE_TEXT), resolveColorClass('text', SURFACE_TEXT))}
              >
                Coming soon
              </Pill>
            )}
          </Box>
          <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
            {game.tagline}
          </Text>
          {blocker && (
            <Text as="p" className="inline-flex items-start gap-1 text-xs font-medium" textColor={SURFACE_TEXT}>
              <Icon as="span" name="LockSimple" size={14} className="mt-px flex-none" />
              {blocker.reason}
            </Text>
          )}
          <Box flex={{ direction: 'row', gap: 12, wrap: 'wrap' }} className="text-xs font-medium">
            <Box as="span" flex={{ direction: 'row', align: 'center', gap: 4 }}>
              <Icon as="span" name="Users" size={14} />
              {formatPlayerCount(game)}
            </Box>
            {game.estimatedMinutes !== undefined && (
              <Box as="span" flex={{ direction: 'row', align: 'center', gap: 4 }}>
                <Icon as="span" name="Clock" size={14} />~{game.estimatedMinutes} min
              </Box>
            )}
          </Box>
        </Box>

        <Box flex={{ direction: 'col', gap: 8 }} className="mt-auto">
          <Button {...SECONDARY_BUTTON_PROPS} onClick={() => onLearnMore(game)}>
            Learn more
          </Button>
          <Button
            variant={{ kind: 'filled', color: 'primary' }}
            className="disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => action.onClick(game)}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        </Box>
      </Box>
    </Card>
  );
};
