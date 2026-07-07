import { baseApi } from '../../base/base-api';
import type { Asset } from '@inithium/types';

export type CreateAssetIntentDto = {
  filename: string;
  mimeType: string;
  size: number;
  ownerType: 'app' | 'user';
  ownerId: string | null;
};

export type AssetIntentResponseDto = {
  uploadId: string;
  storageKey: string;
  uploadUrl: string;
  expiresAt: string;
};

export type AssetUploadResponseDto = {
  asset_id: string;
  storageKey: string;
  category: string;
  originalName: string;
  sizeBytes: number;
};

export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<Asset[], Record<string, unknown> | void>({
      query: (params) => ({
        url: '/assets',
        method: 'GET',
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Asset' as const, id: _id })),
              { type: 'Asset', id: 'LIST' },
            ]
          : [{ type: 'Asset', id: 'LIST' }],
    }),

    getAssetById: builder.query<Asset, string>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Asset', id }],
    }),

    createAssetIntent: builder.mutation<AssetIntentResponseDto, CreateAssetIntentDto>({
      query: (body) => ({
        url: '/asset-manager/intent',
        method: 'POST',
        body,
      }),
    }),

    uploadAssetBinary: builder.mutation<
      AssetUploadResponseDto,
      { uploadUrl: string; file: File | Blob }
    >({
      query: ({ uploadUrl, file }) => ({
        url: `/asset-manager${uploadUrl}`,
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      }),
      invalidatesTags: [{ type: 'Asset', id: 'LIST' }],
    }),

    updateAsset: builder.mutation<Asset, { id: string; data: Partial<Asset> }>({
      query: ({ id, data }) => ({
        url: `/assets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Asset', id },
        { type: 'Asset', id: 'LIST' },
      ],
    }),

    deleteAsset: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Asset', id },
        { type: 'Asset', id: 'LIST' },
      ],
    }),

    invalidateAssets: builder.mutation<void, void>({
      queryFn: () => ({ data: undefined }),
      invalidatesTags: [{ type: 'Asset', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssetsQuery,
  useGetAssetByIdQuery,
  useCreateAssetIntentMutation,
  useUploadAssetBinaryMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useInvalidateAssetsMutation
} = assetsApi;
