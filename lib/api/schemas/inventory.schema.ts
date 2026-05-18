import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";

export const InventorySchema = z.object({
  id: z.string(),
  productId: z.string().nullable(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
  }).optional().nullable(),
  variantId: z.string().optional().nullable(),
  variant: z.object({
    id: z.string(),
    name: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    sizeLabel: z.string().optional().nullable(),
    sizeGender: z.string().optional().nullable(),
    colorName: z.string().optional().nullable(),
    colorHex: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    product: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string().optional().nullable(),
      sku: z.string().optional().nullable(),
    }).optional().nullable(),
  }).optional().nullable(),
  quantity: z.number().default(0),
  reservedQuantity: z.number().default(0),
  availableQuantity: z.number().default(0),
  lowStockThreshold: z.number().default(0),
  isLowStock: z.boolean().default(false),
  soldOut: z.boolean().default(false),
  logsCount: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).transform((inventory) => ({
  ...inventory,
  productName: inventory.product?.name ?? inventory.variant?.product?.name ?? "Không rõ sản phẩm",
  variantName: inventory.variant?.name ?? ([inventory.variant?.sizeLabel, inventory.variant?.colorName].filter(Boolean).join(" - ") || null),
  sku: inventory.variant?.sku ?? inventory.product?.sku ?? inventory.variant?.product?.sku ?? "",
  stock: inventory.quantity,
  threshold: inventory.lowStockThreshold,
}));

export const InventoryLogSchema = z.object({
  id: z.string(),
  inventoryId: z.string(),
  changeType: z.string(),
  quantityBefore: z.number(),
  quantityChange: z.number(),
  quantityAfter: z.number(),
  note: z.string().optional().nullable(),
  createdAt: z.string(),
  actorId: z.string().optional().nullable(),
});

const InventorySignalSchema = z.object({
  id: z.string(),
  productName: z.string(),
  variantName: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number(),
  threshold: z.number(),
  reservedQuantity: z.number(),
  availableQuantity: z.number(),
  updatedAt: z.string().optional(),
});

export const InventoryAnalyticsSchema = z.object({
  summary: z.object({
    totalSkus: z.number(),
    totalQuantity: z.number(),
    reservedQuantity: z.number(),
    availableQuantity: z.number(),
    soldOutCount: z.number(),
    lowStockCount: z.number(),
    healthyCount: z.number(),
    stockHealthRate: z.number(),
  }),
  stockHealth: z.array(z.object({
    label: z.string(),
    value: z.number(),
    color: z.string(),
  })),
  topLowStock: z.array(InventorySignalSchema),
  topHighStock: z.array(InventorySignalSchema),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    skus: z.number(),
    lowStock: z.number(),
  })),
  brands: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    skus: z.number(),
    lowStock: z.number(),
  })),
  movements: z.array(z.object({
    date: z.string(),
    import: z.number(),
    export: z.number(),
    adjust: z.number(),
  })),
});

export const AdjustInventoryPayloadSchema = z.object({
  quantityChange: z.number(),
  changeType: z.enum(["IMPORT", "ADJUST", "ORDER_DECREASE", "ORDER_RESTORE", "RETURN_RESTORE"]).optional(),
  note: z.string().optional(),
});

export const InventoryListResponseSchema = createPaginatedResponseSchema(InventorySchema);
export const InventoryDetailResponseSchema = createResponseSchema(InventorySchema);
export const InventoryLogListResponseSchema = createPaginatedResponseSchema(InventoryLogSchema);
export const InventoryAnalyticsResponseSchema = createResponseSchema(InventoryAnalyticsSchema);

export type Inventory = z.infer<typeof InventorySchema>;
export type InventoryLog = z.infer<typeof InventoryLogSchema>;
export type InventoryAnalytics = z.infer<typeof InventoryAnalyticsSchema>;
export type AdjustInventoryPayload = z.infer<typeof AdjustInventoryPayloadSchema>;
export type InventoryListResponse = z.infer<typeof InventoryListResponseSchema>;
export type InventoryDetailResponse = z.infer<typeof InventoryDetailResponseSchema>;
export type InventoryLogListResponse = z.infer<typeof InventoryLogListResponseSchema>;
export type InventoryAnalyticsResponse = z.infer<typeof InventoryAnalyticsResponseSchema>;

