import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// One env secret, two independent derived keys (HKDF) - the credential-encryption key and the
// OAuth-state signing key never share key material, and neither reuses JWT_SECRET, so leaking or
// rotating one never compromises the other.
const envSchema = z.object({
  INTEGRATIONS_SECRET: z.string().min(32, 'INTEGRATIONS_SECRET must be at least 32 characters'),
});

const CREDENTIALS_KEY_INFO = 'inithium:integrations:credentials:v1';
const STATE_KEY_INFO = 'inithium:integrations:oauth-state:v1';
const STATE_AUDIENCE = 'inithium:integrations:oauth';
const STATE_TTL = '10m';

// The version prefix lets a future key rotation decrypt old rows and re-encrypt on next write.
const CIPHER_VERSION = 'v1';
const CIPHER_ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

const deriveKey = (info: string): Buffer => {
  const { INTEGRATIONS_SECRET } = envSchema.parse({ INTEGRATIONS_SECRET: process.env['INTEGRATIONS_SECRET'] });
  return Buffer.from(hkdfSync('sha256', INTEGRATIONS_SECRET, Buffer.alloc(0), info, 32));
};

export const areIntegrationSecretsConfigured = (): boolean =>
  envSchema.safeParse({ INTEGRATIONS_SECRET: process.env['INTEGRATIONS_SECRET'] }).success;

export const encryptCredentials = (credentials: unknown): string => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER_ALGORITHM, deriveKey(CREDENTIALS_KEY_INFO), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(credentials), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [CIPHER_VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
};

export const decryptCredentials = <T>(payload: string): T => {
  const [version, iv, tag, ciphertext] = payload.split(':');
  if (version !== CIPHER_VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Unrecognized integration credential format');
  }
  const decipher = createDecipheriv(CIPHER_ALGORITHM, deriveKey(CREDENTIALS_KEY_INFO), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as T;
};

export interface OAuthStatePayload {
  userId: string;
  provider: string;
  returnTo: string;
}

// The OAuth `state` param is a short-lived signed token rather than a server-side session row:
// the callback is a plain browser redirect that carries no Bearer token, so the state itself is
// what proves which signed-in user started the flow (and which provider/returnTo they asked for).
// A forged or replayed-after-expiry state fails verification and the callback links nothing.
export const signOAuthState = (payload: OAuthStatePayload): string =>
  jwt.sign({ prv: payload.provider, rt: payload.returnTo, n: randomBytes(8).toString('hex') }, deriveKey(STATE_KEY_INFO), {
    subject: payload.userId,
    audience: STATE_AUDIENCE,
    expiresIn: STATE_TTL,
    algorithm: 'HS256',
  });

export const verifyOAuthState = (state: string): OAuthStatePayload => {
  const decoded = jwt.verify(state, deriveKey(STATE_KEY_INFO), {
    audience: STATE_AUDIENCE,
    algorithms: ['HS256'],
  }) as jwt.JwtPayload & { prv?: unknown; rt?: unknown };
  if (typeof decoded.sub !== 'string' || typeof decoded.prv !== 'string' || typeof decoded.rt !== 'string') {
    throw new Error('Malformed OAuth state');
  }
  return { userId: decoded.sub, provider: decoded.prv, returnTo: decoded.rt };
};
