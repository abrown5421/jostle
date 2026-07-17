import { useEffect, useRef } from 'react';
import type { SessionPlayer } from '@inithium/types';
import { SESSION_EVENTS, buildSessionGroupChannel, buildSessionPlayerChannel } from '@inithium/types';
import { connectSocket } from '../socket/socket-client.js';

interface UseSessionChannelOptions {
  readonly lobbyId: string | null;
  readonly playerId?: string | null;
  readonly onPlayerJoined?: (player: SessionPlayer) => void;
  readonly onPlayerLeft?: (payload: { playerId: string }) => void;
  readonly onKicked?: (payload: { reason?: string }) => void;
}

const JOIN_RETRY_DELAY_MS = 500;
const MAX_JOIN_ATTEMPTS = 5;

export const useSessionChannel = ({
  lobbyId,
  playerId,
  onPlayerJoined,
  onPlayerLeft,
  onKicked,
}: UseSessionChannelOptions): void => {
  const handlersRef = useRef({ onPlayerJoined, onPlayerLeft, onKicked });
  handlersRef.current = { onPlayerJoined, onPlayerLeft, onKicked };

  useEffect(() => {
    if (!lobbyId) return;

    const socket = connectSocket();
    const groupChannel = buildSessionGroupChannel(lobbyId);
    const playerChannel = playerId ? buildSessionPlayerChannel(lobbyId, playerId) : null;
    let cancelled = false;

    const joinChannelWithRetry = (channel: string, attempt = 1) => {
      socket.emit('channel:join', channel, (ok: boolean) => {
        if (cancelled || ok) return;
        if (attempt >= MAX_JOIN_ATTEMPTS) {
          console.error(`[useSessionChannel] failed to join "${channel}" after ${attempt} attempts`);
          return;
        }
        setTimeout(() => joinChannelWithRetry(channel, attempt + 1), JOIN_RETRY_DELAY_MS);
      });
    };

    const joinChannels = () => {
      joinChannelWithRetry(groupChannel);
      if (playerChannel) joinChannelWithRetry(playerChannel);
    };

    const handlePlayerJoined = (player: SessionPlayer) => handlersRef.current.onPlayerJoined?.(player);
    const handlePlayerLeft = (payload: { playerId: string }) => handlersRef.current.onPlayerLeft?.(payload);
    const handleKicked = (payload: { reason?: string }) => handlersRef.current.onKicked?.(payload);

    socket.on('connect', joinChannels);
    socket.on(SESSION_EVENTS.playerJoined, handlePlayerJoined);
    socket.on(SESSION_EVENTS.playerLeft, handlePlayerLeft);
    socket.on(SESSION_EVENTS.playerKicked, handleKicked);
    if (socket.connected) joinChannels();

    return () => {
      cancelled = true;
      socket.off('connect', joinChannels);
      socket.off(SESSION_EVENTS.playerJoined, handlePlayerJoined);
      socket.off(SESSION_EVENTS.playerLeft, handlePlayerLeft);
      socket.off(SESSION_EVENTS.playerKicked, handleKicked);
      socket.emit('channel:leave', groupChannel);
      if (playerChannel) socket.emit('channel:leave', playerChannel);
    };
  }, [lobbyId, playerId]);
};