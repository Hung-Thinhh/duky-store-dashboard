"use client"

import { IconCheck, IconX } from "@tabler/icons-react"
import type { SeoCheckResult } from "@/lib/seo/types"

interface SeoCheckItemProps {
  check: SeoCheckResult
}

export function SeoCheckItem({ check }: SeoCheckItemProps) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {check.passed ? (
        <IconCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
      ) : (
        <IconX className="mt-0.5 size-4 shrink-0 text-red-600" />
      )}
      <span className="text-sm text-stone-700">{check.label}</span>
    </div>
  )
}
