import type {
  SeoInput,
  SeoScoreResult,
  SeoCategory,
  ScoreColor,
  CategorySummary,
  SeoCheckResult,
} from './types'
import { runAllChecks } from './seo-checks'

/**
 * Weight configuration per category.
 * Basic SEO: 10 points each (6 checks = 60 total)
 * Additional: 5 points each (6 checks = 30 total)
 * Title Readability: 2.5 points each (2 checks = 5 total)
 * Content Readability: 1.25 points each (4 checks = 5 total)
 * Grand total: 100 points
 */
const CATEGORY_WEIGHTS: Record<SeoCategory, number> = {
  basic: 10,
  additional: 5,
  titleReadability: 2.5,
  contentReadability: 1.25,
}

/**
 * Calculate the total SEO score from check results.
 * Each check earns its category weight if passed.
 * Score is normalized to 0-100.
 */
export function calculateSeoScore(input: SeoInput): SeoScoreResult {
  const checks = runAllChecks(input)

  // Calculate earned points
  let earnedPoints = 0
  let totalPoints = 0

  for (const check of checks) {
    const weight = CATEGORY_WEIGHTS[check.category]
    totalPoints += weight
    if (check.passed) {
      earnedPoints += weight
    }
  }

  // Normalize to 0-100
  const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100)
  const color = getScoreColor(score)

  // Build category summary
  const categorySummary = buildCategorySummary(checks)

  return {
    score,
    color,
    checks,
    categorySummary,
  }
}

/**
 * Determine the color indicator based on score.
 * 0-50: red, 51-80: orange, 81-100: green
 */
export function getScoreColor(score: number): ScoreColor {
  if (score <= 50) return 'red'
  if (score <= 80) return 'orange'
  return 'green'
}

/**
 * Build a summary of pass/fail counts per category.
 */
function buildCategorySummary(
  checks: SeoCheckResult[]
): Record<SeoCategory, CategorySummary> {
  const categories: SeoCategory[] = [
    'basic',
    'additional',
    'titleReadability',
    'contentReadability',
  ]

  const summary = {} as Record<SeoCategory, CategorySummary>

  for (const category of categories) {
    const categoryChecks = checks.filter((c) => c.category === category)
    const passed = categoryChecks.filter((c) => c.passed).length
    const failed = categoryChecks.filter((c) => !c.passed).length
    summary[category] = {
      passed,
      failed,
      total: categoryChecks.length,
    }
  }

  return summary
}
