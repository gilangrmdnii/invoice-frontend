import { baseApi } from './baseApi';
import type { ApiResponse, UploadResponse } from '../types';

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<ApiResponse<UploadResponse>, FormData>({
      query: (body) => ({
        url: '/upload',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useUploadFileMutation } = uploadApi;
