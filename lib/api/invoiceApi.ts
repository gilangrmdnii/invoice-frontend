import { baseApi } from './baseApi';
import type { ApiResponse, Invoice, InvoicePayment, CreateInvoiceRequest, UpdateInvoiceRequest, CreateInvoicePaymentRequest, ApprovalRequest } from '../types';

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<ApiResponse<Invoice[]>, void>({
      query: () => '/invoices',
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query<ApiResponse<Invoice>, number>({
      query: (id) => `/invoices/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Invoice', id }, 'Payment'],
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
    // Payment endpoints
    createPayment: builder.mutation<ApiResponse<InvoicePayment>, CreateInvoicePaymentRequest>({
      query: (body) => ({
        url: `/invoices/${body.invoice_id}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice', 'Payment', 'Dashboard'],
    }),
    getPayments: builder.query<ApiResponse<InvoicePayment[]>, number>({
      query: (invoiceId) => `/invoices/${invoiceId}/payments`,
      providesTags: ['Payment'],
    }),
    deletePayment: builder.mutation<ApiResponse<null>, { invoiceId: number; paymentId: number }>({
      query: ({ invoiceId, paymentId }) => ({
        url: `/invoices/${invoiceId}/payments/${paymentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice', 'Payment', 'Dashboard'],
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
  useCreatePaymentMutation,
  useGetPaymentsQuery,
  useDeletePaymentMutation,
} = invoiceApi;
