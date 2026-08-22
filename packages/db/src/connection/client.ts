import { MongoClient } from 'mongodb';

let client: MongoClient | undefined;

/**
 * Lazily-created, process-wide MongoClient. The driver manages its own
 * connection pool and reconnection internally, so callers should reuse
 * this single instance rather than constructing their own.
 */
export function getClient(): MongoClient {
  if (!client) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    client = new MongoClient(uri);
  }
  return client;
}

/** Closes the shared client, if one was ever created. Call on shutdown. */
export async function closeClient(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
  }
}
