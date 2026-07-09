import type { Game } from '@inithium/types';
import type { PaginatedResult, PaginationQuery } from '@inithium/api-core';
import { createCrudEndpoints } from '../../base/crud-api-factory.js';
import { baseApi } from '../../base/base-api.js';

export type CreateGameDto = Omit<Game, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateGameDto = Partial<CreateGameDto>;

const endpoints = createCrudEndpoints<Game, CreateGameDto, UpdateGameDto>('games', 'Game');

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...endpoints(builder),
    readAllGames: builder.query<PaginatedResult<Game>, PaginationQuery | void>({
      query: (params) => ({ url: '/games', params: params ?? {} }),
      providesTags: ['Game'],
    }),
    readGamesByCategory: builder.query<Game[], Game['category']>({
      query: (category) => ({ url: `/games/category/${category}` }),
      providesTags: ['Game'],
    }),
  }),
  overrideExisting: false,
});

const dynamicHooks = gamesApi as any;

const {
  useCreateGameMutation,
  useReadOneGameQuery:         useGameQuery,
  useLazyReadOneGameQuery:     useLazyGameQuery,
  useReadManyGameQuery:        useGamesBatchQuery,
  useReadPageGameQuery:        useGamesPageQuery,
  useUpdateOneGameMutation:    useUpdateGameMutation,
  useDeleteOneGameMutation:    useDeleteGameMutation,
  useDeleteManyGameMutation:   useDeleteGamesBatchMutation,
} = dynamicHooks;

const { useReadAllGamesQuery, useReadGamesByCategoryQuery } = gamesApi;

export {
  useCreateGameMutation,
  useGameQuery,
  useLazyGameQuery,
  useGamesBatchQuery,
  useGamesPageQuery,
  useUpdateGameMutation,
  useDeleteGameMutation,
  useDeleteGamesBatchMutation,
  useReadAllGamesQuery,
  useReadGamesByCategoryQuery,
};