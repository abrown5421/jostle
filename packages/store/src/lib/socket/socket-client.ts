import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getApiOrigin = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env['VITE_API_ORIGIN'] ?? 'http://localhost:3000';
  }
  return 'http://localhost:3000';
};

export const connectSocket = (): Socket => {
  if (socket) return socket;
  socket = io(getApiOrigin(), { withCredentials: true });
  socket.on('connect_error', (err) => {
    console.error('[socket] connection failed:', err.message);
  });
  return socket;
};


export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;