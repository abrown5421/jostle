import mongoose, { Schema, Document } from 'mongoose';
import { INTEGRATION_STATUSES } from '../contracts/integration.contract';
import type { IntegrationStatus } from '../contracts/integration.contract';

export interface IntegrationDocument extends Document {
  userId: string;
  provider: string;
  status: IntegrationStatus;
  externalAccountId: string;
  externalAccountName?: string;
  externalAccountImageUrl?: string;
  scopes: string[];
  encryptedCredentials: string;
  credentialsExpireAt?: Date;
  metadata: Record<string, unknown>;
  connectedAt: Date;
  updatedAt: Date;
}

const integrationSchema = new Schema<IntegrationDocument>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    status: { type: String, required: true, enum: INTEGRATION_STATUSES, default: 'connected' },
    externalAccountId: { type: String, required: true },
    externalAccountName: { type: String, required: false },
    externalAccountImageUrl: { type: String, required: false },
    scopes: { type: [String], default: [] },
    // `select: false` - every read that needs the ciphertext asks for it explicitly (see
    // integration.repository.ts), so an ad-hoc query elsewhere can't leak it by accident.
    encryptedCredentials: { type: String, required: true, select: false },
    credentialsExpireAt: { type: Date, required: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
    connectedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: true }, minimize: false },
);

integrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const IntegrationModel =
  mongoose.models['Integration'] || mongoose.model<IntegrationDocument>('Integration', integrationSchema);
