import { apiClient } from "../axios-client";
import {
  BlogCategoryDetailResponseSchema,
  BlogAiAssistPayload,
  BlogAiAssistResponseSchema,
  BlogAiBlockAssistPayload,
  BlogAiBlockAssistResponseSchema,
  BlogCategoryListResponseSchema,
  BlogPostDetailResponseSchema,
  BlogPostListResponseSchema,
  BlogReusableBlockDetailResponseSchema,
  BlogReusableBlockListResponseSchema,
  CreateBlogCategoryPayload,
  CreateBlogPostPayload,
  CreateBlogReusableBlockPayload,
  UpdateBlogCategoryPayload,
  UpdateBlogPostPayload,
  UpdateBlogReusableBlockPayload,
} from "../schemas/blog.schema";

export const blogService = {
  // Categories
  async getCategories(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/blog-categories", { params });
    return BlogCategoryListResponseSchema.parse(response).DT;
  },

  async getCategory(id: string) {
    const response = await apiClient.get(`/admin/blog-categories/${id}`);
    return BlogCategoryDetailResponseSchema.parse(response).DT;
  },

  async createCategory(data: CreateBlogCategoryPayload) {
    const response = await apiClient.post("/admin/blog-categories", data);
    return BlogCategoryDetailResponseSchema.parse(response).DT;
  },

  async updateCategory(id: string, data: UpdateBlogCategoryPayload) {
    const response = await apiClient.patch(`/admin/blog-categories/${id}`, data);
    return BlogCategoryDetailResponseSchema.parse(response).DT;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(`/admin/blog-categories/${id}`);
    return response;
  },

  async assistWithAi(data: BlogAiAssistPayload) {
    const response = await apiClient.post("/admin/blog-ai/assist", data, {
      timeout: 120000,
    });
    return BlogAiAssistResponseSchema.parse(response).DT;
  },

  async assistBlockWithAi(data: BlogAiBlockAssistPayload) {
    const response = await apiClient.post("/admin/blog-ai/block-assist", data, {
      timeout: 60000,
    });
    return BlogAiBlockAssistResponseSchema.parse(response).DT;
  },

  // Posts
  async getPosts(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/blog-posts", { params });
    return BlogPostListResponseSchema.parse(response).DT;
  },

  async getPost(id: string) {
    const response = await apiClient.get(`/admin/blog-posts/${id}`);
    return BlogPostDetailResponseSchema.parse(response).DT;
  },

  async createPost(data: CreateBlogPostPayload) {
    const response = await apiClient.post("/admin/blog-posts", data);
    return BlogPostDetailResponseSchema.parse(response).DT;
  },

  async updatePost(id: string, data: UpdateBlogPostPayload) {
    const response = await apiClient.patch(`/admin/blog-posts/${id}`, data);
    return BlogPostDetailResponseSchema.parse(response).DT;
  },

  async deletePost(id: string) {
    const response = await apiClient.delete(`/admin/blog-posts/${id}`);
    return response;
  },

  // Reusable content blocks
  async getReusableBlocks(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/blog-reusable-blocks", {
      params,
    });
    return BlogReusableBlockListResponseSchema.parse(response).DT;
  },

  async createReusableBlock(data: CreateBlogReusableBlockPayload) {
    const response = await apiClient.post("/admin/blog-reusable-blocks", data);
    return BlogReusableBlockDetailResponseSchema.parse(response).DT;
  },

  async updateReusableBlock(id: string, data: UpdateBlogReusableBlockPayload) {
    const response = await apiClient.patch(
      `/admin/blog-reusable-blocks/${id}`,
      data
    );
    return BlogReusableBlockDetailResponseSchema.parse(response).DT;
  },

  async deleteReusableBlock(id: string) {
    const response = await apiClient.delete(`/admin/blog-reusable-blocks/${id}`);
    return response;
  },
};
