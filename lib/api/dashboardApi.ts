import { baseApi } from './baseApi';
import type { ApiResponse, DashboardData } from '../types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<ApiResponse<DashboardData>, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
