import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/active-user/active-user-slice.js';
import { connectSocket } from '../socket/socket-client.js';

const PRESENCE_ACTIVITY_EVENT = 'presence:activity';
const THROTTLE_MS = 30 * 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'pointerdown',
  'scroll',
  'touchstart',
];

export const useActivityHeartbeat = (): void => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    const sendActivity = () => {
      const now = Date.now();
      if (now - lastSentRef.current < THROTTLE_MS) return;
      lastSentRef.current = now;
      socket.emit(PRESENCE_ACTIVITY_EVENT);
    };

    sendActivity();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, sendActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, sendActivity));
    };
  }, [isAuthenticated]);
};