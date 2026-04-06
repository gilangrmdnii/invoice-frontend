import { baseApi } from './baseApi';
import type {
  ApiResponse,
  QCDocument,
  CreateQCDocumentRequest,
  UpdateQCDocumentRequest,
} from '../types';

export const qcDocumentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQCDocuments: builder.query<ApiResponse<QCDocument[]>, number | undefined>({
      query: (projectId) =>
        projectId ? `/qc-documents?project_id=${projectId}` : '/qc-documents',
      providesTags: ['QCDocument'],
    }),
    getQCDocument: builder.query<ApiResponse<QCDocument>, number>({
      query: (id) => `/qc-documents/${id}`,
      providesTags: ['QCDocument'],
    }),
    createQCDocument: builder.mutation<ApiResponse<QCDocument>, CreateQCDocumentRequest>({
      query: (body) => ({ url: '/qc-documents', method: 'POST', body }),
      invalidatesTags: ['QCDocument', 'Notification', 'AuditLog'],
    }),
    updateQCDocument: builder.mutation<ApiResponse<QCDocument>, { id: number; body: UpdateQCDocumentRequest }>({
      query: ({ id, body }) => ({ url: `/qc-documents/${id}`, method: 'PUT', body }),
      invalidatesTags: ['QCDocument', 'AuditLog'],
    }),
    deleteQCDocument: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/qc-documents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['QCDocument', 'AuditLog'],
    }),
  }),
});

export const {
  useGetQCDocumentsQuery,
  useGetQCDocumentQuery,
  useCreateQCDocumentMutation,
  useUpdateQCDocumentMutation,
  useDeleteQCDocumentMutation,
} = qcDocumentApi;
