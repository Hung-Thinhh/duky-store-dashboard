import { z } from "zod";

export const SeoSchema = z.object({
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  ogImageMediaId: z.string().optional().nullable(),
  twitterTitle: z.string().optional().nullable(),
  twitterDescription: z.string().optional().nullable(),
  focusKeyword: z.string().optional().nullable(),
  seoScore: z.number().int().min(0).max(100).optional().nullable(),
  analysisJson: z.unknown().optional().nullable(),
  schemaType: z.string().optional().nullable(),
  schemaJson: z.record(z.string(), z.unknown()).optional().nullable(),
  breadcrumbJson: z.record(z.string(), z.unknown()).optional().nullable(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
});

export type SeoPayload = z.infer<typeof SeoSchema>;
