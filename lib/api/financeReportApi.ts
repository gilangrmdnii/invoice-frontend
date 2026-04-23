import { baseApi } from './baseApi';
import type {
  ApiResponse,
  FinanceReport,
  UpsertFinanceReportRequest,
} from '../types';

export const financeReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceReport: builder.query<ApiResponse<FinanceReport>, number>({
      query: (projectId) => `/finance-reports/${projectId}`,
      providesTags: ['FinanceReport'],
    }),
    upsertFinanceReport: builder.mutation<
      ApiResponse<FinanceReport>,
      { projectId: number; body: UpsertFinanceReportRequest }
    >({
      query: ({ projectId, body }) => ({
        url: `/finance-reports/${projectId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['FinanceReport', 'AuditLog'],
    }),
  }),
});

export const { useGetFinanceReportQuery, useUpsertFinanceReportMutation } =
  financeReportApi;
