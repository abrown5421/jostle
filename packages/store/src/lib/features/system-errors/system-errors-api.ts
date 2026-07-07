import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';

export interface ApiErrorRecord {
  _id: string;
  message: string;
  statusCode: number;
  method: string;
  url: string;
  stack?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const crudEndpoints = createCrudEndpoints<ApiErrorRecord, void, void>(
  'system-errors',
  'SystemError'
);

export const systemErrorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...crudEndpoints(builder),
  }),
  overrideExisting: false,
});

const dynamicHooks = systemErrorsApi as any;

const {
  useReadPageSystemErrorQuery:      useSystemErrorsPageQuery,
  useReadOneSystemErrorQuery:       useSystemErrorQuery,
  useDeleteOneSystemErrorMutation:  useDeleteSystemErrorMutation,
  useDeleteManySystemErrorMutation: useDeleteSystemErrorsBatchMutation,
} = dynamicHooks;

export {
  useSystemErrorsPageQuery,
  useSystemErrorQuery,
  useDeleteSystemErrorMutation,
  useDeleteSystemErrorsBatchMutation,
};