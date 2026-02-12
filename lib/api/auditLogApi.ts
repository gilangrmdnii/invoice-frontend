import { baseApi } from './baseApi';
import type { ApiResponse, AuditLog } from '../types';

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<ApiResponse<AuditLog[]>, string | void>({
      query: (entityType) =>
        entityType ? `/audit-logs?entity_type=${entityType}` : '/audit-logs',
      providesTags: ['AuditLog'],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
