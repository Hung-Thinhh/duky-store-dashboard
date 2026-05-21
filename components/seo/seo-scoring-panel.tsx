"use client"

import * as React from "react"
import { IconX } from "@tabler/icons-react"
import { Label } from "@/components/ui/label"
import type { SeoScoreResult } from "@/lib/seo/types"
import { SeoScoreIndicator } from "./seo-score-indicator"
import { SeoCheckSection } from "./seo-check-section"

interface SeoScoringPanelProps {
  result: SeoScoreResult | null
  focusKeyword: string
  onFocusKeywordChange: (value: string) => void
}

export function SeoScoringPanel({
  result,
  focusKeyword,
  onFocusKeywordChange,
}: SeoScoringPanelProps) {
  const [inputValue, setInputValue] = React.useState("")
  const keywords = focusKeyword
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      const newKeyword = inputValue.trim()
      if (!keywords.includes(newKeyword)) {
        const updated = [...keywords, newKeyword].join(", ")
        onFocusKeywordChange(updated)
      }
      setInputValue("")
    }
    if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      const updated = keywords.slice(0, -1).join(", ")
      onFocusKeywordChange(updated)
    }
  }

  const removeKeyword = (index: number) => {
    const updated = keywords.filter((_, i) => i !== index).join(", ")
    onFocusKeywordChange(updated)
  }

  const basicChecks = result?.checks.filter((c) => c.category === "basic") ?? []
  const additionalChecks =
    result?.checks.filter((c) => c.category === "additional") ?? []
  const titleReadabilityChecks =
    result?.checks.filter((c) => c.category === "titleReadability") ?? []
  const contentReadabilityChecks =
    result?.checks.filter((c) => c.category === "contentReadability") ?? []

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Từ khóa chính</Label>
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-orange-200">
          {keywords.map((keyword, index) => (
            <span
              key={`${keyword}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="inline-flex size-3.5 items-center justify-center rounded-full hover:bg-orange-200"
              >
                <IconX className="size-2.5" />
              </button>
            </span>
          ))}
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={keywords.length === 0 ? "Nhập từ khóa + Enter..." : "Thêm từ khóa..."}
            className="min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>
        <p className="text-xs text-stone-400">Nhập từ khóa rồi nhấn Enter để thêm. Từ khóa đầu tiên là từ khóa chính.</p>
      </div>

      {keywords.length === 0 && (
        <p className="text-sm text-stone-500">
          Nhập từ khóa chính để bắt đầu phân tích SEO.
        </p>
      )}

      {result && (
        <>
          <div className="flex items-center gap-3">
            <SeoScoreIndicator score={result.score} color={result.color} />
            <span className="text-sm text-stone-600">Điểm SEO</span>
          </div>

          <div className="space-y-2">
            <SeoCheckSection
              title="SEO Cơ bản"
              checks={basicChecks}
              defaultOpen
            />
            <SeoCheckSection
              title="Bổ sung"
              checks={additionalChecks}
            />
            <SeoCheckSection
              title="Tiêu đề"
              checks={titleReadabilityChecks}
            />
            <SeoCheckSection
              title="Nội dung"
              checks={contentReadabilityChecks}
            />
          </div>
        </>
      )}
    </div>
  )
}
