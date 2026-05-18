import { z } from "zod";
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema";
import { ContentStatus, HomepageSectionType } from "./enums";

export const HomepageItemSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  imageMediaId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
});

export const HomepageSectionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(HomepageSectionType).default("CUSTOM"),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  imageMediaId: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  status: z.nativeEnum(ContentStatus).default("PUBLISHED"),
  sortOrder: z.number().default(0),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  items: z.array(HomepageItemSchema).default([]),
});

export const CreateHomepageSectionPayloadSchema = HomepageSectionSchema.omit({
  id: true,
  items: true,
});

export const UpdateHomepageSectionPayloadSchema = CreateHomepageSectionPayloadSchema.partial();

export const CreateHomepageItemPayloadSchema = HomepageItemSchema.omit({
  id: true,
  sectionId: true, // Usually passed via URL or inferred
});

export const UpdateHomepageItemPayloadSchema = CreateHomepageItemPayloadSchema.partial();

export const HomepageSectionListResponseSchema = createPaginatedResponseSchema(HomepageSectionSchema);
export const HomepageSectionDetailResponseSchema = createResponseSchema(HomepageSectionSchema);

export type HomepageSection = z.infer<typeof HomepageSectionSchema>;
export type HomepageItem = z.infer<typeof HomepageItemSchema>;
export type CreateHomepageSectionPayload = z.infer<typeof CreateHomepageSectionPayloadSchema>;
export type UpdateHomepageSectionPayload = z.infer<typeof UpdateHomepageSectionPayloadSchema>;
export type CreateHomepageItemPayload = z.infer<typeof CreateHomepageItemPayloadSchema>;
export type UpdateHomepageItemPayload = z.infer<typeof UpdateHomepageItemPayloadSchema>;
