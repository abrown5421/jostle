import { navigationService } from '@inithium/router';
import { selectActiveUser, useReadSessionByLobbyIdQuery, useSessionChannel } from '@inithium/store';
import { Box, Text } from '@inithium/ui';
import type { SessionPlayer } from '@inithium/types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

const LobbyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lobbyId = (searchParams.get('code') ?? '').toUpperCase();
  const playerId = searchParams.get('playerId') ?? '';
  const activeUser = useSelector(selectActiveUser);

  const { data: session } = useReadSessionByLobbyIdQuery(lobbyId, { skip: !lobbyId });
  const [players, setPlayers] = useState<SessionPlayer[]>([]);

  useEffect(() => {
    if (session?.players) setPlayers(session.players);
  }, [session?.players]);

  useSessionChannel({
    lobbyId: lobbyId || null,
    playerId,
    onPlayerJoined: (player) => {
      setPlayers((prev) => (prev.some((p) => p.playerId === player.playerId) ? prev : [...prev, player]));
    },
    onPlayerLeft: ({ playerId: leftId }) => {
      setPlayers((prev) => prev.filter((p) => p.playerId !== leftId));
    },
    onKicked: () => {
      navigationService.navigate('/join');
    },
  });

  return (
    <Box flex direction="col" justify="center" align="center" fullHeight className="w-4/5 md:w-1/3 lg:w-1/5 gap-4">
      <Text variant="h5" color="surface2-contrast" overrideClassName="primary-font">
        Waiting for host to start...
      </Text>

      <Box flex direction="col" className="gap-2 w-full">
        {players.map((player) => (
          <Text key={player.playerId} variant="body" color="surface2-contrast">
            {player.displayName}
            {player.playerId === activeUser?._id ? ' (you)' : ''}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

export default LobbyPage;