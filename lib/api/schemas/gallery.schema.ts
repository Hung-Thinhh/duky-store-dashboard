import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";

export const GallerySchema = z.object({
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
  forMale: z.boolean().optional().nullable(),
  createdAt: z.string().optional(),
}).transform((media) => ({
  ...media,
  filename: media.originalName ?? media.fileName ?? "gallery-file",
}));

export const GalleryListResponseSchema = createPaginatedResponseSchema(GallerySchema);
export const GalleryDetailResponseSchema = createResponseSchema(GallerySchema);

export type GalleryImage = z.infer<typeof GallerySchema>;
export type GalleryListResponse = z.infer<typeof GalleryListResponseSchema>;
export type GalleryDetailResponse = z.infer<typeof GalleryDetailResponseSchema>;
