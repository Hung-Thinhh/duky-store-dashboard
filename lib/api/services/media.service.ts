import { apiClient } from "../axios-client";
import { MediaDetailResponseSchema, MediaListResponseSchema, MediaSchema } from "../schemas/media.schema";

export const mediaService = {
  async getMediaList(params?: Record<string, any>) {
    // Assuming a GET endpoint exists even though not explicitly in contract
    const response = await apiClient.get("/admin/media", { params });
    return MediaListResponseSchema.parse(response).DT;
  },

  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/admin/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return MediaDetailResponseSchema.parse(response).DT;
  },

  async uploadMultipleMedia(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post("/admin/media/upload-multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return MediaSchema.array().parse((response as any).DT);
  },

  async createExternalMedia(data: {
    url: string;
    altText?: string;
    title?: string;
    originalName?: string;
  }) {
    const response = await apiClient.post("/admin/media/external", data);
    return MediaDetailResponseSchema.parse(response).DT;
  },

  async updateMedia(id: string, data: { altText?: string; title?: string; fileName?: string }) {
    const response = await apiClient.patch(`/admin/media/${id}`, data);
    return MediaDetailResponseSchema.parse(response).DT;
  },

  async deleteMedia(id: string) {
    const response = await apiClient.delete(`/admin/media/${id}`);
    return response;
  },
};
