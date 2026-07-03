"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconSearch,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconLoader2,
  IconDeviceFloppy,
  IconLock,
  IconLockOpen,
  IconMail,
  IconPhone,
  IconCalendar,
  IconDownload,
  IconMapPin,
  IconNote,
  IconTag,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import { customerService } from "@/lib/api/services/customer.service"
import { Customer, UpdateCustomerPayloadSchema, UpdateCustomerPayload } from "@/lib/api/schemas/customer.schema"
import { CustomerStatus, CustomerType } from "@/lib/api/schemas/enums"
import type { Order } from "@/lib/api/schemas/order.schema"

const statusConfig: Record<string, { color: string; label: string }> = {
  [CustomerStatus.ACTIVE]: { color: "bg-emerald-100 text-emerald-700", label: "Đang hoạt động" },
  [CustomerStatus.BLOCKED]: { color: "bg-rose-100 text-rose-700", label: "Đã khóa" },
}

const typeConfig: Record<string, { color: string; label: string }> = {
  [CustomerType.NEW]: { color: "bg-blue-100 text-blue-700", label: "Mới" },
  [CustomerType.REGULAR]: { color: "bg-slate-100 text-slate-700", label: "Thường xuyên" },
  [CustomerType.VIP]: { color: "bg-amber-100 text-amber-700", label: "VIP" },
  [CustomerType.WHOLESALE]: { color: "bg-purple-100 text-purple-700", label: "Sỉ" },
}

