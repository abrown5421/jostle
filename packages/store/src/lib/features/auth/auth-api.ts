import { baseApi } from '../../base/base-api';
import { clearActiveUser } from '../active-user/active-user-slice';
import type { LoginRequestDto, User } from '@inithium/types';

export type SignupDto = Omit<User, '_id' | 'role'>;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<{ message: string }, SignupDto>({
      query: (body) => ({
        url:         '/auth/signup',
        method:      'POST',
        body,
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
    }),

    login: builder.mutation<{ message: string }, LoginRequestDto>({
      query: (body) => ({
        url:         '/auth/login',
        method:      'POST',
        body,
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
    }),

    refresh: builder.mutation<{ message: string }, void>({
      query: () => ({
        url:         '/auth/refresh',
        method:      'POST',
        credentials: 'include',
      }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch {
          dispatch(clearActiveUser());
          window.location.href = '/auth/login';
        }
      },
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url:         '/auth/logout',
        method:      'POST',
        credentials: 'include',
      }),
      invalidatesTags: ['Auth'],
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearActiveUser());
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useSignupMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
} = authApi;