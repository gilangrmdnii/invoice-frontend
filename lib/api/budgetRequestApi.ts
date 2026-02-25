import { baseApi } from './baseApi';
import type { ApiResponse, BudgetRequest, CreateBudgetRequest, ApproveBudgetRequest, RejectBudgetRequest } from '../types';

export const budgetRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBudgetRequests: builder.query<ApiResponse<BudgetRequest[]>, void>({
      query: () => '/budget-requests',
      providesTags: ['BudgetRequest'],
    }),
    getBudgetRequest: builder.query<ApiResponse<BudgetRequest>, number>({
      query: (id) => `/budget-requests/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'BudgetRequest', id }],
    }),
    createBudgetRequest: builder.mutation<ApiResponse<BudgetRequest>, CreateBudgetRequest>({
      query: (body) => ({
        url: '/budget-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BudgetRequest', 'Dashboard'],
    }),
    approveBudgetRequest: builder.mutation<ApiResponse<BudgetRequest>, { id: number; body: ApproveBudgetRequest }>({
      query: ({ id, body }) => ({
        url: `/budget-requests/${id}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BudgetRequest', 'Dashboard', 'Project', 'Notification'],
    }),
    rejectBudgetRequest: builder.mutation<ApiResponse<BudgetRequest>, { id: number; body: RejectBudgetRequest }>({
      query: ({ id, body }) => ({
        url: `/budget-requests/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BudgetRequest', 'Dashboard', 'Notification'],
    }),
  }),
});

export const {
  useGetBudgetRequestsQuery,
  useGetBudgetRequestQuery,
  useCreateBudgetRequestMutation,
  useApproveBudgetRequestMutation,
  useRejectBudgetRequestMutation,
} = budgetRequestApi;
