"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconArchive,
  IconArrowsExchange,
  IconBox,
  IconCategory,
  IconChartBar,
  IconCircleCheck,
  IconPackage,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InventoryAnalytics,
} from "@/lib/api/schemas/inventory.schema"
import { inventoryService } from "@/lib/api/services/inventory.service"

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value)

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })

export default function InventoryPage() {
  const [analytics, setAnalytics] = React.useState<InventoryAnalytics | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = React.useState(true)

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setIsAnalyticsLoading(true)
      const data = await inventoryService.getInventoryAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error("Failed to fetch inventory analytics", error)
      setAnalytics(null)
    } finally {
      setIsAnalyticsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const summary = analytics?.summary
  const maxMovement = Math.max(
    1,
    ...(analytics?.movements ?? []).map((movement) => movement.import + movement.export)
  )

  return (
    <div className="mx-auto flex max-w-8xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Quản lý tồn kho</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Theo dõi sức khỏe kho, cảnh báo thiếu hàng và điều chỉnh số lượng theo từng SKU.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl">
            <IconArchive className="mr-2 size-4" />
            Xuất báo cáo
          </Button>
          <Button className="rounded-xl">
            <IconArrowsExchange className="mr-2 size-4" />
            Kiểm kho nhanh
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/60 pb-px">
        <Link
          href="/inventory"
          className="border-b-2 border-primary px-4 py-2 text-sm font-semibold text-primary"
        >
          Tổng quan tồn kho
        </Link>
        <Link
          href="/inventory/details"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Chi tiết tồn kho (Sửa nhanh)
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InventoryMetric
          title="Tổng SKU theo dõi"
          value={summary ? formatNumber(summary.totalSkus) : "--"}
          description="Các phân loại hàng khác nhau"
          icon={IconPackage}
          tone="accent"
          loading={isAnalyticsLoading}
        />
        <InventoryMetric
          title="Tổng lượng tồn"
          value={summary ? formatNumber(summary.totalQuantity) : "--"}
          description={`Có sẵn: ${summary ? formatNumber(summary.availableQuantity) : "--"} · Đang giữ: ${summary ? formatNumber(summary.reservedQuantity) : "--"}`}
          icon={IconBox}
          tone="info"
          loading={isAnalyticsLoading}
        />
        <InventoryMetric
          title="SKU sắp hết"
          value={summary ? formatNumber(summary.lowStockCount) : "--"}
          description="Cần bổ sung sớm nhất"
          icon={IconAlertTriangle}
          tone="warning"
          loading={isAnalyticsLoading}
        />
        <InventoryMetric
          title="Sức khỏe tồn kho"
          value={summary ? `${summary.stockHealthRate}%` : "--"}
          description={`Ổn: ${summary ? formatNumber(summary.healthyCount) : "--"} · Hết: ${summary ? formatNumber(summary.soldOutCount) : "--"}`}
          icon={IconCircleCheck}
          tone="danger"
          loading={isAnalyticsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-2 border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Biến động nhập/xuất kho (14 ngày)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <div className="flex h-full items-end gap-2 pt-4">
              {isAnalyticsLoading ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Đang tải dữ liệu...
                </div>
              ) : (analytics?.movements ?? []).map((movement) => {
                const total = movement.import + movement.export
                const importHeight = total > 0 ? (movement.import / maxMovement) * 100 : 0
                const exportHeight = total > 0 ? (movement.export / maxMovement) * 100 : 0
                return (
                  <div key={movement.date} className="group relative flex h-full flex-1 flex-col justify-end gap-1">
                    <div className="flex h-full items-end gap-0.5">
                      <div
                        className="w-full rounded-t-sm bg-success/80 transition-all group-hover:bg-success"
                        style={{ height: `${importHeight}%` }}
                      />
                      <div
                        className="w-full rounded-t-sm bg-danger/80 transition-all group-hover:bg-danger"
                        style={{ height: `${exportHeight}%` }}
                      />
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground text-center">
                      {formatShortDate(movement.date)}
                    </span>
                    <div className="absolute bottom-full left-1/2 z-10 mb-2 w-32 -translate-x-1/2 rounded-lg border bg-popover p-2 text-[11px] shadow-md opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                      <div className="font-semibold text-foreground">{movement.date}</div>
                      <div className="mt-1 flex items-center justify-between text-success">
                        <span>Nhập:</span>
                        <span className="font-medium">+{formatNumber(movement.import)}</span>
                      </div>
                      <div className="flex items-center justify-between text-danger">
                        <span>Xuất:</span>
                        <span className="font-medium">-{formatNumber(movement.export)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Công việc khẩn cấp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAnalyticsLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Đang tải cảnh báo...</div>
            ) : analytics?.topLowStock.slice(0, 3).map((item) => {
              const critical = item.quantity <= 0
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    critical ? "border-danger/20 bg-danger-soft/50" : "border-warning/20 bg-warning-soft/40"
                  }`}
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${critical ? "bg-danger-soft" : "bg-warning-soft"}`}>
                    <IconAlertTriangle className={`size-4 ${critical ? "text-danger" : "text-warning"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{item.productName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.variantName || "Sản phẩm đơn"} · SKU: {item.sku || "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">{formatNumber(item.quantity)}</div>
                    <div className="text-[11px] text-muted-foreground">ngưỡng {item.threshold}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type MetricTone = "accent" | "info" | "warning" | "danger"

const metricToneMap: Record<MetricTone, { bg: string; text: string }> = {
  accent: { bg: "bg-accent-soft", text: "text-primary" },
  info: { bg: "bg-info-soft", text: "text-info" },
  warning: { bg: "bg-warning-soft", text: "text-warning" },
  danger: { bg: "bg-danger-soft", text: "text-danger" },
}

function InventoryMetric({
  title,
  value,
  description,
  icon: Icon,
  tone,
  loading,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone: MetricTone
  loading: boolean
}) {
  const colors = metricToneMap[tone]

  return (
    <Card className="border-border/60 shadow-none transition-shadow hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-semibold tracking-tight text-foreground">{loading ? "--" : value}</span>
          </div>
          <div className={`flex size-10 items-center justify-center rounded-xl ${colors.bg}`}>
            <Icon className={`size-5 ${colors.text}`} strokeWidth={1.8} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
            <IconCircleCheck className="size-3.5" strokeWidth={2} />
            Dữ liệu thật
          </div>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function InventoryBreakdown({
  title,
  icon: Icon,
  items,
}: {
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  items: Array<{ id: string; name: string; quantity: number; skus: number; lowStock: number }>
}) {
  const maxQuantity = Math.max(1, ...items.map((item) => item.quantity))

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent-soft">
            <Icon className="size-4 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="space-y-2 rounded-xl border border-border/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.skus} SKU · {item.lowStock} cảnh báo</div>
              </div>
              <div className="text-sm font-semibold text-foreground">{formatNumber(item.quantity)}</div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, Math.round((item.quantity / maxQuantity) * 100))}%` }} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
            Chưa có dữ liệu để phân tích.
          </div>
        )}
      </CardContent>
    </Card>
  )
}


