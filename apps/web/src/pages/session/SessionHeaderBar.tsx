import { Box, Button, Icon, Text, resolveColorClass } from '@inithium/ui';
import { GHOST_BUTTON_PROPS, SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../games/surfaceColors';

export interface SessionHeaderBarProps {
  readonly code: string;
  readonly playerCount: number;
  readonly onBack: () => void;
}

// The host screen's compact strip while it's busy picking or configuring a game - the lobby is
// still open, so the join code stays on screen for anyone arriving late.
export const SessionHeaderBar = ({ code, playerCount, onBack }: SessionHeaderBarProps) => (
  <Box
    flex={{ direction: 'row', justify: 'between', align: 'center', gap: 12, wrap: 'wrap' }}
    padding={{ base: 12 }}
    bgColor={SURFACE_BG}
    borderColor={SURFACE_BORDER}
    className={`w-full border-b ${resolveColorClass('text', SURFACE_TEXT)}`}
  >
    <Button {...GHOST_BUTTON_PROPS} onClick={onBack} entryAdornment={<Icon as="span" name="ArrowLeft" size={16} />}>
      Lobby
    </Button>
    <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
      Join at {window.location.host}/join with code{' '}
      <span className="font-mono text-lg font-bold tracking-widest">{code}</span>
    </Text>
    <Box as="span" flex={{ direction: 'row', align: 'center', gap: 4 }} className="text-sm font-medium">
      <Icon as="span" name="Users" size={16} />
      {playerCount} {playerCount === 1 ? 'player' : 'players'}
    </Box>
  </Box>
);
