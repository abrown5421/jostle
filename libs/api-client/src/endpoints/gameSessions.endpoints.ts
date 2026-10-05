import type { AvatarConfig } from '@inithium/db';
import type { ApiResponse } from '@inithium/api-utils';
import type { GameSessionErrorCode, HostedSession, JoinedSession } from '@inithium/game-session';
import { baseApi } from '../baseApi';

export interface JoinGameSessionInput {
  readonly code: string;
  readonly name: string;
  readonly rejoinToken?: string;
  // A guest's randomized avatar - the server ignores it for a signed-in player.
  readonly avatar?: AvatarConfig;
}

// A session's live state arrives over /realtime/session (see gameSessionClientStore.ts), never by
// re-fetching - these calls just mint or look up the token the socket authenticates with.
export const gameSessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get-or-create on the server, so calling it again on a /host refresh resumes the same session.
    hostGameSession: builder.mutation<HostedSession, void>({
      query: () => ({ url: '/api/game-sessions', method: 'POST' }),
      transformResponse: (response: ApiResponse<HostedSession>) => response.data,
      invalidatesTags: ['HostedSession'],
    }),
    // The signed-in user's live hosted session, or null - never creates one. How host-flow pages
    // other than /host (the catalogue, /settings/:code) find the session they belong to. Callers
    // should refetch on mount: a session can end while nothing on screen is subscribed to it.
    getMyHostedSession: builder.query<HostedSession | null, void>({
      query: () => '/api/game-sessions/mine',
      transformResponse: (response: ApiResponse<HostedSession | null>) => response.data,
      providesTags: ['HostedSession'],
    }),
    joinGameSession: builder.mutation<JoinedSession, JoinGameSessionInput>({
      query: ({ code, ...body }) => ({ url: `/api/game-sessions/${encodeURIComponent(code)}/join`, method: 'POST', body }),
      transformResponse: (response: ApiResponse<JoinedSession>) => response.data,
    }),
  }),
});

export const { useHostGameSessionMutation, useJoinGameSessionMutation, useGetMyHostedSessionQuery } = gameSessionsApi;

// Pulls the GameSessionErrorCode the API puts in `error.details.code` out of an RTK Query error,
// so a form can pin the message to the right field.
export const getGameSessionError = (error: unknown): { code: GameSessionErrorCode | null; message: string } => {
  const body = (error as { data?: { error?: { message?: string; details?: { code?: GameSessionErrorCode } } } })?.data?.error;
  return { code: body?.details?.code ?? null, message: body?.message ?? 'Something went wrong. Please try again.' };
};
