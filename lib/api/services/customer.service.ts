import { apiClient } from "../axios-client";
import {
  CustomerDetailResponseSchema,
  CustomerListResponseSchema,
  UpdateCustomerPayload,
} from "../schemas/customer.schema";
import { OrderListResponseSchema } from "../schemas/order.schema";

export const customerService = {
  async getCustomers(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/customers", { params });
    return CustomerListResponseSchema.parse(response).DT;
  },

  async getCustomer(id: string) {
    const response = await apiClient.get(`/admin/customers/${id}`);
    return CustomerDetailResponseSchema.parse(response).DT;
  },

  async getCustomerOrders(id: string, params?: Record<string, any>) {
    const response = await apiClient.get(`/admin/customers/${id}/orders`, { params });
    return OrderListResponseSchema.parse(response).DT;
  },

  async updateCustomer(id: string, data: UpdateCustomerPayload) {
    const response = await apiClient.patch(`/admin/customers/${id}`, data);
    return CustomerDetailResponseSchema.parse(response).DT;
  },
};
