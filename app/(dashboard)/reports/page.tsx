"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconBoxSeam,
  IconShoppingCart,
  IconUsers,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { reportService } from "@/lib/api/services/report.service"
import { ReportsDashboard } from "@/lib/api/schemas/report.schema"

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
const number = new Intl.NumberFormat("vi-VN")

const mockReports: ReportsDashboard = {
  revenue: [
    { label: "01/05", revenue: 14800000, orders: 18, channel: "ONLINE" },
    { label: "02/05", revenue: 21200000, orders: 24, channel: "DIRECT" },
    { label: "03/05", revenue: 17600000, orders: 21, channel: "ONLINE" },
    { label: "04/05", revenue: 26400000, orders: 31, channel: "MARKETPLACE" },
    { label: "05/05", revenue: 30900000, orders: 37, channel: "ONLINE" },
    { label: "06/05", revenue: 22100000, orders: 26, channel: "DIRECT" },
    { label: "07/05", revenue: 34700000, orders: 42, channel: "ONLINE" },
  ],
  orderFunnel: {
    totalOrders: 199,
    completedOrders: 143,
    cancelledOrders: 18,
    pendingOrders: 38,
    completionRate: 71.9,
    cancelRate: 9,
  },
  bestSellers: [
    { productId: "prd_1", productName: "Giày Boot Nữ Cổ Thấp Jun", sku: "BOOT-JUN", soldQuantity: 86, revenue: 50740000, stockOnHand: 34, daysWithoutSale: 0 },
    { productId: "prd_2", productName: "Boot Da Bò Đế Cao Su 6cm", sku: "BOOT-6CM", soldQuantity: 64, revenue: 37760000, stockOnHand: 18, daysWithoutSale: 1 },
    { productId: "prd_3", productName: "Boot Cổ Cao MZDL", sku: "BOOT-MZDL", soldQuantity: 41, revenue: 24190000, stockOnHand: 9, daysWithoutSale: 2 },
  ],
  slowMoving: [
    { productId: "prd_8", productName: "Sandal da mềm cổ điển", sku: "SANDAL-CLASSIC", soldQuantity: 1, revenue: 390000, stockOnHand: 42, daysWithoutSale: 42 },
    { productId: "prd_9", productName: "Ví da mini màu nâu", sku: "WALLET-MINI", soldQuantity: 2, revenue: 580000, stockOnHand: 57, daysWithoutSale: 35 },
  ],
  customers: [
    { customerId: "cus_1", customerName: "Nguyễn Minh Anh", orderCount: 8, totalSpent: 9240000, lastOrderAt: "2026-05-11", segment: "VIP" },
    { customerId: "cus_2", customerName: "Hoàng Nam", orderCount: 5, totalSpent: 6310000, lastOrderAt: "2026-05-10", segment: "REGULAR" },
    { customerId: "cus_3", customerName: "Lê Thanh", orderCount: 2, totalSpent: 2180000, lastOrderAt: "2026-05-02", segment: "NEW" },
  ],
  inventory: [
    { productId: "prd_1", productName: "Giày Boot Nữ Cổ Thấp Jun", sku: "BOOT-JUN", stockOnHand: 34, unitCost: 310000, retailValue: 20060000, inventoryValue: 10540000 },
    { productId: "prd_2", productName: "Boot Da Bò Đế Cao Su 6cm", sku: "BOOT-6CM", stockOnHand: 18, unitCost: 330000, retailValue: 10620000, inventoryValue: 5940000 },
    { productId: "prd_8", productName: "Sandal da mềm cổ điển", sku: "SANDAL-CLASSIC", stockOnHand: 42, unitCost: 190000, retailValue: 16380000, inventoryValue: 7980000 },
  ],
}

type ReportGranularity = "day" | "month" | "channel"

const toCsv = (rows: Array<Record<string, string | number | null | undefined>>) => {
  const headers = Object.keys(rows[0] || {})
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(",")
    ),
  ].join("\n")
}

