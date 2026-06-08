import { z } from "zod"
import { createResponseSchema } from "./base.schema"

export const GscSeveritySchema = z.enum(["ok", "info", "warning", "error"])

export const GscGroupSchema = z.object({
  action: z.string(),
  key: z.string(),
  label: z.string(),
  severity: GscSeveritySchema,
  total: z.number(),
})

export const GscGoogleStatusSchema = z.object({
  connected: z.boolean(),
  credentialError: z.string().nullable().optional(),
  credentialSource: z.string().nullable().optional(),
  keyFileConfigured: z.boolean(),
  keyFileExists: z.boolean(),
  serviceAccountEmail: z.string().nullable().optional(),
  siteUrl: z.string(),
})

export const GscOverviewSchema = z.object({
  generatedAt: z.string(),
  google: GscGoogleStatusSchema,
  counts: z.object({
    activeCategories: z.number(),
    activeRedirects: z.number(),
    configuredSitemapEntries: z.number(),
    expectedSitemapUrls: z.number(),
    mediaMissingAltText: z.number(),
    noIndexEntities: z.number(),
    productsMissingMetaDescription: z.number(),
    publishedBlogPosts: z.number(),
    publishedProducts: z.number(),
    relativeCanonicals: z.number(),
  }),
  groups: z.array(GscGroupSchema),
  samples: z.record(z.string(), z.array(z.unknown())).optional(),
})

export const GscUrlInputSchema = z.object({
  reason: z.string().optional(),
  url: z.string(),
})

export const GscCandidateUrlSchema = z.object({
  entityId: z.string().nullable().optional(),
  entityTitle: z.string().nullable().optional(),
  entityType: z.string().nullable().optional(),
  path: z.string(),
  reason: z.string().optional(),
  redirectId: z.string().nullable().optional(),
  sourceLabels: z.array(z.string()),
  sources: z.array(z.string()),
  targetPath: z.string().nullable().optional(),
  url: z.string(),
})

export const GscCandidateSourceSummarySchema = z.object({
  key: z.string(),
  label: z.string(),
  total: z.number(),
})

export const GscCandidatesResultSchema = z.object({
  generatedAt: z.string(),
  includeLiveSitemap: z.boolean(),
  limit: z.number(),
  sources: z.array(GscCandidateSourceSummarySchema),
  total: z.number(),
  totalBeforeLimit: z.number(),
  urls: z.array(GscCandidateUrlSchema),
  warnings: z.array(z.string()),
})

export const GscInspectionResultSchema = z
  .object({
    coverageState: z.string().nullable().optional(),
    errorCode: z.number().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    errorStatus: z.string().nullable().optional(),
    errorStatusCode: z.number().nullable().optional(),
    googleCanonical: z.string().nullable().optional(),
    indexingState: z.string().nullable().optional(),
    inspectionUrl: z.string(),
    lastCrawlTime: z.string().nullable().optional(),
    mobileUsabilityVerdict: z.string().nullable().optional(),
    pageFetchState: z.string().nullable().optional(),
    richResultsVerdict: z.string().nullable().optional(),
    robotsTxtState: z.string().nullable().optional(),
    userCanonical: z.string().nullable().optional(),
    verdict: z.string().nullable().optional(),
  })
  .passthrough()

export const GscIssueSchema = z.object({
  action: z.string(),
  key: z.string(),
  label: z.string(),
  severity: GscSeveritySchema,
})

export const GscAnalyzedUrlSchema = z.object({
  canonicalPath: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  entityExists: z.boolean(),
  entityId: z.string().nullable(),
  entityTitle: z.string().nullable(),
  entityType: z.string(),
  gscReason: z.string().nullable(),
  inSitemap: z.boolean(),
  issues: z.array(GscIssueSchema),
  path: z.string(),
  primaryIssue: GscIssueSchema,
  redirect: z
    .object({
      id: z.string(),
      sourcePath: z.string(),
      statusCode: z.number(),
      targetEntityId: z.string().nullable().optional(),
      targetEntityTitle: z.string().nullable().optional(),
      targetEntityType: z.string().nullable().optional(),
      targetExists: z.boolean().optional(),
      targetPath: z.string(),
    })
    .nullable(),
  urlMapping: z
    .object({
      newUrl: z.string(),
      oldUrl: z.string(),
      source: z.string().nullable().optional(),
      targetEntityId: z.string().nullable().optional(),
      targetEntityTitle: z.string().nullable().optional(),
      targetEntityType: z.string().nullable().optional(),
      targetExists: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  inspectionResult: GscInspectionResultSchema.nullable().optional(),
  url: z.string(),
})

export const GscAnalyzeResultSchema = z.object({
  generatedAt: z.string(),
  groups: z.array(GscGroupSchema),
  total: z.number(),
  urls: z.array(GscAnalyzedUrlSchema),
})


export const GscInspectResultSchema = z.object({
  generatedAt: z.string(),
  results: z.array(GscInspectionResultSchema),
  siteUrl: z.string(),
  summary: z.record(z.string(), z.number()),
  total: z.number(),
})

export const GscOverviewResponseSchema = createResponseSchema(GscOverviewSchema)
export const GscCandidatesResponseSchema = createResponseSchema(
  GscCandidatesResultSchema
)
export const GscAnalyzeResponseSchema = createResponseSchema(
  GscAnalyzeResultSchema
)
export const GscInspectResponseSchema = createResponseSchema(
  GscInspectResultSchema
)

export const GscSubmitIndexingResponseSchema = createResponseSchema(
  z.object({
    success: z.boolean(),
    url: z.string(),
    type: z.string(),
    notificationMetadata: z.any().optional(),
  })
)

export type GscOverview = z.infer<typeof GscOverviewSchema>
export type GscUrlInput = z.infer<typeof GscUrlInputSchema>
export type GscCandidatesResult = z.infer<typeof GscCandidatesResultSchema>
export type GscAnalyzeResult = z.infer<typeof GscAnalyzeResultSchema>
export type GscAnalyzedUrl = z.infer<typeof GscAnalyzedUrlSchema>
export type GscInspectResult = z.infer<typeof GscInspectResultSchema>
export type GscSubmitIndexingResult = z.infer<typeof GscSubmitIndexingResponseSchema>

