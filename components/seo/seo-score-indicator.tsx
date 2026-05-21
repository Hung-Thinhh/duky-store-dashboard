"use client"

import type { ScoreColor } from "@/lib/seo/types"

interface SeoScoreIndicatorProps {
  score: number
  color: ScoreColor
}

const colorClasses: Record<ScoreColor, string> = {
  red: "text-red-600 bg-red-50",
  orange: "text-orange-600 bg-orange-50",
  green: "text-green-600 bg-green-50",
}

export function SeoScoreIndicator({ score, color }: SeoScoreIndicatorProps) {
  return (
    <div
      className={`inline-flex items-baseline gap-1 rounded-xl px-3 py-1.5 font-semibold ${colorClasses[color]}`}
    >
      <span className="text-2xl">{score}</span>
      <span className="text-sm font-medium opacity-70">/100</span>
    </div>
  )
}
