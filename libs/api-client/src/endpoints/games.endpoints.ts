import type { ApiResponse } from '@inithium/api-utils';
import type { GameEntity } from '@inithium/db';
import { baseApi } from '../baseApi';

// A catalogue record as the API serves it: the stored game plus whether its gameplay has shipped
// (see games.route.ts). Type-only import from @inithium/db, same as page.endpoints.ts.
export type GameCatalogueItem = GameEntity & { readonly isPlayable: boolean };

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listGames: builder.query<GameCatalogueItem[], void>({
      query: () => '/api/games',
      transformResponse: (response: ApiResponse<GameCatalogueItem[]>) => response.data,
      providesTags: ['Game'],
    }),
    getGame: builder.query<GameCatalogueItem, string>({
      query: (slug) => `/api/games/${encodeURIComponent(slug)}`,
      transformResponse: (response: ApiResponse<GameCatalogueItem>) => response.data,
      providesTags: (_result, _error, slug) => [{ type: 'Game', id: slug }],
    }),
  }),
});

export const { useListGamesQuery, useGetGameQuery } = gamesApi;
