import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { OrderStatus, PaymentStatus, ShippingStatus, PaymentMethod } from "./enums";

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  variantId: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  variant: z.object({
    id: z.string(),
    name: z.string().optional().nullable(),
    sku: z.string(),
    sizeLabel: z.string().optional().nullable(),
    colorName: z.string().optional().nullable(),
    colorHex: z.string().optional().nullable(),
  }).optional().nullable(),
  sku: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const OrderSchema = z.object({
  id: z.string(),
  code: z.string(),
  customerId: z.string().optional().nullable(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  addressLine: z.string(),
  ward: z.string(),
  district: z.string(),
  province: z.string(),
  country: z.string().default("VN"),
  status: z.nativeEnum(OrderStatus).default("PENDING"),
  paymentStatus: z.nativeEnum(PaymentStatus).default("UNPAID"),
  paymentMethod: z.nativeEnum(PaymentMethod).default("COD"),
  shippingStatus: z.nativeEnum(ShippingStatus).default("NOT_SHIPPED"),
  subTotal: z.number(),
  shippingFee: z.number().default(0),
  discountAmount: z.number().default(0),
  totalAmount: z.number(),
  customerNote: z.string().optional().nullable(),
  shippingNote: z.string().optional().nullable(),
  shippingCarrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  transactionCode: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  cancelledAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  returnedAt: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  items: z.array(OrderItemSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateOrderItemPayloadSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  quantity: z.number().min(1),
});

export const CreateOrderPayloadSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  source: z.enum(["DIRECT", "ONLINE"]),
  addressLine: z.string().min(3),
  ward: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  shippingFee: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  customerNote: z.string().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  items: z.array(CreateOrderItemPayloadSchema).min(1),
});

export const UpdateOrderStatusPayloadSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
});

export const UpdatePaymentPayloadSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  transactionCode: z.string().optional(),
  note: z.string().optional(),
});

export const OrderListResponseSchema = createPaginatedResponseSchema(OrderSchema);
export const OrderDetailResponseSchema = createResponseSchema(OrderSchema);

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderPayload = z.infer<typeof CreateOrderPayloadSchema>;
export type UpdateOrderStatusPayload = z.infer<typeof UpdateOrderStatusPayloadSchema>;
export type UpdatePaymentPayload = z.infer<typeof UpdatePaymentPayloadSchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>;
