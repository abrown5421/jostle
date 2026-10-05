import { randomBytes, randomInt } from 'node:crypto';

export const SESSION_CODE_LENGTH = 6;

// Uppercase alphanumerics minus the look-alikes (0/O, 1/I/L) - these codes get read off a TV
// across a room and typed on a phone, so ambiguity costs more than the reduced keyspace
// (31^6 ~ 887M) does.
const SESSION_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const generateSessionCode = (): string =>
  Array.from({ length: SESSION_CODE_LENGTH }, () => SESSION_CODE_ALPHABET[randomInt(SESSION_CODE_ALPHABET.length)]).join('');

// Codes are case-insensitive for whoever's typing them - normalize before every lookup.
export const normalizeSessionCode = (raw: string): string => raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export const generateSessionToken = (): string => randomBytes(24).toString('base64url');

export const generateParticipantId = (): string => randomBytes(8).toString('hex');
