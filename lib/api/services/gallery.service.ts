import { apiClient } from "../axios-client";
import { GalleryDetailResponseSchema, GalleryListResponseSchema, GallerySchema } from "../schemas/gallery.schema";

export const galleryService = {
  async getGalleryList(params?: Record<string, string | number | boolean | undefined>) {
    const response = await apiClient.get("/admin/gallery", { params });
    return GalleryListResponseSchema.parse(response).DT;
  },

  async getGallery(id: string) {
    const response = await apiClient.get(`/admin/gallery/${id}`);
    return GalleryDetailResponseSchema.parse(response).DT;
  },

  async uploadGallery(file: File, metadata?: { altText?: string; title?: string; fileName?: string; forMale?: boolean }) {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata?.altText) formData.append("altText", metadata.altText);
    if (metadata?.title) formData.append("title", metadata.title);
    if (metadata?.fileName) formData.append("fileName", metadata.fileName);
    if (metadata?.forMale !== undefined) formData.append("forMale", String(metadata.forMale));

    const response = await apiClient.post("/admin/gallery/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return GalleryDetailResponseSchema.parse(response).DT;
  },

  async uploadMultipleGallery(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post("/admin/gallery/upload-multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return GallerySchema.array().parse(response.DT);
  },

  async createExternalGallery(data: {
    url: string;
    altText?: string;
    title?: string;
    originalName?: string;
    forMale?: boolean;
  }) {
    const response = await apiClient.post("/admin/gallery/external", data);
    return GalleryDetailResponseSchema.parse(response).DT;
  },

  async updateGallery(id: string, data: { altText?: string; title?: string; fileName?: string; forMale?: boolean }) {
    const response = await apiClient.patch(`/admin/gallery/${id}`, data);
    return GalleryDetailResponseSchema.parse(response).DT;
  },

  async deleteGallery(id: string) {
    const response = await apiClient.delete(`/admin/gallery/${id}`);
    return response;
  },
};
