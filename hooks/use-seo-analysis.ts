"use client"

import * as React from "react"
import type { SeoInput, SeoScoreResult } from "@/lib/seo/types"
import { calculateSeoScore } from "@/lib/seo/seo-scorer"

const DEBOUNCE_MS = 300

/**
 * Hook quản lý SEO analysis với debounce.
 * Trả về kết quả phân tích cập nhật real-time khi input thay đổi.
 */
export function useSeoAnalysis(input: SeoInput | null): SeoScoreResult | null {
  const [result, setResult] = React.useState<SeoScoreResult | null>(null)

  React.useEffect(() => {
    if (!input || !input.focusKeyword.trim()) {
      setResult(null)
      return
    }

    const timer = setTimeout(() => {
      const analysis = calculateSeoScore(input)
      setResult(analysis)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    input?.focusKeyword,
    input?.secondaryKeywords?.join("|"),
    input?.seoTitle,
    input?.metaDescription,
    input?.slug,
    input?.htmlContent,
    input?.siteUrl,
  ])

  return result
}
