import { getClient } from '@jostle/db';
import type { Collection } from 'mongodb';
import type {
  IntegrationConnectionAttemptDocument,
  UserIntegrationDocument,
} from '../model/index.js';

export function getUserIntegrationsCollection(): Collection<UserIntegrationDocument> {
  return getClient().db().collection<UserIntegrationDocument>('userIntegrations');
}

export function getConnectionAttemptsCollection(): Collection<IntegrationConnectionAttemptDocument> {
  return getClient()
    .db()
    .collection<IntegrationConnectionAttemptDocument>('integrationConnectionAttempts');
}
