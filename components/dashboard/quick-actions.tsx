"use client"

import {
  IconPlus,
  IconShoppingBag,
  IconTicket,
  IconFileAnalytics,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const actions = [
  {
    title: "Thêm sản phẩm",
    description: "Tạo sản phẩm mới",
    icon: IconPlus,
    color: "text-primary",
    bg: "bg-accent-soft",
  },
  {
    title: "Tạo đơn hàng",
    description: "Nhập đơn thủ công",
    icon: IconShoppingBag,
    color: "text-info",
    bg: "bg-info-soft",
  },
  {
    title: "Thêm mã giảm giá",
    description: "Tạo coupon mới",
    icon: IconTicket,
    color: "text-success",
    bg: "bg-success-soft",
  },
  {
    title: "Xem báo cáo",
    description: "Mở analytics",
    icon: IconFileAnalytics,
    color: "text-warning",
    bg: "bg-warning-soft",
  },
]

export function QuickActions() {
  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.title}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 p-4 text-center transition-all hover:border-primary/30 hover:bg-accent-soft/50 hover:shadow-sm"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${action.bg} transition-transform group-hover:scale-105`}
              >
                <action.icon
                  className={`size-5 ${action.color}`}
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {action.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {action.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
