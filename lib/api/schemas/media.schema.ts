import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";

export const MediaSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
  secureUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  originalName: z.string().optional().nullable(),
  mimeType: z.string(),
  size: z.number().optional().nullable(), // in bytes
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  altText: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  folder: z.string().optional().nullable(),
  createdAt: z.string().optional(),
}).transform((media) => ({
  ...media,
  filename: media.originalName ?? media.fileName ?? "media-file",
}));

export const MediaListResponseSchema = createPaginatedResponseSchema(MediaSchema);
export const MediaDetailResponseSchema = createResponseSchema(MediaSchema);

export type Media = z.infer<typeof MediaSchema>;
export type MediaListResponse = z.infer<typeof MediaListResponseSchema>;
export type MediaDetailResponse = z.infer<typeof MediaDetailResponseSchema>;
