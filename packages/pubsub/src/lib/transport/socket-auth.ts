import { parse } from 'cookie';
import type { Socket } from 'socket.io';
import { verifyAccessToken } from '@inithium/api-core';
import type { AccessTokenPayload } from '@inithium/types';

export const extractSocketUser = (socket: Socket): AccessTokenPayload | null => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  const token = cookies['access_token'];
  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
};