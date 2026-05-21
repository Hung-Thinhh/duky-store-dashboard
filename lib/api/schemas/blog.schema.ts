import { z } from "zod"

import {
  createPaginatedResponseSchema,
  createResponseSchema,
} from "./base.schema"
import { ContentStatus, TagType } from "./enums"
import { SeoSchema } from "./shared.schema"

export const BlogMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  secureUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  altText: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
})

export const BlogReusableBlockTypeSchema = z.enum([
  "TITLE",
  "CONTENT",
  "FOOTER",
  "CUSTOM",
])

export const BlogReusableBlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: BlogReusableBlockTypeSchema.default("CUSTOM"),
  description: z.string().optional().nullable(),
  html: z.string(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const BlogAuthorSchema = z.object({
  id: z.string(),
  fullName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
})

export const BlogCategorySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.nativeEnum(ContentStatus).optional(),
})

export const BlogTagSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.nativeEnum(TagType).optional(),
})

export const BlogCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  parent: BlogCategorySummarySchema.pick({
    id: true,
    name: true,
    slug: true,
  })
    .optional()
    .nullable(),
  status: z.nativeEnum(ContentStatus).default("PUBLISHED"),
  sortOrder: z.number().default(0),
  childrenCount: z.number().optional(),
  postsCount: z.number().optional(),
  seo: SeoSchema.optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  coverMediaId: z.string().optional().nullable(),
  coverMedia: BlogMediaSchema.optional().nullable(),
  status: z.nativeEnum(ContentStatus).default("DRAFT"),
  authorId: z.string().optional().nullable(),
  author: BlogAuthorSchema.optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  categories: z.array(BlogCategorySummarySchema).default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  tags: z.array(BlogTagSummarySchema).default([]),
  tagIds: z.array(z.string()).optional().default([]),
  seo: SeoSchema.optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const CreateBlogCategoryPayloadSchema = z.object({
  name: z.string().min(2, "Tên danh mục là bắt buộc"),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().min(0).optional().default(0),
  status: z.nativeEnum(ContentStatus).optional().default("PUBLISHED"),
  seo: SeoSchema.optional().nullable(),
})

export const UpdateBlogCategoryPayloadSchema =
  CreateBlogCategoryPayloadSchema.partial()

export const CreateBlogPostPayloadSchema = z.object({
  title: z.string().min(3, "Tiêu đề cần tối thiểu 3 ký tự"),
  slug: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, "Nội dung cần tối thiểu 10 ký tự"),
  coverMediaId: z.string().optional().nullable(),
  status: z.nativeEnum(ContentStatus).optional().default("DRAFT"),
  categoryIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  seo: SeoSchema.optional().nullable(),
})

export const UpdateBlogPostPayloadSchema =
  CreateBlogPostPayloadSchema.partial()

export const CreateBlogReusableBlockPayloadSchema = z.object({
  name: z.string().min(2, "Tên block là bắt buộc"),
  slug: z.string().optional().nullable(),
  type: BlogReusableBlockTypeSchema.optional().default("CUSTOM"),
  description: z.string().optional().nullable(),
  html: z.string().min(1, "Nội dung block là bắt buộc"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().min(0).optional().default(0),
})

export const UpdateBlogReusableBlockPayloadSchema =
  CreateBlogReusableBlockPayloadSchema.partial()

export const BlogCategoryListResponseSchema =
  createPaginatedResponseSchema(BlogCategorySchema)
export const BlogCategoryDetailResponseSchema =
  createResponseSchema(BlogCategorySchema)

export const BlogPostListResponseSchema =
  createPaginatedResponseSchema(BlogPostSchema)
export const BlogPostDetailResponseSchema = createResponseSchema(BlogPostSchema)
export const BlogReusableBlockListResponseSchema =
  createPaginatedResponseSchema(BlogReusableBlockSchema)
export const BlogReusableBlockDetailResponseSchema =
  createResponseSchema(BlogReusableBlockSchema)

export type BlogMedia = z.infer<typeof BlogMediaSchema>
export type BlogAuthor = z.infer<typeof BlogAuthorSchema>
export type BlogReusableBlockType = z.infer<typeof BlogReusableBlockTypeSchema>
export type BlogReusableBlock = z.infer<typeof BlogReusableBlockSchema>
export type BlogCategorySummary = z.infer<typeof BlogCategorySummarySchema>
export type BlogTagSummary = z.infer<typeof BlogTagSummarySchema>
export type BlogCategory = z.infer<typeof BlogCategorySchema>
export type BlogPost = z.infer<typeof BlogPostSchema>
export type CreateBlogCategoryPayload = z.input<
  typeof CreateBlogCategoryPayloadSchema
>
export type UpdateBlogCategoryPayload = z.input<
  typeof UpdateBlogCategoryPayloadSchema
>
export type CreateBlogPostPayload = z.input<
  typeof CreateBlogPostPayloadSchema
>
export type UpdateBlogPostPayload = z.input<
  typeof UpdateBlogPostPayloadSchema
>
export type CreateBlogReusableBlockPayload = z.input<
  typeof CreateBlogReusableBlockPayloadSchema
>
export type UpdateBlogReusableBlockPayload = z.input<
  typeof UpdateBlogReusableBlockPayloadSchema
>
export type BlogCategoryListResponse = z.infer<
  typeof BlogCategoryListResponseSchema
>
export type BlogPostListResponse = z.infer<typeof BlogPostListResponseSchema>
