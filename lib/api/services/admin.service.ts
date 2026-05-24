import { apiClient } from "../axios-client";
import {
  AdminUserListResponseSchema,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "../schemas/admin.schema";

export const adminUserService = {
  async getUsers(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/users", { params });
    return AdminUserListResponseSchema.parse(response).DT;
  },

  async createUser(data: CreateAdminUserPayload) {
    const response = await apiClient.post("/admin/users", data);
    return response.DT;
  },

  async updateUser(id: string, data: UpdateAdminUserPayload) {
    const response = await apiClient.patch(`/admin/users/${id}`, data);
    return response.DT;
  },

  async deleteUser(id: string) {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response;
  },

  async assignRoles(id: string, roleNames: string[]) {
    const response = await apiClient.patch(`/admin/users/${id}/roles`, { roleNames });
    return response.DT;
  },

  async lockUser(id: string) {
    const response = await apiClient.patch(`/admin/users/${id}/lock`);
    return response.DT;
  },

  async unlockUser(id: string) {
    const response = await apiClient.patch(`/admin/users/${id}/unlock`);
    return response.DT;
  },
};
