import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://devdrops-gdk2.onrender.com/api",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Drop", "Collection", "User", "Stats", "Recall"],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    updatePreferences: builder.mutation({
      query: (data) => ({
        url: "/auth/preferences",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Drops
    getDrops: builder.query({
      query: ({ page = 1, limit = 8, ...filters } = {}) => ({
        url: "/drops",
        params: { page, limit, ...filters },
      }),
      providesTags: ["Drop"],
    }),
    getDrop: builder.query({
      query: (id) => `/drops/${id}`,
      providesTags: (result, error, id) => [{ type: "Drop", id }],
    }),
    getRecallDrops: builder.query({
      query: ({ page = 1, limit = 8 } = {}) => ({
        url: "/drops/recall",
        params: { page, limit },
      }),
      providesTags: ["Recall"],
    }),
    getRelatedDrops: builder.query({
      query: (id) => `/drops/related/${id}`,
      providesTags: (result, error, id) => [
        { type: "Drop", id: `related-${id}` },
      ],
    }),
    createDrop: builder.mutation({
      query: (data) => ({
        url: "/drops",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Drop", "Recall", "Stats"],
    }),
    updateDrop: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/drops/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Drop", id },
        "Drop",
        "Stats",
      ],
    }),
    deleteDrop: builder.mutation({
      query: (id) => ({
        url: `/drops/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Drop", "Recall", "Stats"],
    }),
    markRecalled: builder.mutation({
      query: ({ id, recallType, confidence }) => ({
        url: `/drops/${id}/recall`,
        method: "POST",
        body: { recallType, confidence },
      }),
      invalidatesTags: ["Drop", "Recall", "Stats"],
    }),
    addRelatedDrop: builder.mutation({
      query: ({ id, relatedDropId }) => ({
        url: `/drops/${id}/relate`,
        method: "POST",
        body: { relatedDropId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Drop", id },
        "Drop",
      ],
    }),
    toggleFavorite: builder.mutation({
      query: (id) => ({
        url: `/drops/${id}/favorite`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Drop", id },
        "Drop",
        "Stats",
      ],
    }),
    getDropStats: builder.query({
      query: () => "/drops/stats",
      providesTags: ["Stats"],
    }),
    bulkDropAction: builder.mutation({
      query: (data) => ({
        url: "/drops/bulk",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Drop", "Recall", "Stats", "Collection"],
    }),

    // Collections
    getCollections: builder.query({
      query: () => "/collections",
      providesTags: ["Collection"],
    }),
    getCollection: builder.query({
      query: (id) => `/collections/${id}`,
      providesTags: (result, error, id) => [{ type: "Collection", id }],
    }),
    createCollection: builder.mutation({
      query: (data) => ({
        url: "/collections",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Collection"],
    }),
    updateCollection: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/collections/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Collection", id },
        "Collection",
      ],
    }),
    deleteCollection: builder.mutation({
      query: (id) => ({
        url: `/collections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Collection"],
    }),
    addDropToCollection: builder.mutation({
      query: ({ collectionId, dropId }) => ({
        url: `/collections/${collectionId}/drops`,
        method: "POST",
        body: { dropId },
      }),
      invalidatesTags: (result, error, { collectionId }) => [
        { type: "Collection", id: collectionId },
        "Collection",
      ],
    }),
    removeDropFromCollection: builder.mutation({
      query: ({ collectionId, dropId }) => ({
        url: `/collections/${collectionId}/drops/${dropId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { collectionId }) => [
        { type: "Collection", id: collectionId },
        "Collection",
      ],
    }),
    generateShareToken: builder.mutation({
      query: (id) => ({
        url: `/collections/${id}/share`,
        method: "GET",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Collection", id },
        "Collection",
      ],
    }),

    // Public
    getSharedCollection: builder.query({
      query: (token) => `/public/share/${token}`,
    }),
    explorePublicDrops: builder.query({
      query: ({ page = 1, limit = 8, ...filters } = {}) => ({
        url: "/public/explore",
        params: { page, limit, ...filters },
      }),
      providesTags: ["Drop"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdatePreferencesMutation,
  useGetDropsQuery,
  useGetDropQuery,
  useGetRecallDropsQuery,
  useGetRelatedDropsQuery,
  useCreateDropMutation,
  useUpdateDropMutation,
  useDeleteDropMutation,
  useMarkRecalledMutation,
  useAddRelatedDropMutation,
  useToggleFavoriteMutation,
  useGetDropStatsQuery,
  useBulkDropActionMutation,
  useGetCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddDropToCollectionMutation,
  useRemoveDropFromCollectionMutation,
  useGenerateShareTokenMutation,
  useGetSharedCollectionQuery,
  useExplorePublicDropsQuery,
} = api;
