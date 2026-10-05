import { Box, Button, Divider, Icon, Text, dialog, resolveColorClass } from '@inithium/ui';
import type { GameCatalogueItem } from '@inithium/api-client';
import { GameMedia } from './GameMedia';
import { formatPlayerCount, formatSettingValue } from './gameLabels';
import { SURFACE_BORDER, SURFACE_TEXT } from './surfaceColors';

export interface GameDetailsProps {
  readonly game: GameCatalogueItem;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly actionDisabled?: boolean;
  readonly actionHint?: string;
}

// Everything the catalogue knows about one game - pitch, rules, and what the host will be able to
// configure. Rendered inside a dialog (see openGameDetails); the one action is the caller's.
// Text color is set on the root rather than left to the dialog, so lists and spans that aren't a
// <Text> still get the surface pairing.
export const GameDetails = ({ game, actionLabel, onAction, actionDisabled, actionHint }: GameDetailsProps) => (
  <Box flex={{ direction: 'col', gap: 16 }} className={resolveColorClass('text', SURFACE_TEXT)}>
    <GameMedia game={game} className="max-h-72 rounded-md" />

    <Box flex={{ direction: 'row', gap: 16, wrap: 'wrap' }} className="text-sm font-medium">
      <Box as="span" flex={{ direction: 'row', align: 'center', gap: 4 }}>
        <Icon as="span" name="Users" size={16} />
        {formatPlayerCount(game)}
      </Box>
      {game.estimatedMinutes !== undefined && (
        <Box as="span" flex={{ direction: 'row', align: 'center', gap: 4 }}>
          <Icon as="span" name="Clock" size={16} />~{game.estimatedMinutes} min
        </Box>
      )}
    </Box>

    <Text as="p" textColor={SURFACE_TEXT}>
      {game.description}
    </Text>

    {game.rules.length > 0 && (
      <>
        <Divider color={SURFACE_BORDER} />
        <Text as="h3" className="text-lg font-bold" textColor={SURFACE_TEXT}>
          How to play
        </Text>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
          {game.rules.map((rule) => (
            <li key={rule.title}>
              <span className="font-bold">{rule.title}.</span> {rule.description}
            </li>
          ))}
        </ol>
      </>
    )}

    {game.settings.length > 0 && (
      <>
        <Divider color={SURFACE_BORDER} />
        <Text as="h3" className="text-lg font-bold" textColor={SURFACE_TEXT}>
          Host settings
        </Text>
        <ul className="flex flex-col gap-1 text-sm">
          {game.settings.map((setting) => (
            <li key={setting.key} className="flex justify-between gap-4">
              <span className="font-medium">{setting.label}</span>
              <span>Default: {formatSettingValue(setting, setting.default)}</span>
            </li>
          ))}
        </ul>
      </>
    )}

    <Box flex={{ direction: 'col', align: 'end', gap: 4 }}>
      <Button
        variant={{ kind: 'filled', color: 'primary' }}
        className="disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onAction}
        disabled={actionDisabled}
      >
        {actionLabel}
      </Button>
      {actionHint && (
        <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
          {actionHint}
        </Text>
      )}
    </Box>
  </Box>
);

// The action closes the dialog before running, so callers can navigate straight from it.
export const openGameDetails = (game: GameCatalogueItem, props: Omit<GameDetailsProps, 'game'>): void => {
  dialog.show(
    ({ close }) => (
      <GameDetails
        game={game}
        {...props}
        onAction={() => {
          close();
          props.onAction();
        }}
      />
    ),
    { title: game.title, width: 'min(640px, 95vw)' },
  );
};
