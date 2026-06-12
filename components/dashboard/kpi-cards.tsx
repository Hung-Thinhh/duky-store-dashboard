"use client"

import * as React from "react"
import {
  IconCurrencyDollar,
  IconShoppingBag,
  IconReceipt,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react"
import { Card, CardContent } from "@/components/ui/card"
import { customerService } from "@/lib/api/services/customer.service"
import { orderService } from "@/lib/api/services/order.service"
import { productService } from "@/lib/api/services/product.service"

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  currency: IconCurrencyDollar,
  orders: IconShoppingBag,
  receipt: IconReceipt,
  customers: IconUsers,
}

const colorMap: Record<string, { bg: string; text: string }> = {
  currency: { bg: "bg-accent-soft", text: "text-primary" },
  orders: { bg: "bg-info-soft", text: "text-info" },
  receipt: { bg: "bg-warning-soft", text: "text-warning" },
  customers: { bg: "bg-success-soft", text: "text-success" },
}

export function KpiCards() {
  const [kpiData, setKpiData] = React.useState([
    { title: "Doanh thu", value: "0 đ", change: "0%", trend: "up", description: "theo dữ liệu hiện có", icon: "currency" },
    { title: "Đơn hàng", value: "0", change: "0%", trend: "up", description: "tổng đơn", icon: "orders" },
    { title: "Giá trị TB", value: "0 đ", change: "0%", trend: "up", description: "trên mỗi đơn", icon: "receipt" },
    { title: "Khách hàng", value: "0", change: "0%", trend: "up", description: "tổng khách", icon: "customers" },
  ])

  React.useEffect(() => {
    const formatPrice = (value: number) =>
      new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)

    const loadKpis = async () => {
      try {
        const [orders, customers, products] = await Promise.all([
          orderService.getOrders({ limit: 25 }),
          customerService.getCustomers({ limit: 1 }),
          productService.getProducts({ limit: 1 }),
        ])
        const revenue = orders.data.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
        const averageOrder = orders.data.length ? Math.round(revenue / orders.data.length) : 0

        setKpiData([
          { title: "Doanh thu", value: formatPrice(revenue), change: `${orders.data.length}`, trend: "up", description: "đơn đang tải", icon: "currency" },
          { title: "Đơn hàng", value: (orders.pagination?.total ?? 0).toLocaleString("vi-VN"), change: "Dữ liệu thật", trend: "up", description: "từ API", icon: "orders" },
          { title: "Giá trị TB", value: formatPrice(averageOrder), change: "Dữ liệu thật", trend: "up", description: "trên đơn đã tải", icon: "receipt" },
          { title: "Khách hàng", value: (customers.pagination?.total ?? 0).toLocaleString("vi-VN"), change: `${products.pagination?.total ?? 0}`, trend: "up", description: "sản phẩm trong catalog", icon: "customers" },
        ])
      } catch (error) {
        console.error("Failed to fetch dashboard KPIs", error)
      }
    }

    loadKpis()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiData.map((kpi) => {
        const Icon = iconMap[kpi.icon]
        const colors = colorMap[kpi.icon]
        const isUp = kpi.trend === "up"

        return (
          <Card
            key={kpi.title}
            className="border-border/60 shadow-none transition-shadow hover:shadow-sm"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {kpi.title}
                  </span>
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {kpi.value}
                  </span>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${colors.bg}`}
                >
                  <Icon className={`size-5 ${colors.text}`} strokeWidth={1.8} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    isUp
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger"
                  }`}
                >
                  {isUp ? (
                    <IconTrendingUp className="size-3.5" strokeWidth={2} />
                  ) : (
                    <IconTrendingDown className="size-3.5" strokeWidth={2} />
                  )}
                  {kpi.change}
                </div>
                <span className="text-xs text-muted-foreground">
                  {kpi.description}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
