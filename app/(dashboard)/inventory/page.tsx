"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconAdjustments,
  IconAlertCircle,
  IconAlertTriangle,
  IconArchive,
  IconArrowsExchange,
  IconBox,
  IconCategory,
  IconChartBar,
  IconCircleCheck,
  IconDeviceFloppy,
  IconDotsVertical,
  IconLoader2,
  IconPackage,
  IconSearch,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  AdjustInventoryPayload,
  AdjustInventoryPayloadSchema,
  Inventory,
  InventoryAnalytics,
} from "@/lib/api/schemas/inventory.schema"
import { inventoryService } from "@/lib/api/services/inventory.service"

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value)

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })

export default function InventoryPage() {
  const [inventories, setInventories] = React.useState<Inventory[]>([])
  const [analytics, setAnalytics] = React.useState<InventoryAnalytics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pagination, setPagination] = React.useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [selectedInventory, setSelectedInventory] = React.useState<Inventory | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AdjustInventoryPayload>({
    resolver: zodResolver(AdjustInventoryPayloadSchema),
    defaultValues: { quantityChange: 0, changeType: "IMPORT", note: "" },
  })

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

  const fetchInventories = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await inventoryService.getInventories({
        page: currentPage,
        limit: pagination.limit,
        search: searchQuery.trim() || undefined,
      })
      setInventories(data.data)
      setPagination(data.pagination!)
    } catch (error) {
      console.error("Failed to fetch inventory", error)
      setInventories([])
      setPagination((previous) => ({ ...previous, page: currentPage, total: 0, totalPages: 1 }))
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pagination.limit, searchQuery])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  React.useEffect(() => {
    fetchInventories()
  }, [fetchInventories])

  const handleOpenSheet = (inventory: Inventory) => {
    setSelectedInventory(inventory)
    reset({ quantityChange: 0, changeType: "IMPORT", note: "" })
    setIsSheetOpen(true)
  }

  const onSubmit = async (data: AdjustInventoryPayload) => {
    if (!selectedInventory) return
    try {
      setIsSaving(true)
      await inventoryService.adjustInventory(selectedInventory.id, data)
      setIsSheetOpen(false)
      await Promise.all([fetchInventories(), fetchAnalytics()])
    } catch (error) {
      console.error("Failed to adjust inventory", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusInfo = (stock: number, threshold: number) => {
    if (stock <= 0) return { color: "bg-danger-soft text-danger", label: "Hết hàng" }
    if (stock <= threshold) return { color: "bg-warning-soft text-warning", label: "Sắp hết" }
    return { color: "bg-success-soft text-success", label: "Còn hàng" }
  }

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InventoryMetric
          title="Tổng SKU theo dõi"
          value={summary ? formatNumber(summary.totalSkus) : "--"}
          description={`${formatNumber(pagination.total)} dòng trong danh sách`}
          icon={IconPackage}
          tone="accent"
          loading={isAnalyticsLoading}
        />
        <InventoryMetric
          title="Tổng tồn thực tế"
          value={summary ? formatNumber(summary.totalQuantity) : "--"}
          description={`${summary ? formatNumber(summary.availableQuantity) : "--"} khả dụng`}
          icon={IconBox}
          tone="info"
          loading={isAnalyticsLoading}
        />
        <InventoryMetric
          title="Sắp hết hàng"
          value={summary ? formatNumber(summary.lowStockCount) : "--"}
          description="Cần lên kế hoạch nhập"
          icon={IconAlertTriangle}
          tone="warning"
          loading={isAnalyticsLoading}
        />
        <InventoryMetric
          title="Hết hàng"
          value={summary ? formatNumber(summary.soldOutCount) : "--"}
          description={`${summary ? summary.stockHealthRate : 0}% SKU còn ổn`}
          icon={IconAlertCircle}
          tone="danger"
          loading={isAnalyticsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="border-border/60 shadow-none lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Sức khỏe tồn kho</CardTitle>
              <Badge variant="secondary" className="rounded-md border-0 bg-accent-soft text-primary">
                {summary ? `${summary.stockHealthRate}% ổn định` : "Đang tải"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <div className="grid grid-cols-3 gap-3">
              {(analytics?.stockHealth ?? []).map((item) => {
                const total = Math.max(summary?.totalSkus ?? 1, 1)
                return (
                  <div key={item.label} className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                    <div className="text-2xl font-semibold tracking-tight text-foreground">
                      {formatNumber(item.value)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round((item.value / total) * 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
              {!analytics && [1, 2, 3].map((item) => (
                <div key={item} className="h-24 rounded-xl border border-border/60 bg-secondary/30" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Luồng nhập / xuất 14 ngày</span>
                <span className="text-xs text-muted-foreground">Cam: nhập, xanh: xuất</span>
              </div>
              <div className="flex h-36 items-end gap-2 rounded-xl border border-border/60 bg-card px-4 py-3">
                {(analytics?.movements ?? []).map((movement) => {
                  const importHeight = Math.max(4, Math.round((movement.import / maxMovement) * 100))
                  const exportHeight = Math.max(4, Math.round((movement.export / maxMovement) * 100))
                  return (
                    <div key={movement.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-24 w-full items-end justify-center gap-1">
                        <div className="w-2 rounded-t bg-primary/80" style={{ height: `${importHeight}%` }} />
                        <div className="w-2 rounded-t bg-info/80" style={{ height: `${exportHeight}%` }} />
                      </div>
                      <span className="truncate text-[10px] text-muted-foreground">{formatShortDate(movement.date)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Cần xử lý ngay</CardTitle>
              <Badge variant="secondary" className="rounded-md border-0 bg-danger-soft text-danger">
                {analytics?.topLowStock.length ?? 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {(analytics?.topLowStock ?? []).slice(0, 5).map((item) => {
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
            {analytics?.topLowStock.length === 0 && (
              <div className="rounded-xl border border-border/60 bg-success-soft/40 p-4 text-sm text-success">
                Tồn kho đang ổn, chưa có SKU cần cảnh báo.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InventoryBreakdown
          title="Tồn kho theo danh mục"
          icon={IconCategory}
          items={analytics?.categories ?? []}
        />
        <InventoryBreakdown
          title="Tồn kho theo thương hiệu"
          icon={IconChartBar}
          items={analytics?.brands ?? []}
        />
        <Card className="border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top tồn cao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {(analytics?.topHighStock ?? []).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{item.productName}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.variantName || item.sku || "Sản phẩm đơn"}</div>
                </div>
                <Badge variant="secondary" className="rounded-md border-0 bg-success-soft text-success">
                  {formatNumber(item.quantity)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader className="gap-4 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Chi tiết tồn kho</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Bảng thao tác theo từng sản phẩm hoặc biến thể.</p>
          </div>
          <div className="relative w-full md:w-[350px]">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên, SKU..."
              className="rounded-xl pl-9"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden border-t">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 w-[330px]">Sản phẩm / Biến thể</TableHead>
                  <TableHead className="h-12">SKU</TableHead>
                  <TableHead className="h-12 text-center">Tồn kho</TableHead>
                  <TableHead className="h-12 text-center">Đang giữ</TableHead>
                  <TableHead className="h-12 text-center">Khả dụng</TableHead>
                  <TableHead className="h-12 text-center">Ngưỡng</TableHead>
                  <TableHead className="h-12">Trạng thái</TableHead>
                  <TableHead className="h-12">Cập nhật cuối</TableHead>
                  <TableHead className="h-12 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : inventories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy dữ liệu tồn kho.
                    </TableCell>
                  </TableRow>
                ) : inventories.map((inventory) => {
                  const status = getStatusInfo(inventory.stock, inventory.threshold)
                  const available = inventory.availableQuantity ?? inventory.stock - inventory.reservedQuantity
                  return (
                    <TableRow key={inventory.id} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{inventory.productName}</span>
                          {inventory.variantName && <span className="text-xs text-muted-foreground">{inventory.variantName}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{inventory.sku || "N/A"}</TableCell>
                      <TableCell className="text-center text-lg font-bold">
                        <span className={inventory.stock <= inventory.threshold ? "text-destructive" : ""}>{formatNumber(inventory.stock)}</span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{formatNumber(inventory.reservedQuantity)}</TableCell>
                      <TableCell className="text-center font-medium text-foreground">{formatNumber(available)}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{formatNumber(inventory.threshold)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${status.color} rounded-md border-transparent`}>
                          {inventory.stock <= inventory.threshold && <IconAlertCircle className="mr-1 size-3" />}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inventory.updatedAt ? new Date(inventory.updatedAt).toLocaleDateString("vi-VN") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => handleOpenSheet(inventory)} className="cursor-pointer rounded-lg">
                              <IconAdjustments className="mr-2 size-4" /> Điều chỉnh
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Hiển thị trang <span className="font-medium text-foreground">{pagination.page}</span> /{" "}
              <span className="font-medium text-foreground">{pagination.totalPages || 1}</span>{" "}
              ({formatNumber(pagination.total)} dòng tồn kho)
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={isLoading || currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={isLoading || currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages || 1, page + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[400px]">
          {selectedInventory && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
              <SheetHeader className="border-b p-6 pb-4">
                <SheetTitle>Điều chỉnh tồn kho</SheetTitle>
                <SheetDescription>
                  Sản phẩm: {selectedInventory.productName} {selectedInventory.variantName ? `(${selectedInventory.variantName})` : ""}
                  <br />
                  SKU: {selectedInventory.sku || "N/A"}
                  <br />
                  Tồn kho hiện tại: <strong className="text-foreground">{formatNumber(selectedInventory.stock)}</strong>
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="space-y-2">
                  <Label>Loại điều chỉnh</Label>
                  <Controller
                    name="changeType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="IMPORT">Nhập thêm</SelectItem>
                          <SelectItem value="ADJUST">Kiểm kê</SelectItem>
                          <SelectItem value="RETURN_RESTORE">Khách trả hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityChange">Số lượng thay đổi (+/-) *</Label>
                  <Input id="quantityChange" type="number" {...register("quantityChange", { valueAsNumber: true })} className="rounded-xl" />
                  {errors.quantityChange && <p className="text-xs text-destructive">{errors.quantityChange.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea id="note" {...register("note")} className="min-h-[100px] rounded-xl" placeholder="Lý do điều chỉnh..." />
                </div>
              </div>
              <SheetFooter className="border-t p-6">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="w-full rounded-xl">Hủy</Button>
                <Button type="submit" disabled={isSaving} className="w-full rounded-xl">
                  {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
                  Lưu
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
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
            D? li?u th?t
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


