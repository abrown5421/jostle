import { Avatar, Box, Button, Text } from '@inithium/ui';
import type { SessionParticipant } from '@inithium/api-client';
import { resolveParticipantAvatarProps } from '../../games/shared/participants';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../games/surfaceColors';

const AVATAR_SIZE = 40;

export interface ParticipantListProps {
  readonly participants: readonly SessionParticipant[];
  readonly onRemove?: (participantId: string) => void;
}

export const ParticipantList = ({ participants, onRemove }: ParticipantListProps) => (
  <Box flex={{ direction: 'col', gap: 16 }} className="w-full">
    <Text as="h2" className="text-lg font-bold" textColor={SURFACE_TEXT}>
      Players ({participants.length})
    </Text>
    {participants.length === 0 ? (
      <Text as="p" textColor={SURFACE_TEXT}>
        Waiting for players to join…
      </Text>
    ) : (
      <ul className="flex flex-col gap-3">
        {participants.map((participant) => (
          <Box
            as="li"
            key={participant.id}
            flex={{ direction: 'row', align: 'center', justify: 'between', gap: 8 }}
            padding={{ base: 8 }}
            bgColor={SURFACE_BG}
            borderColor={SURFACE_BORDER}
            className="rounded"
          >
            <Box flex={{ direction: 'row', align: 'center', gap: 12 }}>
              <Avatar
                {...resolveParticipantAvatarProps(participant)}
                size={AVATAR_SIZE}
                // Reuses the presence dot for seat connectivity: a dropped phone shows offline.
                status={participant.isConnected ? 'online' : 'offline'}
              />
              <Text as="span" className="font-medium" textColor={SURFACE_TEXT}>
                {participant.name}
              </Text>
            </Box>
            {onRemove && (
              <Button variant={{ kind: 'filled', color: 'red', intensity: 500 }} onClick={() => onRemove(participant.id)}>
                Remove
              </Button>
            )}
          </Box>
        ))}
      </ul>
    )}
  </Box>
);
