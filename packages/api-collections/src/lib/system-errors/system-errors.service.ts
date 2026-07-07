import { createCrudService, CrudService } from '@inithium/api-core';
import { SystemErrorModel, ISystemError } from './system-errors.model.js';

export type SystemErrorService = CrudService<ISystemError>;
export const systemErrorService: SystemErrorService = createCrudService<ISystemError>(SystemErrorModel);