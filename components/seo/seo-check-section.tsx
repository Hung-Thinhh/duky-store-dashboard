"use client"

import * as React from "react"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import type { SeoCheckResult } from "@/lib/seo/types"
import { SeoCheckItem } from "./seo-check-item"

interface SeoCheckSectionProps {
  title: string
  checks: SeoCheckResult[]
  defaultOpen?: boolean
}

export function SeoCheckSection({
  title,
  checks,
  defaultOpen = false,
}: SeoCheckSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const failedCount = checks.filter((c) => !c.passed).length

  return (
    <div className="rounded-xl border border-stone-200">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-800">{title}</span>
          {failedCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-100 text-[11px] font-semibold text-red-700">
              {failedCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <IconChevronUp className="size-4 text-stone-400" />
        ) : (
          <IconChevronDown className="size-4 text-stone-400" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-stone-100 px-3 pb-3 pt-1">
          {checks.map((check) => (
            <SeoCheckItem key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  )
}
