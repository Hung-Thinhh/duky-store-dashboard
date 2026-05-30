import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopProducts } from "@/components/dashboard/top-products"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts"
import { SalesChannels } from "@/components/dashboard/sales-channels"
import { CustomerInsights } from "@/components/dashboard/customer-insights"

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-8xl flex-col gap-6 p-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Tổng quan dashboard
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Chào mừng quay lại! Đây là tình hình cửa hàng hôm nay.
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards />

      {/* Revenue Chart + Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>
        <div className="lg:col-span-2">
          <TopProducts />
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders />

      {/* Quick Actions + Low Stock + Sales Channels + Customer Insights */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <QuickActions />
        <LowStockAlerts />
        <SalesChannels />
        <CustomerInsights />
      </div>
    </div>
  )
}
