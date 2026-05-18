import { apiClient } from "../axios-client"
import {
  ProductAttributeDetailResponseSchema,
  ProductAttributeListResponseSchema,
  ProductAttributePayload,
  ProductAttributeTermDetailResponseSchema,
  ProductAttributeTermPayload,
} from "../schemas/product-attribute.schema"

export const productAttributeService = {
  async getAttributes(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/product-attributes", { params })
    return ProductAttributeListResponseSchema.parse(response).DT
  },

  async createAttribute(data: ProductAttributePayload) {
    const response = await apiClient.post("/admin/product-attributes", data)
    return ProductAttributeDetailResponseSchema.parse(response).DT
  },

  async updateAttribute(id: string, data: Partial<ProductAttributePayload>) {
    const response = await apiClient.patch(`/admin/product-attributes/${id}`, data)
    return ProductAttributeDetailResponseSchema.parse(response).DT
  },

  async deleteAttribute(id: string) {
    return apiClient.delete(`/admin/product-attributes/${id}`)
  },

  async createTerm(attributeId: string, data: ProductAttributeTermPayload) {
    const response = await apiClient.post(`/admin/product-attributes/${attributeId}/terms`, data)
    return ProductAttributeTermDetailResponseSchema.parse(response).DT
  },

  async updateTerm(id: string, data: Partial<ProductAttributeTermPayload>) {
    const response = await apiClient.patch(`/admin/product-attributes/terms/${id}`, data)
    return ProductAttributeTermDetailResponseSchema.parse(response).DT
  },

  async deleteTerm(id: string) {
    return apiClient.delete(`/admin/product-attributes/terms/${id}`)
  },
}
