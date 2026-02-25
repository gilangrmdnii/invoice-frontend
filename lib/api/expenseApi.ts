import { baseApi } from './baseApi';
import type { ApiResponse, Expense, CreateExpenseRequest, UpdateExpenseRequest } from '../types';

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
      invalidatesTags: ['Expense', 'Dashboard', 'Project'],
    }),
    updateExpense: builder.mutation<ApiResponse<Expense>, { id: number; body: UpdateExpenseRequest }>({
      query: ({ id, body }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Expense', 'Dashboard', 'Project'],
    }),
    deleteExpense: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense', 'Dashboard', 'Project'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
