import type { User } from '../user/user.types.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  absoluteExpiry: number;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface SignupRequestDto
  extends Omit<import('../user/user.types.js').User, '_id' | 'role'> {}

export interface RefreshRequestDto {}