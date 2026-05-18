import { apiClient } from "../axios-client";
import {
  CreateOrderPayload,
  OrderDetailResponseSchema,
  OrderListResponseSchema,
  UpdateOrderStatusPayload,
  UpdatePaymentPayload,
} from "../schemas/order.schema";

export const orderService = {
  async getOrders(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/orders", { params });
    return OrderListResponseSchema.parse(response).DT;
  },

  async createOrder(data: CreateOrderPayload) {
    const response = await apiClient.post("/admin/orders", data);
    return OrderDetailResponseSchema.parse(response).DT;
  },

  async getOrder(id: string) {
    const response = await apiClient.get(`/admin/orders/${id}`);
    return OrderDetailResponseSchema.parse(response).DT;
  },

  async updateOrderStatus(id: string, data: UpdateOrderStatusPayload) {
    const response = await apiClient.patch(`/admin/orders/${id}/status`, data);
    return OrderDetailResponseSchema.parse(response).DT;
  },

  async cancelOrder(id: string, note?: string) {
    const response = await apiClient.patch(`/admin/orders/${id}/cancel`, { internalNote: note });
    return OrderDetailResponseSchema.parse(response).DT;
  },

  async updateOrderNote(id: string, note: string) {
    const response = await apiClient.patch(`/admin/orders/${id}/note`, { internalNote: note });
    return OrderDetailResponseSchema.parse(response).DT;
  },

  async updatePayment(id: string, data: UpdatePaymentPayload) {
    const response = await apiClient.patch(`/admin/orders/${id}/payment`, data);
    return OrderDetailResponseSchema.parse(response).DT;
  },
};
