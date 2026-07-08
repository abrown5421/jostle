import type { GameSession } from '@inithium/types';
import type { MutationDefinition, QueryDefinition } from '@reduxjs/toolkit/query';
import type { PaginationQuery, PaginatedResult } from '@inithium/api-core';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';
import type { JoinSessionDto } from '@inithium/api-collections';

export type CreateSessionDto = Omit<GameSession, '_id'>;
export type UpdateSessionDto = Partial<CreateSessionDto>;

type SessionCrudEndpoints = {
  createSession: MutationDefinition<CreateSessionDto, any, any, GameSession>;
  readOneSession: QueryDefinition<string, any, any, GameSession>;
  readManySession: QueryDefinition<readonly string[], any, any, readonly GameSession[]>;
  readPageSession: QueryDefinition<PaginationQuery | void, any, any, PaginatedResult<GameSession>>;
  updateOneSession: MutationDefinition<{ id: string; data: UpdateSessionDto }, any, any, GameSession>;
  deleteOneSession: MutationDefinition<string, any, any, GameSession>;
  deleteManySession: MutationDefinition<readonly string[], any, any, { readonly deletedCount: number }>;
};

const endpoints = createCrudEndpoints<GameSession, CreateSessionDto, UpdateSessionDto>('sessions', 'Session');

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...(endpoints(builder) as unknown as SessionCrudEndpoints),
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

export const {
  useCreateSessionMutation,
  useReadOneSessionQuery: useSessionQuery,
  useLazyReadOneSessionQuery: useLazySessionQuery,
  useReadManySessionQuery: useSessionsBatchQuery,
  useReadPageSessionQuery: useSessionsPageQuery,
  useUpdateOneSessionMutation: useUpdateSessionMutation,
  useDeleteOneSessionMutation: useDeleteSessionMutation,
  useDeleteManySessionMutation: useDeleteSessionsBatchMutation,
  useReadSessionByJoinCodeQuery,
  useLazyReadSessionByJoinCodeQuery,
  useJoinSessionMutation,
  useLeaveSessionMutation,
} = sessionsApi;