const mockCustomers: Customer[] = [
  {
    id: "cus_1",
    fullName: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    phone: "0901234567",
    status: "ACTIVE",
    type: "VIP",
    totalOrders: 15,
    totalSpent: 45000000,
    lastOrderAt: "2026-05-08T10:00:00Z",
    addressLine: "23 Nguyễn Trãi",
    ward: "Bến Thành",
    district: "Quận 1",
    province: "TP.HCM",
    notes: "Khách thích boot da bò, ưu tiên gọi xác nhận trước khi giao.",
    tags: ["VIP", "returning"],
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "cus_2",
    fullName: "Trần Thị Bình",
    email: "binh.tran@example.com",
    phone: "0987654321",
    status: "ACTIVE",
    type: "REGULAR",
    totalOrders: 4,
    totalSpent: 3500000,
    lastOrderAt: "2026-04-20T10:00:00Z",
    addressLine: "102 Lê Văn Sỹ",
    ward: "Phường 13",
    district: "Quận 3",
    province: "TP.HCM",
    tags: ["returning"],
    createdAt: "2026-03-20T10:00:00Z",
  },
  {
    id: "cus_3",
    fullName: "Lê Văn Cường",
    email: "cuong.le@example.com",
    phone: "0912345678",
    status: "BLOCKED",
    type: "NEW",
    totalOrders: 1,
    totalSpent: 500000,
    lastOrderAt: "2026-05-01T10:00:00Z",
    addressLine: "7 Nguyễn Văn Cừ",
    district: "Quận 10",
    province: "TP.HCM",
    notes: "Từng có vấn đề thanh toán.",
    tags: ["payment issue"],
    createdAt: "2026-05-01T10:00:00Z",
  }
]

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = React.useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(false)
  const [customerTags, setCustomerTags] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateCustomerPayload>({
    resolver: zodResolver(UpdateCustomerPayloadSchema),
    defaultValues: {
      status: "ACTIVE",
      type: "NEW",
    },
  })

  const fetchCustomers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await customerService.getCustomers()
      setCustomers(data.data)
    } catch (error) {
      console.error("Failed to fetch customers", error)
      setCustomers(mockCustomers)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleOpenSheet = async (customer: Customer) => {
    setEditingCustomer(customer)
    setCustomerOrders([])
    setCustomerTags((customer.tags ?? []).join(", "))
    reset({
      status: customer.status as any,
      type: customer.type as any,
      notes: customer.notes ?? "",
      tags: customer.tags ?? [],
    })
    setIsSheetOpen(true)
    try {
      setIsLoadingOrders(true)
      const detail = await customerService.getCustomer(customer.id)
      setEditingCustomer(detail)
      setCustomerTags((detail.tags ?? []).join(", "))
      reset({
        status: detail.status as any,
        type: detail.type as any,
        notes: detail.notes ?? "",
        tags: detail.tags ?? [],
      })
      const orders = await customerService.getCustomerOrders(customer.id, { limit: 10 })
      setCustomerOrders(orders.data)
    } catch (error) {
      console.error("Failed to fetch customer detail/orders", error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const onSubmit = async (data: UpdateCustomerPayload) => {
    if (!editingCustomer) return
    try {
      setIsSaving(true)
      const payload = {
        ...data,
        tags: customerTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      }
      const updated = await customerService.updateCustomer(editingCustomer.id, payload)
      setEditingCustomer(updated)
      setIsSheetOpen(false)
      fetchCustomers()
    } catch (error) {
      console.error("Failed to update customer", error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  const filteredCustomers = customers.filter((c) =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    [c.addressLine, c.ward, c.district, c.province, ...(c.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  const exportCustomersCsv = () => {
    const csvRows = [
      ["Tên", "Email", "Số điện thoại", "Phân loại", "Trạng thái", "Số đơn", "Tổng chi tiêu", "Đơn gần nhất", "Địa chỉ", "Nhãn", "Ghi chú"],
      ...filteredCustomers.map((customer) => [
        customer.fullName,
        customer.email,
        customer.phone || "",
        customer.type,
        customer.status,
        String(customer.totalOrders),
        String(customer.totalSpent),
        customer.lastOrderAt || "",
        [customer.addressLine, customer.ward, customer.district, customer.province].filter(Boolean).join(", "),
        (customer.tags ?? []).join("|"),
        customer.notes || "",
      ]),
    ]
    const csv = csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `duky-customers-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin và lịch sử mua hàng của khách.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={exportCustomersCsv} disabled={!filteredCustomers.length}>
          <IconDownload className="mr-2 size-4" />
          Xuất CSV
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, email, sđt..."
            className="w-full rounded-xl pl-9 md:w-[420px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-w-full rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12">Khách hàng</TableHead>
              <TableHead className="h-12">Liên hệ</TableHead>
              <TableHead className="h-12 text-center">Đơn hàng</TableHead>
              <TableHead className="h-12 text-right">Tổng chi tiêu</TableHead>
              <TableHead className="h-12">Phân loại</TableHead>
              <TableHead className="h-12">Trạng thái</TableHead>
              <TableHead className="h-12 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy khách hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-primary">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {customer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{customer.fullName}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(customer.tags ?? []).slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="h-5 rounded-md px-1.5 text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{customer.email}</span>
                      <span className="text-muted-foreground">{customer.phone || "N/A"}</span>
                      {(customer.addressLine || customer.district || customer.province) && (
                        <span className="text-xs text-muted-foreground">{[customer.addressLine, customer.district, customer.province].filter(Boolean).join(", ")}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{customer.totalOrders}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(customer.totalSpent)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={typeConfig[customer.type]?.color + " border-transparent rounded-md"}
                    >
                      {typeConfig[customer.type]?.label || customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={statusConfig[customer.status]?.color + " border-transparent rounded-md"}
                    >
                      {statusConfig[customer.status]?.label || customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-40">
                        <DropdownMenuItem onClick={() => handleOpenSheet(customer)} className="rounded-lg cursor-pointer">
                          <IconEye className="mr-2 size-4" /> Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {customer.status === "ACTIVE" ? (
                          <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <IconLock className="mr-2 size-4" /> Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="rounded-lg cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                            <IconLockOpen className="mr-2 size-4" /> Mở khóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[480px]">
          {editingCustomer && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
              <SheetHeader className="border-b p-6 pb-4">
                <SheetTitle>Chi tiết khách hàng</SheetTitle>
                <SheetDescription>
                  Xem thông tin và cập nhật phân loại/trạng thái.
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-6">
                  {/* Customer Info Card */}
                  <div className="rounded-xl border bg-card p-4 space-y-4">
                    <div className="flex items-center gap-4 border-b pb-4">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {editingCustomer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{editingCustomer.fullName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <IconCalendar className="size-3.5 mr-1" />
                          Đăng ký: {editingCustomer.createdAt ? new Date(editingCustomer.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <IconMail className="size-4 text-muted-foreground mr-3" />
                        <span>{editingCustomer.email}</span>
                      </div>
                      <div className="flex items-center">
                        <IconPhone className="size-4 text-muted-foreground mr-3" />
                        <span>{editingCustomer.phone || "Không có số điện thoại"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border bg-card p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tổng đơn hàng</p>
                      <p className="text-2xl font-bold text-primary">{editingCustomer.totalOrders}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tổng chi tiêu</p>
                      <p className="text-xl font-bold text-primary">{formatPrice(editingCustomer.totalSpent)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border bg-card p-4 text-center">
                      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Giá trị TB</p>
                      <p className="text-xl font-bold text-primary">{formatPrice(editingCustomer.totalOrders ? editingCustomer.totalSpent / editingCustomer.totalOrders : 0)}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4 text-center">
                      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Đơn gần nhất</p>
                      <p className="text-sm font-semibold text-primary">{editingCustomer.lastOrderAt ? new Date(editingCustomer.lastOrderAt).toLocaleDateString("vi-VN") : "N/A"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold">
                      <IconMapPin className="mr-2 size-4 text-muted-foreground" />
                      Sổ địa chỉ
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {[editingCustomer.addressLine, editingCustomer.ward, editingCustomer.district, editingCustomer.province].filter(Boolean).join(", ") || "Chưa có địa chỉ mặc định."}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold">
                      <IconTag className="mr-2 size-4 text-muted-foreground" />
                      Tags / nhóm khách
                    </h4>
                    <Input value={customerTags} onChange={(event) => setCustomerTags(event.target.value)} className="rounded-xl" placeholder="VIP, khách quay lại, cần hỗ trợ thanh toán..." />
                    <p className="mt-2 text-xs text-muted-foreground">Cách nhau bằng dấu phẩy. Nhóm chính vẫn dùng phân loại khách bên dưới.</p>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold">
                      <IconNote className="mr-2 size-4 text-muted-foreground" />
                      Ghi chú nội bộ
                    </h4>
                    <Textarea {...register("notes")} className="min-h-[110px] rounded-xl" placeholder="Lưu sở thích, vấn đề thanh toán, yêu cầu giao hàng..." />
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold">Lịch sử đơn hàng</h4>
                    {isLoadingOrders ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconLoader2 className="size-4 animate-spin" />
                        Đang tải đơn hàng...
                      </div>
                    ) : customerOrders.length ? (
                      <div className="space-y-2">
                        {customerOrders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                            <div>
                              <div className="font-medium text-primary">{order.code}</div>
                              <div className="text-xs text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}</div>
                            </div>
                            <div className="text-right font-semibold">{formatPrice(order.totalAmount)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có lịch sử đơn hàng từ API.</p>
                    )}
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-semibold">Cập nhật thông tin</h4>
                    
                    <div className="space-y-2">
                      <Label>Phân loại khách hàng</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Chọn phân loại" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value={CustomerType.NEW}>Khách mới</SelectItem>
                              <SelectItem value={CustomerType.REGULAR}>Khách thường xuyên</SelectItem>
                              <SelectItem value={CustomerType.VIP}>Khách VIP</SelectItem>
                              <SelectItem value={CustomerType.WHOLESALE}>Khách sỉ</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Trạng thái tài khoản</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value={CustomerStatus.ACTIVE}>Đang hoạt động</SelectItem>
                              <SelectItem value={CustomerStatus.BLOCKED}>Khóa tài khoản</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter className="border-t p-6">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="rounded-xl w-full">
                  Đóng
                </Button>
                <Button type="submit" disabled={isSaving} className="rounded-xl w-full">
                  {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
                  Cập nhật
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
