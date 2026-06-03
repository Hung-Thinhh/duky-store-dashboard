import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { SeoSchema } from "./shared.schema";
import { ProductAiTask, type ProductAiTaskType } from "./enums";

export { ProductAiTask, type ProductAiTaskType };

export const ProductTypeSchema = z.enum(["SIMPLE", "GROUPED", "EXTERNAL", "VARIABLE"]);
export const ProductStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "HIDDEN",
  "SOLD_OUT",
  "DISCONTINUED",
]);
export const ProductCatalogVisibilitySchema = z.enum(["VISIBLE", "CATALOG", "SEARCH", "HIDDEN"]);

// --- Shared sub-schemas matching API response ---

export const ProductMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  secureUrl: z.string().nullable().optional(),
  fileName: z.string(),
  altText: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

export const ProductPrimaryImageSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  altText: z.string().nullable().optional(),
  sortOrder: z.number(),
  isPrimary: z.boolean(),
  media: ProductMediaSchema,
});

export const ProductCategorySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.string().optional(),
});

export const ProductTagSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.string().optional(),
});

export const ProductBrandSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoMediaId: z.string().nullable().optional(),
});

export const ProductShippingSchema = z.object({
  id: z.string().optional(),
  weight: z.number().nullable().optional(),
  length: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  shippingClass: z.string().nullable().optional(),
});

export const ProductInventorySchema = z.object({
  id: z.string().optional(),
  quantity: z.number().optional(),
  reservedQuantity: z.number().optional(),
  availableQuantity: z.number().optional(),
  lowStockThreshold: z.number().optional(),
  soldOut: z.boolean().optional(),
  isLowStock: z.boolean().optional(),
  note: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ProductStockSummarySchema = z.object({
  quantity: z.number(),
  reservedQuantity: z.number(),
  availableQuantity: z.number(),
  lowStockThreshold: z.number().optional(),
  soldOut: z.boolean(),
  isLowStock: z.boolean(),
});

export const ProductListVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string().nullable().optional(),
  sku: z.string(),
  sizeLabel: z.string().nullable().optional(),
  sizeGender: z.string().nullable().optional(),
  colorName: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  salePrice: z.number().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().optional(),
  inventory: ProductInventorySchema.nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ProductRelationsSchema = z.object({
  relatedProductIds: z.array(z.string()).default([]),
  upsellIds: z.array(z.string()).default([]),
  crossSellIds: z.array(z.string()).default([]),
  relatedProducts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    sku: z.string().nullable().optional(),
    relationType: z.enum(["RELATED", "UPSELL", "CROSS_SELL"]),
    sortOrder: z.number(),
  })).default([]),
});

export const ProductImagePayloadSchema = z.object({
  mediaId: z.string(),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isPrimary: z.boolean().optional(),
});

// --- Product List Item (GET /admin/products) ---

export const ProductListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sku: z.string().nullable(),

  type: ProductTypeSchema,
  status: ProductStatusSchema,
  catalogVisibility: ProductCatalogVisibilitySchema.optional().default("VISIBLE"),

  originalPrice: z.number(),
  salePrice: z.number().nullable(),
  contactForPrice: z.boolean(),

  thumbnailMediaId: z.string().nullable().optional(),
  thumbnailMedia: ProductMediaSchema.nullable().optional(),
  image: ProductPrimaryImageSchema.nullable().optional(),

  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isNewArrival: z.boolean(),
  variantsCount: z.number().optional().default(0),
  inventory: ProductInventorySchema.nullable().optional(),
  stockSummary: ProductStockSummarySchema.nullable().optional(),
  variants: z.array(ProductListVariantSchema).optional().default([]),

  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// --- Create / Update payloads (for forms) ---

