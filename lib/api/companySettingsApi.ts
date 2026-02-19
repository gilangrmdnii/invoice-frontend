import { baseApi } from './baseApi';
import type { ApiResponse, CompanySettings, UpsertCompanySettingsRequest } from '../types';

export const companySettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompanySettings: builder.query<ApiResponse<CompanySettings | null>, void>({
      query: () => '/company-settings',
      providesTags: ['CompanySettings'],
    }),
    upsertCompanySettings: builder.mutation<ApiResponse<CompanySettings>, UpsertCompanySettingsRequest>({
      query: (body) => ({
        url: '/company-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CompanySettings'],
    }),
  }),
});

export const {
  useGetCompanySettingsQuery,
  useUpsertCompanySettingsMutation,
} = companySettingsApi;
