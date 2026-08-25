import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

let cachedKey: Buffer | undefined;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'INTEGRATION_TOKEN_ENCRYPTION_KEY environment variable is not set',
    );
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `INTEGRATION_TOKEN_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes, got ${key.length}`,
    );
  }

  cachedKey = key;
  return cachedKey;
}

export function encryptToken(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

export function decryptToken(packed: string): string {
  const [ivB64, authTagB64, ciphertextB64] = packed.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted token');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
