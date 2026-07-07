import { Router } from 'express';
import { createCrudRouter } from '@inithium/api-core';
import { settingsService } from './settings.service.js';
import { CreateSettingSchema, UpdateSettingSchema } from './settings.validators.js';

export const settingsRouter: Router = createCrudRouter(settingsService, {
  onCreate: CreateSettingSchema,
  onUpdate: UpdateSettingSchema,
});