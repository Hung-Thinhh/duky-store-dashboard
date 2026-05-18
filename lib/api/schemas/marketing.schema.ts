import { z } from "zod"
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema"

export const CouponSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string().optional().nullable(),
  discountType: z.enum(["FIXED", "PERCENT"]),
  discountValue: z.number(),
  minOrderValue: z.number().optional().nullable(),
  usageLimit: z.number().optional().nullable(),
  usedCount: z.number().default(0),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional().nullable(),
  discountType: z.enum(["FIXED", "PERCENT"]),
  discountValue: z.number(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "ENDED"]).default("DRAFT"),
})

export const ReviewSchema = z.object({
  id: z.string(),
  productName: z.string(),
  customerName: z.string(),
  rating: z.number(),
  content: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  reply: z.string().optional().nullable(),
  createdAt: z.string().optional(),
})

export const WishlistMetricSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  wishlistCount: z.number(),
  conversionCount: z.number().default(0),
  lastAddedAt: z.string().optional().nullable(),
})

export const NotificationTemplateSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  channel: z.enum(["EMAIL", "SMS", "IN_APP"]).default("EMAIL"),
  subject: z.string().optional().nullable(),
  body: z.string(),
  isActive: z.boolean().default(true),
})

export const EmailLogSchema = z.object({
  id: z.string(),
  to: z.string(),
  subject: z.string(),
  status: z.enum(["QUEUED", "SENT", "FAILED"]).default("QUEUED"),
  templateKey: z.string().optional().nullable(),
  error: z.string().optional().nullable(),
  createdAt: z.string().optional(),
})

export const CouponListResponseSchema = createPaginatedResponseSchema(CouponSchema)
export const CouponDetailResponseSchema = createResponseSchema(CouponSchema)
export const CampaignListResponseSchema = createPaginatedResponseSchema(CampaignSchema)
export const CampaignDetailResponseSchema = createResponseSchema(CampaignSchema)
export const ReviewListResponseSchema = createPaginatedResponseSchema(ReviewSchema)
export const WishlistListResponseSchema = createPaginatedResponseSchema(WishlistMetricSchema)
export const NotificationTemplateListResponseSchema = createPaginatedResponseSchema(NotificationTemplateSchema)
export const NotificationTemplateDetailResponseSchema = createResponseSchema(NotificationTemplateSchema)
export const EmailLogListResponseSchema = createPaginatedResponseSchema(EmailLogSchema)

export type Coupon = z.infer<typeof CouponSchema>
export type Campaign = z.infer<typeof CampaignSchema>
export type Review = z.infer<typeof ReviewSchema>
export type WishlistMetric = z.infer<typeof WishlistMetricSchema>
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>
export type EmailLog = z.infer<typeof EmailLogSchema>