export const CreateProductPayloadSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  sku: z.string().optional().nullable(),
  type: ProductTypeSchema.default("SIMPLE"),
  status: ProductStatusSchema.default("DRAFT"),
  catalogVisibility: ProductCatalogVisibilitySchema.default("VISIBLE"),
  originalPrice: z.number().min(0, "Giá gốc không hợp lệ").optional().nullable(),
  salePrice: z.number().min(0, "Giá khuyến mãi không hợp lệ").optional().nullable(),
  contactForPrice: z.boolean().default(false),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  additionalInfo: z.record(z.string(), z.unknown()).optional().nullable(),
  sizeGuide: z.record(z.string(), z.unknown()).optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  externalButtonText: z.string().optional().nullable(),
  thumbnailMediaId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  brandIds: z.array(z.string()).default([]),
  images: z.array(ProductImagePayloadSchema).default([]),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  soldIndividually: z.boolean().default(false),
  purchaseNote: z.string().optional().nullable(),
  menuOrder: z.number().min(0).default(0),
  enableReviews: z.boolean().default(true),
  shipping: ProductShippingSchema.optional().nullable(),
  inventory: ProductInventorySchema.optional().nullable(),
  relations: ProductRelationsSchema.omit({ relatedProducts: true }).optional().nullable(),
  seo: SeoSchema.optional().nullable(),
});

export const UpdateProductPayloadSchema = CreateProductPayloadSchema.partial();

// --- API Response wrappers ---

export const ProductListResponseSchema = createPaginatedResponseSchema(ProductListItemSchema);
export const ProductDetailItemSchema = ProductListItemSchema.extend({
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  additionalInfo: z.unknown().optional().nullable(),
  sizeGuide: z.unknown().optional().nullable(),
  categories: z.array(ProductCategorySummarySchema).default([]),
  tags: z.array(ProductTagSummarySchema).default([]),
  brands: z.array(ProductBrandSummarySchema).default([]),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  brandIds: z.array(z.string()).default([]),
  images: z.array(ProductPrimaryImageSchema).default([]),
  externalUrl: z.string().optional().nullable(),
  externalButtonText: z.string().optional().nullable(),
  soldIndividually: z.boolean().optional(),
  purchaseNote: z.string().optional().nullable(),
  menuOrder: z.number().optional(),
  enableReviews: z.boolean().optional(),
  shipping: ProductShippingSchema.optional().nullable(),
  inventory: ProductInventorySchema.optional().nullable(),
  relations: ProductRelationsSchema.optional(),
  seo: SeoSchema.optional().nullable(),
  variantsCount: z.number().optional(),
  reviewsCount: z.number().optional(),
});

export const ProductDetailResponseSchema = createResponseSchema(ProductDetailItemSchema);

export const ProductAiAssistPayloadSchema = z.object({
  task: z.nativeEnum(ProductAiTask),
  name: z.string().max(220).optional(),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  focusKeyword: z.string().optional(),
  productType: z.string().optional(),
  tone: z.string().optional(),
  categories: z.array(z.object({ title: z.string(), slug: z.string().optional(), url: z.string().optional() })).optional(),
  tags: z.array(z.object({ title: z.string(), slug: z.string().optional(), url: z.string().optional() })).optional(),
  brands: z.array(z.object({ title: z.string(), slug: z.string().optional(), url: z.string().optional() })).optional(),
  originalPrice: z.number().optional().nullable(),
  salePrice: z.number().optional().nullable(),
  stockQuantity: z.number().optional().nullable(),
  variants: z.array(z.any()).optional(),
  images: z.array(z.string()).optional(),
  extraContext: z.record(z.string(), z.any()).optional(),
})

export const ProductAiAssistResultSchema = z.object({
  summary: z.string(),
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  seo: z.object({
    metaTitle: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    focusKeyword: z.string().nullable().optional(),
  }).optional().nullable(),
  improvements: z.array(z.string()).optional().default([]),
})

export const ProductAiAssistResponseSchema = createResponseSchema(ProductAiAssistResultSchema)

// --- TypeScript types ---

export type ProductMedia = z.infer<typeof ProductMediaSchema>;
export type ProductPrimaryImage = z.infer<typeof ProductPrimaryImageSchema>;
export type ProductListVariant = z.infer<typeof ProductListVariantSchema>;
export type ProductListItem = z.infer<typeof ProductListItemSchema>;
export type ProductDetailItem = z.infer<typeof ProductDetailItemSchema>;
export type CreateProductPayload = z.infer<typeof CreateProductPayloadSchema>;
export type UpdateProductPayload = z.infer<typeof UpdateProductPayloadSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;
export type ProductAiAssistPayload = z.infer<typeof ProductAiAssistPayloadSchema>;
export type ProductAiAssistResult = z.infer<typeof ProductAiAssistResultSchema>;
