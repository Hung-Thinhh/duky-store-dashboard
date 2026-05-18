import { z } from "zod"
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema"

export const ProductAttributeTermSchema = z.object({
  id: z.string(),
  attributeId: z.string(),
  name: z.string(),
  slug: z.string(),
  value: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  sortOrder: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const ProductAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(["SIZE", "COLOR", "MATERIAL", "STYLE", "OTHER"]).default("OTHER"),
  sortBy: z.string().default("custom"),
  swatch: z.string().default("default"),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().default(0),
  terms: z.array(ProductAttributeTermSchema).default([]),
  termsCount: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const ProductAttributePayloadSchema = ProductAttributeSchema.pick({
  name: true,
  slug: true,
  type: true,
  sortBy: true,
  swatch: true,
  isVisible: true,
  sortOrder: true,
})

export const ProductAttributeTermPayloadSchema = ProductAttributeTermSchema.pick({
  name: true,
  slug: true,
  value: true,
  metadata: true,
  sortOrder: true,
})

export const ProductAttributeListResponseSchema = createPaginatedResponseSchema(ProductAttributeSchema)
export const ProductAttributeDetailResponseSchema = createResponseSchema(ProductAttributeSchema)
export const ProductAttributeTermDetailResponseSchema = createResponseSchema(ProductAttributeTermSchema)

export type ProductAttribute = z.infer<typeof ProductAttributeSchema>
export type ProductAttributeTerm = z.infer<typeof ProductAttributeTermSchema>
export type ProductAttributePayload = z.infer<typeof ProductAttributePayloadSchema>
export type ProductAttributeTermPayload = z.infer<typeof ProductAttributeTermPayloadSchema>
