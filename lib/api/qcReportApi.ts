import { baseApi } from './baseApi';
import type {
  ApiResponse,
  QCReport,
  CreateQCReportRequest,
  UpdateQCReportRequest,
} from '../types';

export const qcReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQCReports: builder.query<ApiResponse<QCReport[]>, number | undefined>({
      query: (projectId) =>
        projectId ? `/qc-reports?project_id=${projectId}` : '/qc-reports',
      providesTags: ['QCReport'],
    }),
    getQCReport: builder.query<ApiResponse<QCReport>, number>({
      query: (id) => `/qc-reports/${id}`,
      providesTags: ['QCReport'],
    }),
    createQCReport: builder.mutation<ApiResponse<QCReport>, CreateQCReportRequest>({
      query: (body) => ({ url: '/qc-reports', method: 'POST', body }),
      invalidatesTags: ['QCReport', 'Notification', 'AuditLog'],
    }),
    updateQCReport: builder.mutation<ApiResponse<QCReport>, { id: number; body: UpdateQCReportRequest }>({
      query: ({ id, body }) => ({ url: `/qc-reports/${id}`, method: 'PUT', body }),
      invalidatesTags: ['QCReport', 'AuditLog'],
    }),
    deleteQCReport: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/qc-reports/${id}`, method: 'DELETE' }),
      invalidatesTags: ['QCReport', 'AuditLog'],
    }),
  }),
});

export const {
  useGetQCReportsQuery,
  useGetQCReportQuery,
  useCreateQCReportMutation,
  useUpdateQCReportMutation,
  useDeleteQCReportMutation,
} = qcReportApi;
