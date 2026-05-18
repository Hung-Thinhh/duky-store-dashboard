import { apiClient } from "../axios-client"
import {
  CreateProductVariantPayload,
  ProductVariantByProductResponseSchema,
  ProductVariantDetailResponseSchema,
  ProductVariantListResponseSchema,
  UpdateProductVariantPayload,
} from "../schemas/variant.schema"

export const variantService = {
  async getVariants(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/product-variants", { params })
    return ProductVariantListResponseSchema.parse(response).DT
  },

  async getVariantsByProduct(productId: string, params?: Record<string, any>) {
    const response = await apiClient.get(`/admin/products/${productId}/variants`, { params })
    return ProductVariantByProductResponseSchema.parse(response).DT.data
  },

  async getVariant(id: string) {
    const response = await apiClient.get(`/admin/product-variants/${id}`)
    return ProductVariantDetailResponseSchema.parse(response).DT
  },

  async createVariant(productId: string, data: CreateProductVariantPayload) {
    const response = await apiClient.post(`/admin/products/${productId}/variants`, data)
    return ProductVariantDetailResponseSchema.parse(response).DT
  },

  async updateVariant(id: string, data: UpdateProductVariantPayload) {
    const response = await apiClient.patch(`/admin/product-variants/${id}`, data)
    return ProductVariantDetailResponseSchema.parse(response).DT
  },

  async deleteVariant(id: string) {
    return apiClient.delete(`/admin/product-variants/${id}`)
  },
}
