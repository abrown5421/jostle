import { Schema, model } from 'mongoose';
import type { ConnectedAccount } from '@inithium/types';

const providerCredentialsSchema = new Schema(
  {
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: String },
    scope: { type: [String], default: undefined },
  },
  { 
    _id: false, 
    strict: false 
  }
);

const connectedAccountSchema = new Schema<ConnectedAccount>(
  {
    userId: { type: String, ref: 'User', required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    providerUsername: { type: String },
    credentials: { type: providerCredentialsSchema, required: true },
    status: { type: String, enum: ['active', 'expired', 'revoked'], required: true, default: 'active' },
  },
  { 
    timestamps: true,
    collection: 'connected-accounts'
  }
);

connectedAccountSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const ConnectedAccountModel = model<ConnectedAccount>('ConnectedAccount', connectedAccountSchema);