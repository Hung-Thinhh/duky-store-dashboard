import { apiClient } from "../axios-client";
import {
  CreateHomepageItemPayload,
  CreateHomepageSectionPayload,
  HomepageSectionDetailResponseSchema,
  HomepageSectionListResponseSchema,
  UpdateHomepageItemPayload,
  UpdateHomepageSectionPayload,
} from "../schemas/homepage.schema";

export const homepageService = {
  // Sections
  async getSections(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/homepage/sections", { params });
    return HomepageSectionListResponseSchema.parse(response).DT;
  },

  async getSection(id: string) {
    const response = await apiClient.get(`/admin/homepage/sections/${id}`);
    return HomepageSectionDetailResponseSchema.parse(response).DT;
  },

  async createSection(data: CreateHomepageSectionPayload) {
    const response = await apiClient.post("/admin/homepage/sections", data);
    return HomepageSectionDetailResponseSchema.parse(response).DT;
  },

  async updateSection(id: string, data: UpdateHomepageSectionPayload) {
    const response = await apiClient.patch(`/admin/homepage/sections/${id}`, data);
    return HomepageSectionDetailResponseSchema.parse(response).DT;
  },

  async deleteSection(id: string) {
    const response = await apiClient.delete(`/admin/homepage/sections/${id}`);
    return response;
  },

  // Items
  async createItem(sectionId: string, data: CreateHomepageItemPayload) {
    const response = await apiClient.post(`/admin/homepage/sections/${sectionId}/items`, data);
    return response.DT; // return item or updated section
  },

  async updateItem(itemId: string, data: UpdateHomepageItemPayload) {
    const response = await apiClient.patch(`/admin/homepage/items/${itemId}`, data);
    return response.DT;
  },

  async deleteItem(itemId: string) {
    const response = await apiClient.delete(`/admin/homepage/items/${itemId}`);
    return response;
  },
};
