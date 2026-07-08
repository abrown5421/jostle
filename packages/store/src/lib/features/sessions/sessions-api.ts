import type { GameSession } from '@inithium/types';
import type { PaginatedResult, PaginationQuery } from '@inithium/api-core';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';
import type { JoinSessionDto } from '@inithium/api-collections';

export type CreateSessionDto = Omit<GameSession, '_id'>;
export type UpdateSessionDto = Partial<CreateSessionDto>;

const endpoints = createCrudEndpoints<GameSession, CreateSessionDto, UpdateSessionDto>('sessions', 'Session');

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...endpoints(builder),
    readSessionByJoinCode: builder.query<GameSession, string>({
      query: (joinCode) => ({ url: `/sessions/code/${joinCode}` }),
      providesTags: ['Session'],
    }),
    joinSession: builder.mutation<GameSession, { id: string; player: JoinSessionDto }>({
      query: ({ id, player }) => ({ url: `/sessions/${id}/join`, method: 'POST', body: player }),
      invalidatesTags: ['Session'],
    }),
    leaveSession: builder.mutation<GameSession, { id: string; player_id: string }>({
      query: ({ id, player_id }) => ({ url: `/sessions/${id}/leave`, method: 'POST', body: { player_id } }),
      invalidatesTags: ['Session'],
    }),
  }),
  overrideExisting: false,
});

const dynamicHooks = sessionsApi as any;

const {
  useCreateSessionMutation,
  useReadOneSessionQuery:       useSessionQuery,
  useLazyReadOneSessionQuery:   useLazySessionQuery,
  useReadManySessionQuery:      useSessionsBatchQuery,
  useReadPageSessionQuery:      useSessionsPageQuery,
  useUpdateOneSessionMutation:  useUpdateSessionMutation,
  useDeleteOneSessionMutation:  useDeleteSessionMutation,
  useDeleteManySessionMutation: useDeleteSessionsBatchMutation,
} = dynamicHooks;

const {
  useReadSessionByJoinCodeQuery,
  useLazyReadSessionByJoinCodeQuery,
  useJoinSessionMutation,
  useLeaveSessionMutation,
} = sessionsApi;

export {
  useCreateSessionMutation,
  useSessionQuery,
  useLazySessionQuery,
  useSessionsBatchQuery,
  useSessionsPageQuery,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useDeleteSessionsBatchMutation,
  useReadSessionByJoinCodeQuery,
  useLazyReadSessionByJoinCodeQuery,
  useJoinSessionMutation,
  useLeaveSessionMutation,
};