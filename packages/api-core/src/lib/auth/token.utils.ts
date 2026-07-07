import jwt from 'jsonwebtoken';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
} from '@inithium/types';

const ACCESS_SECRET  = process.env['JWT_ACCESS_SECRET']!;
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET']!;
const ACCESS_TTL     = process.env['JWT_ACCESS_EXPIRES_IN']  ?? '15m';
const REFRESH_TTL    = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '3d';

const MAX_SESSION_MS = 3 * 24 * 60 * 60 * 1000;

export const signTokens = (payload: AccessTokenPayload): AuthTokens => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  } as jwt.SignOptions);

  const refreshPayload: RefreshTokenPayload = {
    sub: payload.sub,
    absoluteExpiry: Date.now() + MAX_SESSION_MS,
  };

  const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;

  if (Date.now() > payload.absoluteExpiry) {
    throw new jwt.JsonWebTokenError('Refresh token absolute expiry exceeded');
  }

  return payload;
};