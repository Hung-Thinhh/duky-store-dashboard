 "use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { orderService } from "@/lib/api/services/order.service"

type TopProduct = {
  id: string
  name: string
  revenue: number
  sales: number
  percentage: number
  color: string
}

export function TopProducts() {
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([])

  React.useEffect(() => {
    const loadTopProducts = async () => {
      try {
        const orders = await orderService.getOrders({ limit: 100 })
        const byProduct = new Map<string, TopProduct>()

        for (const order of orders.data) {
          for (const item of order.items) {
            const key = item.productId || item.productName
            const current = byProduct.get(key) ?? {
              id: key,
              name: item.productName,
              revenue: 0,
              sales: 0,
              percentage: 0,
              color: "#f97316",
            }
            current.revenue += Number(item.price || 0) * Number(item.quantity || 0)
            current.sales += Number(item.quantity || 0)
            byProduct.set(key, current)
          }
        }

        const ranked = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        const maxRevenue = ranked[0]?.revenue || 1
        setTopProducts(ranked.map((item) => ({ ...item, percentage: Math.round((item.revenue / maxRevenue) * 100) })))
      } catch (error) {
        console.error("Failed to fetch top products", error)
      }
    }

    loadTopProducts()
  }, [])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price)

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Sản phẩm bán chạy
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">Dữ liệu thật</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col gap-4">
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu bán chạy.
            </div>
          ) : topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                {index + 1}
              </div>

              {/* Product Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={product.percentage}
                    className="h-1.5 flex-1"
                    style={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      "--progress-indicator-color": product.color,
                    } as any}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {product.sales} bán
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
