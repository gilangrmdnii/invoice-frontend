import { baseApi } from './baseApi';
import type { ApiResponse, Invoice, CreateInvoiceRequest, UpdateInvoiceRequest, ApprovalRequest } from '../types';

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<ApiResponse<Invoice[]>, void>({
      query: () => '/invoices',
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query<ApiResponse<Invoice>, number>({
      query: (id) => `/invoices/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation<ApiResponse<Invoice>, CreateInvoiceRequest>({
      query: (body) => ({
        url: '/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    updateInvoice: builder.mutation<ApiResponse<Invoice>, { id: number; body: UpdateInvoiceRequest }>({
      query: ({ id, body }) => ({
        url: `/invoices/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    deleteInvoice: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    approveInvoice: builder.mutation<ApiResponse<Invoice>, { id: number; body?: ApprovalRequest }>({
      query: ({ id, body }) => ({
        url: `/invoices/${id}/approve`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Invoice', 'Dashboard', 'Notification'],
    }),
    rejectInvoice: builder.mutation<ApiResponse<Invoice>, { id: number; body?: ApprovalRequest }>({
      query: ({ id, body }) => ({
        url: `/invoices/${id}/reject`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Invoice', 'Dashboard', 'Notification'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useApproveInvoiceMutation,
  useRejectInvoiceMutation,
} = invoiceApi;
