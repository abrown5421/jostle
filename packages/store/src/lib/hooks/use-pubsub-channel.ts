import { useEffect, useRef } from 'react';
import { connectSocket } from '../socket/socket-client';

export type ChannelEventHandlers = Record<string, (payload: any) => void>;

export const usePubSubChannel = (channel: string | undefined, handlers: ChannelEventHandlers): void => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!channel) return;

    const socket = connectSocket();
    const eventNames = Object.keys(handlersRef.current);

    const boundHandlers = eventNames.map((eventName) => {
      const wrapped = (payload: any) => handlersRef.current[eventName]?.(payload);
      return { eventName, wrapped };
    });

    const joinChannel = () => socket.emit('channel:join', channel);

    socket.on('connect', joinChannel);
    boundHandlers.forEach(({ eventName, wrapped }) => socket.on(eventName, wrapped));
    if (socket.connected) joinChannel();

    return () => {
      socket.off('connect', joinChannel);
      boundHandlers.forEach(({ eventName, wrapped }) => socket.off(eventName, wrapped));
      socket.emit('channel:leave', channel);
    };
  }, [channel]);
};