import { apiClient } from "../axios-client"
import {
  Campaign,
  CampaignDetailResponseSchema,
  CampaignListResponseSchema,
  Coupon,
  CouponDetailResponseSchema,
  CouponListResponseSchema,
  EmailLogListResponseSchema,
  NotificationTemplate,
  NotificationTemplateDetailResponseSchema,
  NotificationTemplateListResponseSchema,
  ReviewListResponseSchema,
  WishlistListResponseSchema,
} from "../schemas/marketing.schema"

export const marketingService = {
  async getCoupons(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/coupons", { params })
    return CouponListResponseSchema.parse(response).DT
  },

  async createCoupon(data: Omit<Coupon, "id" | "usedCount">) {
    const response = await apiClient.post("/admin/coupons", data)
    return CouponDetailResponseSchema.parse(response).DT
  },

  async updateCoupon(id: string, data: Partial<Coupon>) {
    const response = await apiClient.patch(`/admin/coupons/${id}`, data)
    return CouponDetailResponseSchema.parse(response).DT
  },

  async deleteCoupon(id: string) {
    return apiClient.delete(`/admin/coupons/${id}`)
  },

  async getCampaigns(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/campaigns", { params })
    return CampaignListResponseSchema.parse(response).DT
  },

  async createCampaign(data: Omit<Campaign, "id">) {
    const response = await apiClient.post("/admin/campaigns", data)
    return CampaignDetailResponseSchema.parse(response).DT
  },

  async updateCampaign(id: string, data: Partial<Campaign>) {
    const response = await apiClient.patch(`/admin/campaigns/${id}`, data)
    return CampaignDetailResponseSchema.parse(response).DT
  },

  async getReviews(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/reviews", { params })
    return ReviewListResponseSchema.parse(response).DT
  },

  async updateReview(id: string, data: { status?: "PENDING" | "APPROVED" | "REJECTED"; reply?: string }) {
    const response = await apiClient.patch(`/admin/reviews/${id}`, data)
    return response.DT
  },

  async getWishlistMetrics(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/wishlist/analytics", { params })
    return WishlistListResponseSchema.parse(response).DT
  },

  async getNotificationTemplates(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/notification-templates", { params })
    return NotificationTemplateListResponseSchema.parse(response).DT
  },

  async createNotificationTemplate(data: Omit<NotificationTemplate, "id">) {
    const response = await apiClient.post("/admin/notification-templates", data)
    return NotificationTemplateDetailResponseSchema.parse(response).DT
  },

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>) {
    const response = await apiClient.patch(`/admin/notification-templates/${id}`, data)
    return NotificationTemplateDetailResponseSchema.parse(response).DT
  },

  async getEmailLogs(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/email-logs", { params })
    return EmailLogListResponseSchema.parse(response).DT
  },

  async sendTestEmail(data: { to: string; templateKey: string; payload?: Record<string, any> }) {
    const response = await apiClient.post("/admin/email/test", data)
    return response.DT
  },
}
