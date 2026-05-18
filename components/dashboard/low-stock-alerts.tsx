 "use client"

import * as React from "react"
import Link from "next/link"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { inventoryService } from "@/lib/api/services/inventory.service"

type LowStockItem = {
  id: string
  name: string
  sku?: string | null
  stock: number
}

export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = React.useState<LowStockItem[]>([])

  React.useEffect(() => {
    const loadLowStock = async () => {
      try {
        const data = await inventoryService.getInventoryAnalytics()
        setLowStockItems(
          data.topLowStock.slice(0, 5).map((item) => ({
            id: item.id,
            name: [item.productName, item.variantName].filter(Boolean).join(" - "),
            sku: item.sku,
            stock: item.availableQuantity,
          })),
        )
      } catch (error) {
        console.error("Failed to fetch low stock alerts", error)
      }
    }

    loadLowStock()
  }, [])

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              Low Stock Alerts
            </CardTitle>
            <Badge
              variant="secondary"
              className="rounded-md border-0 bg-danger-soft text-[11px] font-medium text-danger"
            >
              {lowStockItems.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col gap-3">
          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Tồn kho đang ổn hoặc chưa có dữ liệu cảnh báo.
            </div>
          ) : lowStockItems.map((item) => {
            const isCritical = item.stock <= 3
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isCritical
                    ? "border-danger/20 bg-danger-soft/50"
                    : "border-border/60 bg-card"
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    isCritical ? "bg-danger-soft" : "bg-warning-soft"
                  }`}
                >
                  <IconAlertTriangle
                    className={`size-4 ${
                      isCritical ? "text-danger" : "text-warning"
                    }`}
                    strokeWidth={2}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.stock} remaining · SKU: {item.sku}
                  </span>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="xs"
                  className="shrink-0 rounded-lg text-[11px]"
                >
                  <Link href="/inventory">Nhập kho</Link>
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
