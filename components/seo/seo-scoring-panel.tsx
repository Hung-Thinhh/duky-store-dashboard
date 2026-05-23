"use client"

import type { SeoScoreResult } from "@/lib/seo/types"
import { SeoScoreIndicator } from "./seo-score-indicator"
import { SeoCheckSection } from "./seo-check-section"

interface SeoScoringPanelProps {
  result: SeoScoreResult | null
}

export function SeoScoringPanel({ result }: SeoScoringPanelProps) {
  const basicChecks = result?.checks.filter((c) => c.category === "basic") ?? []
  const additionalChecks =
    result?.checks.filter((c) => c.category === "additional") ?? []
  const titleReadabilityChecks =
    result?.checks.filter((c) => c.category === "titleReadability") ?? []
  const contentReadabilityChecks =
    result?.checks.filter((c) => c.category === "contentReadability") ?? []

  return (
    <div className="space-y-4">
      {!result && (
        <p className="text-sm text-stone-500">
          Nhap tu khoa SEO o sidebar de bat dau phan tich.
        </p>
      )}

      {result && (
        <>
          <div className="flex items-center gap-3">
            <SeoScoreIndicator score={result.score} color={result.color} />
            <span className="text-sm text-stone-600">Diem SEO</span>
          </div>

          <div className="space-y-2">
            <SeoCheckSection title="SEO co ban" checks={basicChecks} defaultOpen />
            <SeoCheckSection title="Bo sung" checks={additionalChecks} />
            <SeoCheckSection title="Tieu de" checks={titleReadabilityChecks} />
            <SeoCheckSection title="Noi dung" checks={contentReadabilityChecks} />
          </div>
        </>
      )}
    </div>
  )
}
