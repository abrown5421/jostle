import { getClient } from '../connection/index.js';

export interface DatabaseHealth {
  connected: boolean;
  error?: string;
}

/**
 * Live connectivity check: pings the database rather than trusting a
 * cached "connected" flag from startup, since the connection can drop
 * (or never have succeeded) after the process starts.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    await getClient().db().command({ ping: 1 });
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
