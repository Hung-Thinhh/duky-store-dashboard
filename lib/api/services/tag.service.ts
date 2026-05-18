import { apiClient } from "../axios-client";
import {
  CreateTagPayload,
  TagDetailResponseSchema,
  TagListResponseSchema,
  UpdateTagPayload,
} from "../schemas/tag.schema";

export const tagService = {
  async getTags(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/tags", { params });
    return TagListResponseSchema.parse(response).DT;
  },

  async getTag(id: string) {
    const response = await apiClient.get(`/admin/tags/${id}`);
    return TagDetailResponseSchema.parse(response).DT;
  },

  async createTag(data: CreateTagPayload) {
    const response = await apiClient.post("/admin/tags", data);
    return TagDetailResponseSchema.parse(response).DT;
  },

  async updateTag(id: string, data: UpdateTagPayload) {
    const response = await apiClient.patch(`/admin/tags/${id}`, data);
    return TagDetailResponseSchema.parse(response).DT;
  },

  async deleteTag(id: string) {
    const response = await apiClient.delete(`/admin/tags/${id}`);
    return response;
  },
};
