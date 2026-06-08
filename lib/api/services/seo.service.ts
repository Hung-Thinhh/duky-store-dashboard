import { apiClient } from "../axios-client";
import {
  CreateRedirectPayload,
  RedirectListResponseSchema,
} from "../schemas/seo.schema";

export const seoService = {
  async getRedirects(params?: Record<string, unknown>) {
    const response = await apiClient.get("/admin/redirects", { params });
    return RedirectListResponseSchema.parse(response).DT;
  },

  async createRedirect(data: CreateRedirectPayload) {
    const response = await apiClient.post("/admin/redirects", {
      sourcePath: data.sourcePath,
      targetPath: data.destinationPath,
      statusCode: Number(data.type),
      status: data.isActive ? "ACTIVE" : "INACTIVE",
    });
    return response.DT;
  },

  async updateRedirect(id: string, data: Partial<CreateRedirectPayload>) {
    const response = await apiClient.patch(`/admin/redirects/${id}`, {
      ...(data.sourcePath !== undefined ? { sourcePath: data.sourcePath } : {}),
      ...(data.destinationPath !== undefined ? { targetPath: data.destinationPath } : {}),
      ...(data.type !== undefined ? { statusCode: Number(data.type) } : {}),
      ...(data.isActive !== undefined ? { status: data.isActive ? "ACTIVE" : "INACTIVE" } : {}),
    });
    return response.DT;
  },

  async deleteRedirect(id: string) {
    const response = await apiClient.delete(`/admin/redirects/${id}`);
    return response;
  },

  async generateSitemap() {
    const response = await apiClient.get("/sitemap.xml");
    return response;
  },

  async getRobotsTxt() {
    const response = await apiClient.get("/robots.txt");
    return response;
  }
};
