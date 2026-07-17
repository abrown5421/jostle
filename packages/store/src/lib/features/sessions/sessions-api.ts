import type { Session, SessionPlayer } from '@inithium/types';
import type { PaginatedResult, PaginationQuery } from '@inithium/api-core';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';

export type CreateSessionDto = Omit<Session, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateSessionDto = Partial<CreateSessionDto>;

const endpoints = createCrudEndpoints<Session, CreateSessionDto, UpdateSessionDto>('sessions', 'Session');

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...endpoints(builder),
    readAllSessions: builder.query<PaginatedResult<Session>, PaginationQuery | void>({
      query: (params) => ({ url: '/sessions', params: params ?? {} }),
      providesTags: ['Session'],
    }),
    readSessionByLobbyId: builder.query<Session, string>({
      query: (lobbyId) => ({ url: `/sessions/lobby/${lobbyId}` }),
      providesTags: ['Session'],
    }),
    readActiveSessionsByHost: builder.query<Session[], string>({
      query: (hostId) => ({ url: `/sessions/active/host/${hostId}` }),
      providesTags: ['Session'],
    }),
    hostSession: builder.mutation<Session, { lobbyId: string }>({
      query: (body) => ({ url: '/sessions/host', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
    joinSession: builder.mutation<{ session: Session; player: SessionPlayer }, { lobbyId: string; displayName: string }>({
      query: ({ lobbyId, ...body }) => ({ url: `/sessions/lobby/${lobbyId}/join`, method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
    kickPlayer: builder.mutation<Session, { sessionId: string; playerId: string; hostId: string }>({
      query: ({ sessionId, playerId, hostId }) => ({
        url: `/sessions/${sessionId}/kick/${playerId}`,
        method: 'POST',
        body: { hostId },
      }),
      invalidatesTags: ['Session'],
    }),
  }),
  overrideExisting: false,
});

const dynamicHooks = sessionsApi as any;

const {
  useCreateSessionMutation,
  useReadOneSessionQuery:         useSessionQuery,
  useLazyReadOneSessionQuery:     useLazySessionQuery,
  useReadManySessionQuery:        useSessionsBatchQuery,
  useReadPageSessionQuery:        useSessionsPageQuery,
  useUpdateOneSessionMutation:    useUpdateSessionMutation,
  useDeleteOneSessionMutation:    useDeleteSessionMutation,
  useDeleteManySessionMutation:   useDeleteSessionsBatchMutation,
} = dynamicHooks;

const {
  useReadAllSessionsQuery,
  useReadSessionByLobbyIdQuery,
  useReadActiveSessionsByHostQuery,
  useHostSessionMutation,
  useJoinSessionMutation,
  useKickPlayerMutation,
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
  useReadAllSessionsQuery,
  useReadSessionByLobbyIdQuery,
  useReadActiveSessionsByHostQuery,
  useHostSessionMutation,
  useJoinSessionMutation,
  useKickPlayerMutation,
};