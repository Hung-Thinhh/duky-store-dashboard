import { apiClient } from "../axios-client";
import {
  AdjustInventoryPayload,
  InventoryAnalyticsResponseSchema,
  InventoryDetailResponseSchema,
  InventoryListResponseSchema,
  InventoryLogListResponseSchema,
} from "../schemas/inventory.schema";

export const inventoryService = {
  async getInventories(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/inventory", { params });
    return InventoryListResponseSchema.parse(response).DT;
  },

  async getInventoryAnalytics() {
    const response = await apiClient.get("/admin/inventory/analytics/overview");
    return InventoryAnalyticsResponseSchema.parse(response).DT;
  },

  async getInventory(id: string) {
    const response = await apiClient.get(`/admin/inventory/${id}`);
    return InventoryDetailResponseSchema.parse(response).DT;
  },

  async getInventoryLogs(id: string, params?: Record<string, any>) {
    const response = await apiClient.get(`/admin/inventory/${id}/logs`, { params });
    return InventoryLogListResponseSchema.parse(response).DT;
  },

  async adjustInventory(id: string, data: AdjustInventoryPayload) {
    const response = await apiClient.patch(`/admin/inventory/${id}/adjust`, data);
    return InventoryDetailResponseSchema.parse(response).DT;
  },
};
