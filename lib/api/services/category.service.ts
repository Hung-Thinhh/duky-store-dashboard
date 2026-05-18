import { apiClient } from "../axios-client";
import {
  CreateCategoryPayload,
  CategoryDetailResponseSchema,
  CategoryListResponseSchema,
  UpdateCategoryPayload,
} from "../schemas/category.schema";

export const categoryService = {
  async getCategories(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/categories", { params });
    return CategoryListResponseSchema.parse(response).DT;
  },

  async getCategory(id: string) {
    const response = await apiClient.get(`/admin/categories/${id}`);
    return CategoryDetailResponseSchema.parse(response).DT;
  },

  async createCategory(data: CreateCategoryPayload) {
    const response = await apiClient.post("/admin/categories", data);
    return CategoryDetailResponseSchema.parse(response).DT;
  },

  async updateCategory(id: string, data: UpdateCategoryPayload) {
    const response = await apiClient.patch(`/admin/categories/${id}`, data);
    return CategoryDetailResponseSchema.parse(response).DT;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(`/admin/categories/${id}`);
    return response;
  },
};
