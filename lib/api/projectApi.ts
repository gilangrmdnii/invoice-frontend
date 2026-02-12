import { baseApi } from './baseApi';
import type {
  ApiResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddMemberRequest,
  ProjectMember,
} from '../types';

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<ApiResponse<Project[]>, void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProject: builder.query<ApiResponse<Project>, number>({
      query: (id) => `/projects/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<ApiResponse<Project>, CreateProjectRequest>({
      query: (body) => ({
        url: '/projects',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project', 'Dashboard'],
    }),
    updateProject: builder.mutation<ApiResponse<Project>, { id: number; body: UpdateProjectRequest }>({
      query: ({ id, body }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Project', 'Dashboard'],
    }),
    getProjectMembers: builder.query<ApiResponse<ProjectMember[]>, number>({
      query: (id) => `/projects/${id}/members`,
      providesTags: (_r, _e, id) => [{ type: 'Project', id: `members-${id}` }],
    }),
    addProjectMember: builder.mutation<ApiResponse<null>, { projectId: number; body: AddMemberRequest }>({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    removeProjectMember: builder.mutation<ApiResponse<null>, { projectId: number; userId: number }>({
      query: ({ projectId, userId }) => ({
        url: `/projects/${projectId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
} = projectApi;
