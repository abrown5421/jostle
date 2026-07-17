import { navigationService } from '@inithium/router';
import { selectActiveUser, useHostSessionMutation, useKickPlayerMutation, useSessionChannel } from '@inithium/store';
import { Box, Text, Button } from '@inithium/ui';
import type { SessionPlayer } from '@inithium/types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';

const getJoinUrl = (code: string): string =>
  `${window.location.origin}/join?code=${code}`;

const playSound = (path: string): void => {
  new Audio(`${import.meta.env['VITE_API_ORIGIN']}${path}`).play().catch(Object);
};

const triggerJoinSound = (): void => 
  playSound('/api/assets/by-key/e3d670a9-677c-4492-89c9-f6d1f5107b25.mp3');

const triggerLeaveSound = (): void => 
  playSound('/api/assets/by-key/d584cddc-c298-4fb1-8dac-c2805c7300a6.mp3');

const HostPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomCode = (searchParams.get('code') ?? '').toUpperCase();
  const activeUser = useSelector(selectActiveUser);

  const [hostSession] = useHostSessionMutation();
  const [kickPlayer] = useKickPlayerMutation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);

  const hasHostedRef = React.useRef(false);

  useEffect(() => {
    if (!roomCode || !activeUser?._id || hasHostedRef.current) return;
    hasHostedRef.current = true;

    hostSession({ lobbyId: roomCode })
      .unwrap()
      .then((session) => {
        setSessionId(session._id);
        setPlayers(session.players);
      })
      .catch((err) => {
        console.error('Failed to host session:', err);
        navigationService.navigate('/');
      });
  }, [roomCode, activeUser?._id]);

  useEffect(() => console.log(players), [players]);

  useSessionChannel({
    lobbyId: sessionId ? roomCode : null,
    onPlayerJoined: (player) => {
      setPlayers((prev) => {
        const isNew = !prev.some((p) => p.playerId === player.playerId);
        if (isNew) triggerJoinSound();
        return isNew ? [...prev, player] : prev;
      });
    },
    onPlayerLeft: ({ playerId }) => {
      setPlayers((prev) => {
        const exists = prev.some((p) => p.playerId === playerId);
        if (exists) triggerLeaveSound();
        return prev.filter((p) => p.playerId !== playerId);
      });
    },
  });

  const onKickPlayer = (playerId: string) => {
    if (!sessionId || !activeUser?._id) return;
    kickPlayer({ sessionId, playerId, hostId: activeUser._id })
      .unwrap()
      .then(() => {
        triggerLeaveSound();
        setPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
      })
      .catch((err) => {
        console.error('Failed to kick player:', err);
      });
  };

  return (
    <Box flex direction="row" justify="center" align="center" fullHeight className="w-full h-screen mx-auto">
      <Box className="flex-1 flex flex-col items-center justify-center gap-4" fullHeight>
        <Box flex direction="col" className="text-center">
          <Text variant="caption" color="surface4-contrast" overrideClassName="uppercase tracking-widest text-xs">
            Join Code:
          </Text>
          <Text variant="h2" color="primary" overrideClassName="font-mono font-bold tracking-wider mt-1">
            {roomCode}
          </Text>
        </Box>

        <Box className="bg-white p-4 rounded-xl shadow-xs border border-slate-100">
          <QRCode
            value={getJoinUrl(roomCode)}
            size={200}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          />
        </Box>
      </Box>

      <Box color="surface3" className="flex-1 flex flex-col gap-4 p-4" fullHeight>
        <Text variant="h5" color="surface3-contrast" overrideClassName="font-mono font-bold primary-font tracking-wider mt-1">
          Players:
        </Text>

        <Box flex direction="col" className="gap-2">
          {players.filter((p) => !p.isHost).map((player) => (
            <Box key={player.playerId} flex direction="row" justify="between" align="center" className="gap-3">
              <Text variant="body" color="surface3-contrast">{player.displayName}</Text>
              <Button color="secondary" onClick={() => onKickPlayer(player.playerId)}>
                Kick
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HostPage;