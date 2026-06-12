import { z } from "zod"

// Base response structure based on FE-API-CONTRACT.md
export const BaseResponseSchema = z.object({
  EC: z.number(),
  EM: z.string(),
})

export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

// Generic response wrapper for data
export function createResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return BaseResponseSchema.extend({
    DT: dataSchema,
  })
}

// Generic response wrapper for paginated lists
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return BaseResponseSchema.extend({
    DT: z.object({
      data: z.array(itemSchema),
      pagination: PaginationSchema.optional(),
    }),
  })
}

// Error details schema
export const ErrorDetailsSchema = z.object({
  code: z.string().optional(),
  path: z.string().optional(),
  timestamp: z.string().optional(),
  details: z.array(z.string()).optional(),
})

export const ErrorResponseSchema = BaseResponseSchema.extend({
  DT: ErrorDetailsSchema.optional(),
})

// Re-export common types
export type BaseResponse = z.infer<typeof BaseResponseSchema>
export type Pagination = z.infer<typeof PaginationSchema>
export type ApiError = z.infer<typeof ErrorResponseSchema>
