 "use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderStatus } from "@/lib/api/schemas/enums"
import { Order } from "@/lib/api/schemas/order.schema"
import { orderService } from "@/lib/api/services/order.service"

const statusStyles: Record<
  string,
  { className: string; label: string }
> = {
  [OrderStatus.COMPLETED]: {
    className: "bg-success-soft text-success border-0 font-medium",
    label: "Hoàn thành",
  },
  [OrderStatus.PROCESSING]: {
    className: "bg-info-soft text-info border-0 font-medium",
    label: "Đang xử lý",
  },
  [OrderStatus.PENDING]: {
    className: "bg-warning-soft text-warning border-0 font-medium",
    label: "Chờ duyệt",
  },
  [OrderStatus.CANCELLED]: {
    className: "bg-danger-soft text-danger border-0 font-medium",
    label: "Đã hủy",
  },
  [OrderStatus.CONFIRMED]: {
    className: "bg-info-soft text-info border-0 font-medium",
    label: "Đã xác nhận",
  },
  [OrderStatus.SHIPPING]: {
    className: "bg-info-soft text-info border-0 font-medium",
    label: "Đang giao",
  },
  [OrderStatus.REFUNDED]: {
    className: "bg-secondary text-muted-foreground border-0 font-medium",
    label: "Đã hoàn tiền",
  },
}

export function RecentOrders() {
  const [orders, setOrders] = React.useState<Order[]>([])

  React.useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await orderService.getOrders({ limit: 6 })
        setOrders(data.data)
      } catch (error) {
        console.error("Failed to fetch recent orders", error)
      }
    }

    loadOrders()
  }, [])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price)

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Đơn hàng gần đây
          </CardTitle>
          <Link href="/orders" className="text-xs font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                Mã đơn
              </TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                Khách hàng
              </TableHead>
              <TableHead className="h-10 hidden text-xs font-medium text-muted-foreground md:table-cell">
                Sản phẩm
              </TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                Tổng tiền
              </TableHead>
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                Trạng thái
              </TableHead>
              <TableHead className="h-10 hidden text-xs font-medium text-muted-foreground lg:table-cell">
                Ngày tạo
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu đơn hàng.
                </TableCell>
              </TableRow>
            ) : orders.map((order) => {
              const status = statusStyles[order.status] ?? statusStyles[OrderStatus.PENDING]
              const productNames = order.items.map((item) => item.productName).join(", ")
              return (
                <TableRow
                  key={order.id}
                  className="border-border/40 hover:bg-secondary/30"
                >
                  <TableCell className="py-3 text-sm font-medium text-primary">
                    {order.code}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {order.customerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.customerEmail || order.customerPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden py-3 text-sm text-muted-foreground md:table-cell">
                    {productNames || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 text-right text-sm font-semibold text-foreground">
                    {formatPrice(order.totalAmount)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="secondary"
                      className={`rounded-md text-[11px] ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden py-3 text-sm text-muted-foreground lg:table-cell">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
