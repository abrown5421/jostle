import { useEffect, useState } from 'react';
import { connectSocket } from '../socket/socket-client.js';
import type { AvatarStatus } from '@inithium/types';

const PRESENCE_DOMAIN = 'presence';
const PRESENCE_STATUS_EVENT = 'status-changed';

interface PresenceStatusPayload {
  readonly userId: string;
  readonly status: AvatarStatus;
}

const buildPresenceChannel = (userId: string): string => `${PRESENCE_DOMAIN}:${userId}`;

export const usePresence = (userId?: string): AvatarStatus => {
  const [status, setStatus] = useState<AvatarStatus>('offline');

  useEffect(() => {
    if (!userId) {
      setStatus('offline');
      return;
    }

    const socket = connectSocket();
    const channel = buildPresenceChannel(userId);

    const joinChannel = () => socket.emit('channel:join', channel);

    const handleStatusChanged = (payload: PresenceStatusPayload) => {
      if (payload.userId !== userId) return;
      setStatus(payload.status);
    };

    socket.on('connect', joinChannel);
    socket.on(PRESENCE_STATUS_EVENT, handleStatusChanged);
    if (socket.connected) joinChannel();

    return () => {
      socket.off('connect', joinChannel);
      socket.off(PRESENCE_STATUS_EVENT, handleStatusChanged);
      socket.emit('channel:leave', channel);
    };
  }, [userId]);

  return status;
};