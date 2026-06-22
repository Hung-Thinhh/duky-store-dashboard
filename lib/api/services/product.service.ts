import { apiClient } from "../axios-client";
import {
  CreateProductPayload,
  ProductDetailResponseSchema,
  ProductListResponseSchema,
  UpdateProductPayload,
  ProductAiAssistPayload,
  ProductAiAssistResponseSchema,
} from "../schemas/product.schema";

export const productService = {
  async getProducts(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/products", { params });
    return ProductListResponseSchema.parse(response).DT;
  },

  async getProduct(id: string) {
    const response = await apiClient.get(`/admin/products/${id}`);
    return ProductDetailResponseSchema.parse(response).DT;
  },

  async createProduct(data: CreateProductPayload) {
    const response = await apiClient.post("/admin/products", data);
    return ProductDetailResponseSchema.parse(response).DT;
  },

  async updateProduct(id: string, data: UpdateProductPayload) {
    const response = await apiClient.patch(`/admin/products/${id}`, data);
    return ProductDetailResponseSchema.parse(response).DT;
  },

  async deleteProduct(id: string) {
    const response = await apiClient.delete(`/admin/products/${id}`);
    return response;
  },

  async assistWithAi(data: ProductAiAssistPayload) {
    const response = await apiClient.post("/admin/product-ai/assist", data, {
      timeout: 900000,
    });
    return ProductAiAssistResponseSchema.parse(response).DT;
  },
};
