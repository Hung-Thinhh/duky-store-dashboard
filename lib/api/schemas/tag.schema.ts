import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { TagType } from "./enums";

export const TagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên tag là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  type: z.nativeEnum(TagType).default("BOTH"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateTagPayloadSchema = TagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateTagPayloadSchema = CreateTagPayloadSchema.partial();

export const TagListResponseSchema = createPaginatedResponseSchema(TagSchema);
export const TagDetailResponseSchema = createResponseSchema(TagSchema);

export type Tag = z.input<typeof TagSchema>;
export type CreateTagPayload = z.input<typeof CreateTagPayloadSchema>;
export type UpdateTagPayload = z.input<typeof UpdateTagPayloadSchema>;
export type TagListResponse = z.infer<typeof TagListResponseSchema>;
export type TagDetailResponse = z.infer<typeof TagDetailResponseSchema>;
