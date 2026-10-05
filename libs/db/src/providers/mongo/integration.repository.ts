import type { Model } from 'mongoose';
import {
  IntegrationEntity,
  IntegrationRepository,
  IntegrationStatus,
  UpdateIntegrationCredentialsInput,
  UpsertIntegrationInput,
} from '../../contracts/integration.contract';
import { IntegrationDocument } from '../../schemas/integration.schema';

// encryptedCredentials is `select: false` on the schema - every query here opts back in, since
// IntegrationEntity always carries it (the route layer is what strips it before responding).
const WITH_CREDENTIALS = '+encryptedCredentials';

const mapToIntegrationEntity = (doc: IntegrationDocument): IntegrationEntity => ({
  id: doc._id.toString(),
  userId: doc.userId,
  provider: doc.provider,
  status: doc.status,
  externalAccountId: doc.externalAccountId,
  externalAccountName: doc.externalAccountName,
  externalAccountImageUrl: doc.externalAccountImageUrl,
  scopes: doc.scopes ?? [],
  encryptedCredentials: doc.encryptedCredentials,
  credentialsExpireAt: doc.credentialsExpireAt,
  metadata: doc.metadata ?? {},
  connectedAt: doc.connectedAt,
  updatedAt: doc.updatedAt,
});

export const createMongoIntegrationRepository = (model: Model<IntegrationDocument>): IntegrationRepository => ({
  findForUser: async (userId: string, provider: string): Promise<IntegrationEntity | null> => {
    const integration = await model.findOne({ userId, provider }).select(WITH_CREDENTIALS).exec();
    return integration ? mapToIntegrationEntity(integration) : null;
  },
  listForUser: async (userId: string): Promise<IntegrationEntity[]> => {
    const integrations = await model.find({ userId }).select(WITH_CREDENTIALS).sort({ provider: 1 }).exec();
    return integrations.map(mapToIntegrationEntity);
  },
  upsert: async (input: UpsertIntegrationInput): Promise<IntegrationEntity> => {
    const { userId, provider, ...rest } = input;
    const update = {
      ...rest,
      metadata: rest.metadata ?? {},
      status: 'connected' as IntegrationStatus,
      connectedAt: new Date(),
    };
    const integration = await model
      .findOneAndUpdate(
        { userId, provider },
        { $set: update, $setOnInsert: { userId, provider } },
        { new: true, upsert: true, runValidators: true },
      )
      .select(WITH_CREDENTIALS)
      .exec();
    return mapToIntegrationEntity(integration as IntegrationDocument);
  },
  updateCredentials: async (
    userId: string,
    provider: string,
    input: UpdateIntegrationCredentialsInput,
  ): Promise<IntegrationEntity | null> => {
    const update: Record<string, unknown> = {
      encryptedCredentials: input.encryptedCredentials,
      credentialsExpireAt: input.credentialsExpireAt,
    };
    if (input.scopes) update['scopes'] = input.scopes;
    if (input.metadata) update['metadata'] = input.metadata;
    const integration = await model
      .findOneAndUpdate({ userId, provider }, { $set: update }, { new: true, runValidators: true })
      .select(WITH_CREDENTIALS)
      .exec();
    return integration ? mapToIntegrationEntity(integration) : null;
  },
  updateStatus: async (userId: string, provider: string, status: IntegrationStatus): Promise<IntegrationEntity | null> => {
    const integration = await model
      .findOneAndUpdate({ userId, provider }, { $set: { status } }, { new: true, runValidators: true })
      .select(WITH_CREDENTIALS)
      .exec();
    return integration ? mapToIntegrationEntity(integration) : null;
  },
  delete: async (userId: string, provider: string): Promise<boolean> => {
    const result = await model.findOneAndDelete({ userId, provider }).exec();
    return result !== null;
  },
});
