import { apiClient } from "../axios-client";
import {
  BlogCategoryDetailResponseSchema,
  BlogCategoryListResponseSchema,
  BlogPostDetailResponseSchema,
  BlogPostListResponseSchema,
  CreateBlogCategoryPayload,
  CreateBlogPostPayload,
  UpdateBlogCategoryPayload,
  UpdateBlogPostPayload,
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
};
