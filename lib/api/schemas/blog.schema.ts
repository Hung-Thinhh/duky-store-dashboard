import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { ContentStatus } from "./enums";
import { SeoSchema } from "./shared.schema";

export const BlogCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default("PUBLISHED"),
  sortOrder: z.number().default(0),
  seo: SeoSchema.optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  thumbnailMediaId: z.string().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default("DRAFT"),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  publishedAt: z.string().optional().nullable(),
  seo: SeoSchema.optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateBlogCategoryPayloadSchema = BlogCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBlogCategoryPayloadSchema = CreateBlogCategoryPayloadSchema.partial();

export const CreateBlogPostPayloadSchema = BlogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBlogPostPayloadSchema = CreateBlogPostPayloadSchema.partial();

export const BlogCategoryListResponseSchema = createPaginatedResponseSchema(BlogCategorySchema);
export const BlogCategoryDetailResponseSchema = createResponseSchema(BlogCategorySchema);

export const BlogPostListResponseSchema = createPaginatedResponseSchema(BlogPostSchema);
export const BlogPostDetailResponseSchema = createResponseSchema(BlogPostSchema);

export type BlogCategory = z.input<typeof BlogCategorySchema>;
export type BlogPost = z.input<typeof BlogPostSchema>;
export type CreateBlogCategoryPayload = z.input<typeof CreateBlogCategoryPayloadSchema>;
export type UpdateBlogCategoryPayload = z.input<typeof UpdateBlogCategoryPayloadSchema>;
export type CreateBlogPostPayload = z.input<typeof CreateBlogPostPayloadSchema>;
export type UpdateBlogPostPayload = z.input<typeof UpdateBlogPostPayloadSchema>;