const downloadCsv = (name: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-1 text-3xl">{value}</CardTitle>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = React.useState<ReportsDashboard>(mockReports)
  const [isLoading, setIsLoading] = React.useState(true)
  const [granularity, setGranularity] = React.useState<ReportGranularity>("day")
  const [dateFrom, setDateFrom] = React.useState("2026-05-01")
  const [dateTo, setDateTo] = React.useState("2026-05-13")

  const fetchReports = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await reportService.getDashboard({
        from: dateFrom,
        to: dateTo,
        groupBy: granularity,
      })
      setReports(data)
    } catch (error) {
      console.warn("Reports API is not ready, using mock report data", error)
      setReports(mockReports)
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, granularity])

  React.useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const totalRevenue = reports.revenue.reduce((sum, item) => sum + item.revenue, 0)
  const totalOrders = reports.revenue.reduce((sum, item) => sum + item.orders, 0)
  const totalInventoryValue = reports.inventory.reduce((sum, item) => sum + item.inventoryValue, 0)
  const topCustomerValue = reports.customers[0]?.totalSpent ?? 0
  const maxRevenue = Math.max(...reports.revenue.map((item) => item.revenue), 1)

  const exportAll = () => {
    const rows = [
      ...reports.revenue.map((item) => ({ report: "revenue", ...item })),
      ...reports.bestSellers.map((item) => ({ report: "best_seller", ...item })),
      ...reports.slowMoving.map((item) => ({ report: "slow_moving", ...item })),
      ...reports.customers.map((item) => ({ report: "customer", ...item })),
      ...reports.inventory.map((item) => ({ report: "inventory", ...item })),
    ]
    downloadCsv(`duky-reports-${dateFrom}-${dateTo}.csv`, toCsv(rows))
  }

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo & phân tích</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Báo cáo doanh thu, chuyển đổi đơn hàng, sản phẩm, khách hàng, tồn kho và xuất dữ liệu.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[150px_150px_170px_auto_auto]">
          <div className="space-y-1">
            <Label>Từ ngày</Label>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label>Đến ngày</Label>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label>Nhóm theo</Label>
            <Select value={granularity} onValueChange={(value) => setGranularity(value as ReportGranularity)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Ngày</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
                <SelectItem value="channel">Kênh bán</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchReports} disabled={isLoading} className="self-end rounded-xl">
            {isLoading ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconRefresh className="mr-2 size-4" />}
            Tải báo cáo
          </Button>
          <Button variant="outline" onClick={exportAll} className="self-end rounded-xl">
            <IconDownload className="mr-2 size-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Doanh thu" value={money.format(totalRevenue)} description={`${totalOrders} đơn trong kỳ`} icon={IconChartBar} />
        <MetricCard title="Hoàn tất đơn" value={`${reports.orderFunnel.completionRate}%`} description={`${reports.orderFunnel.completedOrders}/${reports.orderFunnel.totalOrders} đơn hoàn tất`} icon={IconShoppingCart} />
        <MetricCard title="Giá trị tồn" value={money.format(totalInventoryValue)} description={`${reports.inventory.length} dòng tồn kho`} icon={IconBoxSeam} />
        <MetricCard title="Khách hàng top" value={money.format(topCustomerValue)} description={reports.customers[0]?.customerName || "Chưa có dữ liệu"} icon={IconUsers} />
      </div>

      <Tabs defaultValue="revenue" className="gap-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="customers">Khách hàng</TabsTrigger>
          <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Báo cáo doanh thu theo ngày/tháng/kênh</CardTitle>
              <CardDescription>Doanh thu và số đơn theo bộ lọc thời gian/kênh.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {reports.revenue.map((item) => (
                  <div key={`${item.label}-${item.channel}`} className="grid gap-2 md:grid-cols-[110px_minmax(0,1fr)_140px_80px] md:items-center">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.channel || granularity}</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (item.revenue / maxRevenue) * 100)}%` }} />
                    </div>
                    <p className="font-semibold">{money.format(item.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{item.orders} đơn</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Báo cáo chuyển đổi, hủy và hoàn tất đơn</CardTitle>
              <CardDescription>Theo dõi tỷ lệ hoàn tất, hủy và backlog pending.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">Tổng số đơn</p>
                <p className="mt-2 text-3xl font-bold">{number.format(reports.orderFunnel.totalOrders)}</p>
              </div>
              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">Tỷ lệ hoàn tất</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{reports.orderFunnel.completionRate}%</p>
                <p className="mt-1 text-sm text-muted-foreground">{reports.orderFunnel.completedOrders} đơn hoàn tất</p>
              </div>
              <div className="rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">Tỷ lệ hủy</p>
                <p className="mt-2 text-3xl font-bold text-rose-600">{reports.orderFunnel.cancelRate}%</p>
                <p className="mt-1 text-sm text-muted-foreground">{reports.orderFunnel.cancelledOrders} đơn hủy</p>
              </div>
              <div className="rounded-xl border p-5 md:col-span-3">
                <p className="text-sm font-medium">Đơn đang chờ xử lý: {reports.orderFunnel.pendingOrders} đơn</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(reports.orderFunnel.pendingOrders / Math.max(reports.orderFunnel.totalOrders, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid gap-4 xl:grid-cols-2">
            <ProductTable title="Báo cáo bán chạy" description="Sản phẩm bán tốt theo số lượng và doanh thu." items={reports.bestSellers} />
            <ProductTable title="Báo cáo bán chậm" description="Sản phẩm bán chậm, tồn cao hoặc lâu chưa bán." items={reports.slowMoving} slow />
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Báo cáo khách hàng</CardTitle>
              <CardDescription>Khách hàng theo số đơn, tổng chi tiêu, lần mua gần nhất và phân nhóm.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số đơn</TableHead>
                    <TableHead>Tổng chi</TableHead>
                    <TableHead>Lần mua gần nhất</TableHead>
                    <TableHead>Phân nhóm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.customers.map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="font-medium">{customer.customerName}</TableCell>
                      <TableCell>{customer.orderCount}</TableCell>
                      <TableCell>{money.format(customer.totalSpent)}</TableCell>
                      <TableCell>{customer.lastOrderAt || "N/A"}</TableCell>
                      <TableCell><Badge variant="outline">{customer.segment || "Chưa phân nhóm"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Báo cáo định giá tồn kho</CardTitle>
              <CardDescription>Ước tính giá trị vốn tồn kho và giá trị bán lẻ đang nằm trong kho.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Tồn</TableHead>
                    <TableHead>Giá vốn</TableHead>
                    <TableHead>Giá trị vốn</TableHead>
                    <TableHead>Giá trị bán lẻ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.inventory.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>{item.stockOnHand}</TableCell>
                      <TableCell>{money.format(item.unitCost)}</TableCell>
                      <TableCell>{money.format(item.inventoryValue)}</TableCell>
                      <TableCell>{money.format(item.retailValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductTable({
  title,
  description,
  items,
  slow,
}: {
  title: string
  description: string
  items: ReportsDashboard["bestSellers"]
  slow?: boolean
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Đã bán</TableHead>
              <TableHead>Doanh thu</TableHead>
              <TableHead>{slow ? "Ngày chưa bán" : "Tồn"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell>
                  <p className="font-medium">{item.productName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                </TableCell>
                <TableCell>{item.soldQuantity}</TableCell>
                <TableCell>{money.format(item.revenue)}</TableCell>
                <TableCell>
                  {slow ? (
                    <Badge className="bg-amber-100 text-amber-700">{item.daysWithoutSale || 0} ngày</Badge>
                  ) : (
                    item.stockOnHand ?? "N/A"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
