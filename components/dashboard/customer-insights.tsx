"use client"

import {
  IconUserPlus,
  IconRepeat,
  IconStar,
  IconChartDonut,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { customerInsights } from "@/lib/mock-data"

export function CustomerInsights() {
  const total =
    customerInsights.newCustomers + customerInsights.returningCustomers
  const newPercent = Math.round(
    (customerInsights.newCustomers / total) * 100
  )
  const returnPercent = 100 - newPercent

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Phân tích khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Donut-like visual */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-20 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#E8F0FE"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#1A73E8"
                strokeWidth="3.5"
                strokeDasharray={`${returnPercent * 0.88} 88`}
                strokeLinecap="round"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#F97316"
                strokeWidth="3.5"
                strokeDasharray={`${newPercent * 0.88} 88`}
                strokeDashoffset={`-${returnPercent * 0.88}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-bold text-foreground">
              {total.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-info" />
              <span className="text-xs text-muted-foreground">
                Khách quay lại ({returnPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                Khách mới ({newPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-success-soft">
              <IconRepeat className="size-4 text-success" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {customerInsights.repeatRate}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Tỷ lệ quay lại
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-info-soft">
              <IconChartDonut className="size-4 text-info" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {customerInsights.avgLifetimeValue}
              </span>
              <span className="text-[11px] text-muted-foreground">
                LTV trung bình
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent-soft">
              <IconUserPlus className="size-4 text-primary" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {customerInsights.avgSessions}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Phiên trung bình
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-warning-soft">
              <IconStar className="size-4 text-warning" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {customerInsights.satisfactionScore}/5
              </span>
              <span className="text-[11px] text-muted-foreground">
                Hài lòng
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
