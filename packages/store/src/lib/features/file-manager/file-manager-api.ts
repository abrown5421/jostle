import { baseApi } from '../../base/base-api';

export type CreateFileResourceDto = {
  slug: string;
  componentName: string;
};

export type FileResourceResponseDto = {
  message: string;
  slug: string;
};

export const fileManagerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPageFile: builder.mutation<FileResourceResponseDto, CreateFileResourceDto>({
      query: (body) => ({ url: '/file-manager/pages', method: 'POST', body }),
    }),
    deletePageFile: builder.mutation<FileResourceResponseDto, string>({
      query: (slug) => ({ url: `/file-manager/pages/${slug}`, method: 'DELETE' }),
    }),
  }),
  overrideExisting: false,
});

export const useCreatePageFileMutation = fileManagerApi.endpoints.createPageFile.useMutation;
export const useDeletePageFileMutation = fileManagerApi.endpoints.deletePageFile.useMutation;
