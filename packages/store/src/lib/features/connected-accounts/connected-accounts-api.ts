import type { ConnectedAccount } from '@inithium/types';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';

export type CreateConnectedAccountDto = Omit<ConnectedAccount, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateConnectedAccountDto = Partial<CreateConnectedAccountDto>;

const endpoints = createCrudEndpoints<ConnectedAccount, CreateConnectedAccountDto, UpdateConnectedAccountDto>(
  'connected-accounts', 
  'ConnectedAccount'
);

export const connectedAccountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...endpoints(builder),
    
    readActiveConnectionsByUser: builder.query<readonly ConnectedAccount[], string>({
      query: (userId) => `/connected-accounts/user/${userId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'ConnectedAccount' as const, id: _id })),
              { type: 'ConnectedAccount' as const, id: 'LIST' }
            ]
          : [{ type: 'ConnectedAccount' as const, id: 'LIST' }],
    }),

    readConnectionByProvider: builder.query<ConnectedAccount, { userId: string; provider: string }>({
      query: ({ userId, provider }) => `/connected-accounts/user/${userId}/provider/${provider}`,
      providesTags: (result) => 
        result 
          ? [{ type: 'ConnectedAccount' as const, id: result._id }] 
          : [{ type: 'ConnectedAccount' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

const dynamicHooks = connectedAccountsApi as any;

const {
  useCreateConnectedAccountMutation,
  useReadOneConnectedAccountQuery:       useConnectedAccountQuery,
  useLazyReadOneConnectedAccountQuery:   useLazyConnectedAccountQuery,
  useReadManyConnectedAccountQuery:      useConnectedAccountsBatchQuery,
  useReadPageConnectedAccountQuery:      useConnectedAccountsPageQuery,
  useUpdateOneConnectedAccountMutation:  useUpdateConnectedAccountMutation,
  useDeleteOneConnectedAccountMutation:  useDeleteConnectedAccountMutation,
  useDeleteManyConnectedAccountMutation: useDeleteConnectedAccountsBatchMutation,
} = dynamicHooks;

const { 
  useReadActiveConnectionsByUserQuery, 
  useReadConnectionByProviderQuery 
} = connectedAccountsApi;

export {
  useCreateConnectedAccountMutation,
  useConnectedAccountQuery,
  useLazyConnectedAccountQuery,
  useConnectedAccountsBatchQuery,
  useConnectedAccountsPageQuery,
  useUpdateConnectedAccountMutation,
  useDeleteConnectedAccountMutation,
  useDeleteConnectedAccountsBatchMutation,
  useReadActiveConnectionsByUserQuery,
  useReadConnectionByProviderQuery,
};