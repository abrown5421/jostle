import type { Setting } from '@inithium/types';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';

export type CreateSettingDto = Omit<Setting, '_id'>;
export type UpdateSettingDto = Partial<CreateSettingDto>;

const endpoints = createCrudEndpoints<Setting, CreateSettingDto, UpdateSettingDto>('settings', 'Setting');

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...endpoints(builder),
    readAllSettings: builder.query<readonly Setting[], void>({
      query: () => '/settings',
      providesTags: ['Setting'],
    }),
  }),
  overrideExisting: false,
});

const {
  useCreateSettingMutation,
  useReadOneSettingQuery:        useSettingQuery,
  useLazyReadOneSettingQuery:    useLazySettingQuery,
  useReadManySettingQuery:       useSettingsBatchQuery,
  useUpdateOneSettingMutation:   useUpdateSettingMutation,
  useDeleteOneSettingMutation:   useDeleteSettingMutation,
  useDeleteManySettingMutation:  useSettingsBatchMutation,
  useReadAllSettingsQuery,
} = settingsApi as any;

export {
  useCreateSettingMutation,
  useSettingQuery,
  useLazySettingQuery,
  useSettingsBatchQuery,
  useUpdateSettingMutation,
  useDeleteSettingMutation,
  useSettingsBatchMutation,
  useReadAllSettingsQuery,
};