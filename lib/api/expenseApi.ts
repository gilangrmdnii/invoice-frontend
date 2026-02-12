import { baseApi } from './baseApi';
import type { ApiResponse, Expense, CreateExpenseRequest, UpdateExpenseRequest, ApprovalRequest } from '../types';

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<ApiResponse<Expense[]>, void>({
      query: () => '/expenses',
      providesTags: ['Expense'],
    }),
    getExpense: builder.query<ApiResponse<Expense>, number>({
      query: (id) => `/expenses/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Expense', id }],
    }),
    createExpense: builder.mutation<ApiResponse<Expense>, CreateExpenseRequest>({
      query: (body) => ({
        url: '/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    updateExpense: builder.mutation<ApiResponse<Expense>, { id: number; body: UpdateExpenseRequest }>({
      query: ({ id, body }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    deleteExpense: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    approveExpense: builder.mutation<ApiResponse<Expense>, { id: number; body?: ApprovalRequest }>({
      query: ({ id, body }) => ({
        url: `/expenses/${id}/approve`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Expense', 'Dashboard', 'Notification'],
    }),
    rejectExpense: builder.mutation<ApiResponse<Expense>, { id: number; body?: ApprovalRequest }>({
      query: ({ id, body }) => ({
        url: `/expenses/${id}/reject`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Expense', 'Dashboard', 'Notification'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useApproveExpenseMutation,
  useRejectExpenseMutation,
} = expenseApi;
