"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { revenueChartData } from "@/lib/mock-data"

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "#F97316",
  },
  orders: {
    label: "Đơn hàng",
    color: "#1A73E8",
  },
} satisfies ChartConfig

export function RevenueChart() {
  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Tổng quan doanh thu
          </CardTitle>
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-0.5">
            <button className="rounded-md bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm">
              Theo tháng
            </button>
            <button className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              Theo tuần
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={revenueChartData}
            margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#5F6368" }}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#5F6368" }}
              tickMargin={4}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value))
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F97316"
              strokeWidth={2.5}
              fill="url(#fillRevenue)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#F97316",
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
