import type { Setting, SettingValue } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import { SettingModel } from './settings.model.js';

export interface SettingsService extends CrudService<Setting> {
  readonly getRuntimeValue: <T extends SettingValue>(key: string, fallback: T) => Promise<T>;
}

const base = createCrudService<Setting>(SettingModel);

export const settingsService: SettingsService = {
  ...base,

  getRuntimeValue: async <T extends SettingValue>(key: string, fallback: T): Promise<T> => {
    const record = await SettingModel.findOne({ key }).lean().exec();
    return record ? (record.value as T) : fallback;
  }
};