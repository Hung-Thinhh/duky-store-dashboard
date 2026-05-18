import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { CategoryStatus } from "./enums";
import { SeoSchema } from "./shared.schema";

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.string().optional().nullable(),
  imageMediaId: z.string().optional().nullable(),
  imageMedia: z
    .object({
      id: z.string(),
      url: z.string(),
      secureUrl: z.string().nullable().optional(),
      altText: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
  status: z.nativeEnum(CategoryStatus).default("ACTIVE"),
  parentId: z.string().optional().nullable(),
  parent: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .optional()
    .nullable(),
  sortOrder: z.number().default(0),
  childrenCount: z.number().optional(),
  productsCount: z.number().optional(),
  seo: SeoSchema.optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateCategoryPayloadSchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCategoryPayloadSchema = CreateCategoryPayloadSchema.partial();

export const CategoryListResponseSchema = createPaginatedResponseSchema(CategorySchema);
export const CategoryDetailResponseSchema = createResponseSchema(CategorySchema);

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryFormInput = z.input<typeof CreateCategoryPayloadSchema>;
export type CreateCategoryPayload = z.infer<typeof CreateCategoryPayloadSchema>;
export type UpdateCategoryPayload = z.infer<typeof UpdateCategoryPayloadSchema>;
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;
export type CategoryDetailResponse = z.infer<typeof CategoryDetailResponseSchema>;
