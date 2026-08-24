import { ObjectId } from 'mongodb';
import { toPublicSessionConfiguration } from '../model/index.js';
import type { PublicSessionConfiguration } from '../model/index.js';
import { ensureSessionIndexes, getSessionConfigurationsCollection } from './collection.js';

export interface SetSessionConfigurationInput {
  readonly sessionId: string;
  readonly gameId: string;
  readonly selectedSettings: Readonly<Record<string, string | number | boolean>>;
}

export interface SetSessionConfigurationResult {
  readonly configuration: PublicSessionConfiguration;
  readonly isNewGameSelection: boolean;
}

export async function setSessionConfiguration(input: SetSessionConfigurationInput): Promise<SetSessionConfigurationResult> {
  await ensureSessionIndexes();

  const sessionObjectId = new ObjectId(input.sessionId);
  const prior = await getSessionConfigurationsCollection().findOne({ sessionId: sessionObjectId });
  const isNewGameSelection = !prior || prior.gameId !== input.gameId;
  const updatedAt = new Date();

  await getSessionConfigurationsCollection().updateOne(
    { sessionId: sessionObjectId },
    { $set: { sessionId: sessionObjectId, gameId: input.gameId, selectedSettings: input.selectedSettings, updatedAt } },
    { upsert: true }
  );

  return {
    configuration: toPublicSessionConfiguration({
      _id: prior?._id ?? new ObjectId(),
      sessionId: sessionObjectId,
      gameId: input.gameId,
      selectedSettings: input.selectedSettings,
      updatedAt,
    }),
    isNewGameSelection,
  };
}

export async function getSessionConfiguration(sessionId: string): Promise<PublicSessionConfiguration | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  const document = await getSessionConfigurationsCollection().findOne({ sessionId: new ObjectId(sessionId) });
  return document ? toPublicSessionConfiguration(document) : null;
}
