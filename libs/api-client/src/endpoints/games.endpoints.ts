import type { ApiResponse } from '@inithium/api-utils';
import type { GameEntity, GameRequirement } from '@inithium/db';
import { baseApi } from '../baseApi';

// One host requirement the signed-in user doesn't meet yet, with why ("Connect your Spotify
// account") - mirrors @inithium/game-session's GameRequirementBlocker.
export interface GameRequirementBlocker {
  readonly requirement: GameRequirement;
  readonly reason: string;
}

// A catalogue record as the API serves it: the stored game plus whether its gameplay has shipped
// and what (if anything) stops the caller hosting it - null when signed out (see games.route.ts).
// Type-only import from @inithium/db, same as page.endpoints.ts.
export type GameCatalogueItem = GameEntity & {
  readonly isPlayable: boolean;
  readonly hostBlockers: readonly GameRequirementBlocker[] | null;
};

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listGames: builder.query<GameCatalogueItem[], void>({
      query: () => '/api/games',
      transformResponse: (response: ApiResponse<GameCatalogueItem[]>) => response.data,
      // hostBlockers are per user, so a login (which invalidates 'User') refetches.
      providesTags: ['Game', 'User'],
    }),
    getGame: builder.query<GameCatalogueItem, string>({
      query: (slug) => `/api/games/${encodeURIComponent(slug)}`,
      transformResponse: (response: ApiResponse<GameCatalogueItem>) => response.data,
      providesTags: (_result, _error, slug) => [{ type: 'Game', id: slug }, 'User'],
    }),
  }),
});

export const { useListGamesQuery, useGetGameQuery } = gamesApi;
