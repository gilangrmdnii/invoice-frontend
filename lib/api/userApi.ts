import { baseApi } from './baseApi';
import type { ApiResponse, User } from '../types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<User[]>, string | void>({
      query: (role) => (role ? `/users?role=${role}` : '/users'),
    }),
  }),
});

export const { useGetUsersQuery } = userApi;
