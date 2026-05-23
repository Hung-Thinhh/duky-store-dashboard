/** SEO category for grouping checks */
export type SeoCategory =
  | 'basic'
  | 'additional'
  | 'titleReadability'
  | 'contentReadability'

/** Color indicator for score */
export type ScoreColor = 'red' | 'orange' | 'green'

/** Input for SEO analysis */
export interface SeoInput {
  focusKeyword: string
  secondaryKeywords?: string[]
  seoTitle: string
  metaDescription: string
  slug: string
  htmlContent: string
  siteUrl: string
}

/** Result of a single SEO check */
export interface SeoCheckResult {
  id: string
  label: string
  passed: boolean
  category: SeoCategory
  description?: string
}

/** Category summary with pass/fail counts */
export interface CategorySummary {
  passed: number
  failed: number
  total: number
}

/** Full SEO score result */
export interface SeoScoreResult {
  score: number
  color: ScoreColor
  checks: SeoCheckResult[]
  categorySummary: Record<SeoCategory, CategorySummary>
}

/** Parsed content extracted from HTML */
export interface ParsedContent {
  text: string
  words: string[]
  headings: { level: number; text: string }[]
  images: { src: string; alt: string }[]
  links: { href: string; isExternal: boolean }[]
  paragraphs: string[]
  hasMedia: boolean
}
