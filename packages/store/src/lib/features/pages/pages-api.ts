import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';
import { Page } from '@inithium/types';

export type { Page };

const crudEndpoints = createCrudEndpoints<Page, Omit<Page, '_id'>, Partial<Omit<Page, '_id'>>>(
  'pages',
  'Page',
);

export const pagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...crudEndpoints(builder),
    readAllPages: builder.query<Page[], void>({
      query: () => '/pages',
      providesTags: ['Page'],
    }),
  }),
  overrideExisting: false,
});

const {
  useCreatePageMutation,
  useReadOnePageQuery: usePageQuery,
  useReadManyPageQuery: usePagesBatchQuery,
  useUpdateOnePageMutation: useUpdatePageMutation,
  useDeleteOnePageMutation: useDeletePageMutation,
  useDeleteManyPageMutation: useDeletePagesBatchMutation,
  useReadAllPagesQuery,
} = pagesApi as any;

export {
  useCreatePageMutation,
  usePageQuery,
  usePagesBatchQuery,
  useUpdatePageMutation,
  useDeletePageMutation,
  useDeletePagesBatchMutation,
  useReadAllPagesQuery,
};
