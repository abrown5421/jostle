import type { ConnectedAccount } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import { ConnectedAccountModel } from './connected-accounts.model.js';

export interface ConnectedAccountsService extends CrudService<ConnectedAccount> {
  readonly findByProvider: (userId: string, provider: string) => Promise<ConnectedAccount | null>;
  readonly findActiveByUser: (userId: string) => Promise<readonly ConnectedAccount[]>;
}

const base = createCrudService<ConnectedAccount>(ConnectedAccountModel);

const findByProvider = async (userId: string, provider: string): Promise<ConnectedAccount | null> => 
  ConnectedAccountModel.findOne({ 
    userId, 
    provider 
  }).lean<ConnectedAccount>().exec();

const findActiveByUser = async (userId: string): Promise<readonly ConnectedAccount[]> =>
  ConnectedAccountModel.find({ 
    userId, 
    status: 'active' 
  }).lean<ConnectedAccount[]>().exec();

export const connectedAccountsService: ConnectedAccountsService = {
  ...base,
  findByProvider,
  findActiveByUser,
};