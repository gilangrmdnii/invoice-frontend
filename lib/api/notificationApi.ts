import { baseApi } from './baseApi';
import type { ApiResponse, Notification, UnreadCount } from '../types';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<Notification[]>, void>({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<ApiResponse<UnreadCount>, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
