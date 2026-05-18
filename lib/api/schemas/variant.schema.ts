import { z } from "zod"
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema"

export const ProductVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional().nullable(),
  }).optional().nullable(),
  name: z.string().optional().nullable(),
  sku: z.string(),
  sizeLabel: z.string().optional().nullable(),
  sizeGender: z.string().optional().nullable(),
  colorName: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  salePrice: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  inventory: z.any().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const CreateProductVariantPayloadSchema = ProductVariantSchema.omit({
  id: true,
  product: true,
  inventory: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateProductVariantPayloadSchema = CreateProductVariantPayloadSchema.partial()

export const ProductVariantListResponseSchema = createPaginatedResponseSchema(ProductVariantSchema)
export const ProductVariantByProductResponseSchema = createResponseSchema(z.object({
  data: z.array(ProductVariantSchema),
}))
export const ProductVariantDetailResponseSchema = createResponseSchema(ProductVariantSchema)

export type ProductVariant = z.infer<typeof ProductVariantSchema>
export type CreateProductVariantPayload = z.infer<typeof CreateProductVariantPayloadSchema>
export type UpdateProductVariantPayload = z.infer<typeof UpdateProductVariantPayloadSchema>
