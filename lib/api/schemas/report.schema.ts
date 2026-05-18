import { z } from "zod"
import { createResponseSchema } from "./base.schema"

export const RevenuePointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
  orders: z.number(),
  channel: z.string().optional().nullable(),
})

export const OrderFunnelSchema = z.object({
  totalOrders: z.number(),
  completedOrders: z.number(),
  cancelledOrders: z.number(),
  pendingOrders: z.number(),
  completionRate: z.number(),
  cancelRate: z.number(),
})

export const ProductReportItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string().optional().nullable(),
  soldQuantity: z.number(),
  revenue: z.number(),
  stockOnHand: z.number().optional().nullable(),
  daysWithoutSale: z.number().optional().nullable(),
})

export const CustomerReportItemSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  orderCount: z.number(),
  totalSpent: z.number(),
  lastOrderAt: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
})

export const InventoryValuationItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string().optional().nullable(),
  stockOnHand: z.number(),
  unitCost: z.number(),
  retailValue: z.number(),
  inventoryValue: z.number(),
})

export const ReportsDashboardSchema = z.object({
  revenue: z.array(RevenuePointSchema).default([]),
  orderFunnel: OrderFunnelSchema,
  bestSellers: z.array(ProductReportItemSchema).default([]),
  slowMoving: z.array(ProductReportItemSchema).default([]),
  customers: z.array(CustomerReportItemSchema).default([]),
  inventory: z.array(InventoryValuationItemSchema).default([]),
})

export const ReportsDashboardResponseSchema = createResponseSchema(ReportsDashboardSchema)

export type RevenuePoint = z.infer<typeof RevenuePointSchema>
export type OrderFunnel = z.infer<typeof OrderFunnelSchema>
export type ProductReportItem = z.infer<typeof ProductReportItemSchema>
export type CustomerReportItem = z.infer<typeof CustomerReportItemSchema>
export type InventoryValuationItem = z.infer<typeof InventoryValuationItemSchema>
export type ReportsDashboard = z.infer<typeof ReportsDashboardSchema>
