import { baseApi } from './baseApi';
import type {
  ApiResponse,
  ProjectWorker,
  CreateProjectWorkerRequest,
  UpdateProjectWorkerRequest,
} from '../types';

export const workerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkers: builder.query<ApiResponse<ProjectWorker[]>, number>({
      query: (projectId) => `/projects/${projectId}/workers`,
      providesTags: ['Worker'],
    }),
    getWorker: builder.query<ApiResponse<ProjectWorker>, { projectId: number; id: number }>({
      query: ({ projectId, id }) => `/projects/${projectId}/workers/${id}`,
      providesTags: ['Worker'],
    }),
    createWorker: builder.mutation<ApiResponse<ProjectWorker>, { projectId: number; body: CreateProjectWorkerRequest }>({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/workers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Worker', 'AuditLog'],
    }),
    updateWorker: builder.mutation<ApiResponse<ProjectWorker>, { projectId: number; id: number; body: UpdateProjectWorkerRequest }>({
      query: ({ projectId, id, body }) => ({
        url: `/projects/${projectId}/workers/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Worker', 'AuditLog'],
    }),
    deleteWorker: builder.mutation<ApiResponse<null>, { projectId: number; id: number }>({
      query: ({ projectId, id }) => ({
        url: `/projects/${projectId}/workers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Worker', 'AuditLog'],
    }),
  }),
});

export const {
  useGetWorkersQuery,
  useGetWorkerQuery,
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
  useDeleteWorkerMutation,
} = workerApi;
