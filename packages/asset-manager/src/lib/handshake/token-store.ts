import { TOKEN_TTL_MS } from '../config/index.js';
import type { UploadToken } from '../types/index.js';

const pendingTokens = new Map<string, UploadToken>();

export const registerToken = (token: UploadToken): void => {
  pendingTokens.set(token.uploadId, token);
};

export const consumeToken = (uploadId: string): UploadToken | null => {
  const token = pendingTokens.get(uploadId);
  if (!token) return null;
  if (Date.now() > token.expiresAt) {
    pendingTokens.delete(uploadId);
    return null;
  }
  pendingTokens.delete(uploadId);
  return token;
};

export const peekToken = (uploadId: string): UploadToken | null => {
  const token = pendingTokens.get(uploadId);
  if (!token) return null;
  if (Date.now() > token.expiresAt) {
    pendingTokens.delete(uploadId);
    return null;
  }
  return token;
};

export const purgeExpiredTokens = (): void => {
  const now = Date.now();
  for (const [id, token] of pendingTokens.entries()) {
    if (now > token.expiresAt) pendingTokens.delete(id);
  }
};

export const startTokenGarbageCollector = (intervalMs = TOKEN_TTL_MS): NodeJS.Timeout =>
  setInterval(purgeExpiredTokens, intervalMs);
