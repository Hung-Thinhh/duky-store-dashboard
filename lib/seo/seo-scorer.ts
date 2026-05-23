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

const SOFT_BONUS_CHECK_IDS = new Set([
  'secondary-keywords-in-content',
  'secondary-keywords-in-subheadings',
])

const SOFT_BONUS_POINTS = 2

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
    if (SOFT_BONUS_CHECK_IDS.has(check.id)) {
      continue
    }

    const weight = CATEGORY_WEIGHTS[check.category]
    totalPoints += weight
    if (check.passed) {
      earnedPoints += weight
    }
  }

  // Normalize to 0-100
  const baseScore = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100)
  const softBonus = checks
    .filter((check) => SOFT_BONUS_CHECK_IDS.has(check.id) && check.passed)
    .reduce((total) => total + SOFT_BONUS_POINTS, 0)
  const score = Math.min(100, baseScore + softBonus)
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
