import type { Friend } from '@inithium/types';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';

export type CreateFriendDto = {
  requester: string;
  recipient: string;
  action_user: string;
};

export type UpdateFriendDto = {
  status?: 'pending' | 'accepted' | 'declined' | 'blocked';
  action_user?: string;
};

const endpoints = createCrudEndpoints<Friend, CreateFriendDto, UpdateFriendDto>('friends', 'Friend');

export const friendsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...endpoints(builder),
    readFriendsByUser: builder.query<readonly Friend[], string>({
      query: (userId) => `/friends/of/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'Friend', id: userId }],
    }),
  }),
  overrideExisting: false,
});

const {
  useCreateFriendMutation,
  useReadOneFriendQuery,
  useLazyReadOneFriendQuery,
  useReadManyFriendQuery,
  useUpdateOneFriendMutation,
  useDeleteOneFriendMutation,
  useDeleteManyFriendMutation,
  useReadFriendsByUserQuery,
  useLazyReadFriendsByUserQuery,
} = friendsApi as any;

export {
  useCreateFriendMutation,
  useReadOneFriendQuery,
  useLazyReadOneFriendQuery,
  useReadManyFriendQuery,
  useUpdateOneFriendMutation,
  useDeleteOneFriendMutation,
  useDeleteManyFriendMutation,
  useReadFriendsByUserQuery,
  useLazyReadFriendsByUserQuery,
};