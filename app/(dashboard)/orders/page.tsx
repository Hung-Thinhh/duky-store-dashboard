"use client"

import * as React from "react"
import {
  IconCheck,
  IconDownload,
  IconDotsVertical,
  IconEye,
  IconFilter,
  IconLoader2,
  IconPlus,
  IconPrinter,
  IconSearch,
  IconTrash,
  IconTruckDelivery,
  IconX,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Order } from "@/lib/api/schemas/order.schema"
import { OrderStatus, PaymentMethod, PaymentStatus, ShippingStatus } from "@/lib/api/schemas/enums"
import { ProductListItem } from "@/lib/api/schemas/product.schema"
import { ProductVariant } from "@/lib/api/schemas/variant.schema"
import { orderService } from "@/lib/api/services/order.service"
import { productService } from "@/lib/api/services/product.service"
import { variantService } from "@/lib/api/services/variant.service"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { color: string; label: string }> = {
  [OrderStatus.COMPLETED]: { color: "bg-emerald-100 text-emerald-700", label: "Hoàn thành" },
  [OrderStatus.PROCESSING]: { color: "bg-blue-100 text-blue-700", label: "Đang xử lý" },
  [OrderStatus.PENDING]: { color: "bg-amber-100 text-amber-700", label: "Chờ duyệt" },
  [OrderStatus.CANCELLED]: { color: "bg-rose-100 text-rose-700", label: "Đã hủy" },
  [OrderStatus.CONFIRMED]: { color: "bg-indigo-100 text-indigo-700", label: "Đã xác nhận" },
  [OrderStatus.SHIPPING]: { color: "bg-purple-100 text-purple-700", label: "Đang giao" },
  [OrderStatus.RETURNED]: { color: "bg-orange-100 text-orange-700", label: "Trả hàng" },
  [OrderStatus.REFUNDED]: { color: "bg-slate-100 text-slate-700", label: "Đã hoàn tiền" },
}

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  [PaymentStatus.PAID]: { color: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Đã thanh toán" },
  [PaymentStatus.UNPAID]: { color: "border-amber-200 bg-amber-50 text-amber-700", label: "Chưa thanh toán" },
  [PaymentStatus.PARTIALLY_PAID]: { color: "border-blue-200 bg-blue-50 text-blue-700", label: "Thanh toán một phần" },
  [PaymentStatus.REFUNDED]: { color: "border-slate-200 bg-slate-50 text-slate-700", label: "Đã hoàn tiền" },
  [PaymentStatus.FAILED]: { color: "border-rose-200 bg-rose-50 text-rose-700", label: "Thất bại" },
}

const shippingStatusLabels: Record<string, string> = {
  [ShippingStatus.NOT_SHIPPED]: "Chưa giao",
  [ShippingStatus.READY_TO_SHIP]: "Sẵn sàng giao",
  [ShippingStatus.SHIPPING]: "Đang giao",
  [ShippingStatus.DELIVERED]: "Đã giao",
  [ShippingStatus.RETURNED]: "Hoàn hàng",
}

type OrderTabValue = "all" | Order["status"]

const orderStatusTabs: Array<{ value: OrderTabValue; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: OrderStatus.PENDING, label: "Chờ duyệt" },
  { value: OrderStatus.CONFIRMED, label: "Đã xác nhận" },
  { value: OrderStatus.PROCESSING, label: "Đang xử lý" },
  { value: OrderStatus.SHIPPING, label: "Đang giao" },
  { value: OrderStatus.COMPLETED, label: "Hoàn thành" },
  { value: OrderStatus.RETURNED, label: "Trả hàng" },
  { value: OrderStatus.CANCELLED, label: "Đã hủy" },
]

type OrderEditForm = {
  customerName: string
  customerEmail: string
  customerPhone: string
  addressLine: string
  ward: string
  district: string
  province: string
  shippingFee: number
  discountAmount: number
}

type TrackingForm = {
  shippingCarrier: string
  trackingNumber: string
  shippingStatus: Order["shippingStatus"]
}

type PaymentForm = {
  paymentStatus: Order["paymentStatus"]
  transactionCode: string
}

const mockOrders: Order[] = [
  {
    id: "ord-10092",
    code: "DKY-10092",
    customerName: "Nguyễn Minh Anh",
    customerEmail: "minhanh@example.com",
    customerPhone: "0901 234 567",
    addressLine: "23 Nguyễn Trãi",
    ward: "Phường Bến Thành",
    district: "Quận 1",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: PaymentMethod.COD,
    shippingStatus: ShippingStatus.NOT_SHIPPED,
    subTotal: 1280000,
    shippingFee: 30000,
    discountAmount: 80000,
    totalAmount: 1230000,
    customerNote: "Gọi trước khi giao.",
    internalNote: "Khách mới, ưu tiên xác nhận trong ngày.",
    items: [
      { id: "item-1", productId: "p-1", productName: "Chelsea Boot Nam Mũi Nhọn", sku: "DKB001-40-DEN", quantity: 1, price: 890000 },
      { id: "item-2", productId: "p-2", productName: "Ví da nam basic", sku: "VDN-02", quantity: 1, price: 390000 },
    ],
    createdAt: "2026-05-12T02:35:00.000Z",
  },
  {
    id: "ord-10091",
    code: "DKY-10091",
    customerName: "Trần Hoàng Nam",
    customerEmail: "hoangnam@example.com",
    customerPhone: "0918 222 333",
    addressLine: "102 Lê Văn Sỹ",
    ward: "Phường 13",
    district: "Quận 3",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    shippingStatus: ShippingStatus.READY_TO_SHIP,
    subTotal: 1780000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 1780000,
    internalNote: "Đã chuyển khoản, chủ động gói.",
    items: [
      { id: "item-3", productId: "p-3", productName: "Giày Boot Nữ Cổ Thấp Jun Boot", sku: "DKG089-38-NAU", quantity: 2, price: 890000 },
    ],
    createdAt: "2026-05-11T14:20:00.000Z",
  },
  {
    id: "ord-10090",
    code: "DKY-10090",
    customerName: "Lê Thu Hà",
    customerEmail: "thuha@example.com",
    customerPhone: "0937 456 789",
    addressLine: "8 Phạm Văn Đồng",
    ward: "Hiệp Bình Chánh",
    district: "Thủ Đức",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.PROCESSING,
    paymentStatus: PaymentStatus.PARTIALLY_PAID,
    paymentMethod: PaymentMethod.MOMO,
    shippingStatus: ShippingStatus.READY_TO_SHIP,
    subTotal: 2390000,
    shippingFee: 35000,
    discountAmount: 150000,
    totalAmount: 2275000,
    internalNote: "Đã cọc 500k qua MoMo.",
    items: [
      { id: "item-4", productId: "p-4", productName: "Áo khoác da cổ bẻ", sku: "AKD-01-L-DEN", quantity: 1, price: 1590000 },
      { id: "item-5", productId: "p-5", productName: "Thắt lưng da trơn", sku: "TL-01", quantity: 1, price: 800000 },
    ],
    createdAt: "2026-05-11T09:10:00.000Z",
  },
  {
    id: "ord-10089",
    code: "DKY-10089",
    customerName: "Phạm Quốc Bảo",
    customerEmail: "quocbao@example.com",
    customerPhone: "0977 111 222",
    addressLine: "19 Trần Phú",
    ward: "Phường 4",
    district: "Quận 5",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.SHIPPING,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.VNPAY,
    shippingStatus: ShippingStatus.SHIPPING,
    subTotal: 980000,
    shippingFee: 25000,
    discountAmount: 0,
    totalAmount: 1005000,
    shippingNote: "Đơn đang bàn giao cho GHN.",
    items: [
      { id: "item-6", productId: "p-6", productName: "Sneaker trắng cổ thấp", sku: "SNK-TRANG-42", quantity: 1, price: 980000 },
    ],
    createdAt: "2026-05-10T16:45:00.000Z",
  },
  {
    id: "ord-10088",
    code: "DKY-10088",
    customerName: "Võ Thảo Vy",
    customerEmail: "thaovy@example.com",
    customerPhone: "0909 444 555",
    addressLine: "55 Hai Bà Trưng",
    ward: "Tân Định",
    district: "Quận 1",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.COMPLETED,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.COD,
    shippingStatus: ShippingStatus.DELIVERED,
    subTotal: 1320000,
    shippingFee: 0,
    discountAmount: 120000,
    totalAmount: 1200000,
    internalNote: "Đã giao thành công.",
    items: [
      { id: "item-7", productId: "p-7", productName: "Giày loafer nữ da mềm", sku: "LOAFER-NU-37", quantity: 1, price: 1320000 },
    ],
    createdAt: "2026-05-09T10:05:00.000Z",
  },
  {
    id: "ord-10087",
    code: "DKY-10087",
    customerName: "Đặng Gia Huy",
    customerEmail: "giahuy@example.com",
    customerPhone: "0986 777 888",
    addressLine: "7 Nguyễn Văn Cừ",
    ward: "Phường 2",
    district: "Quận 10",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.CANCELLED,
    paymentStatus: PaymentStatus.FAILED,
    paymentMethod: PaymentMethod.PAYOS,
    shippingStatus: ShippingStatus.NOT_SHIPPED,
    subTotal: 760000,
    shippingFee: 30000,
    discountAmount: 0,
    totalAmount: 790000,
    internalNote: "Khách thanh toán lỗi, đã hủy theo yêu cầu.",
    items: [
      { id: "item-8", productId: "p-8", productName: "Áo sơ mi hoa tiết", sku: "SM-HT-M", quantity: 2, price: 380000 },
    ],
    createdAt: "2026-05-08T07:25:00.000Z",
  },
  {
    id: "ord-10086",
    code: "DKY-10086",
    customerName: "Bùi Khánh Linh",
    customerEmail: "khanhlinh@example.com",
    customerPhone: "0945 999 000",
    addressLine: "88 Võ Văn Kiệt",
    ward: "Cô Giang",
    district: "Quận 1",
    province: "TP.HCM",
    country: "VN",
    status: OrderStatus.RETURNED,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.ZALOPAY,
    shippingStatus: ShippingStatus.RETURNED,
    subTotal: 1590000,
    shippingFee: 0,
    discountAmount: 0,
    totalAmount: 1590000,
    internalNote: "Khách trả lại hàng, chờ kiểm tra và hoàn tiền.",
    items: [
      { id: "item-9", productId: "p-9", productName: "Boot cổ cao da lộn", sku: "BOOT-DL-39", quantity: 1, price: 1590000 },
    ],
    createdAt: "2026-05-07T08:40:00.000Z",
  },
]

type ManualOrderItem = {
  lineId: string
  productId: string
  productName: string
  sku: string
  unitPrice: number
  availableQuantity: number | null
  variantId?: string | null
  quantity: number
  variants: ProductVariant[]
}

type InventoryLike = {
  quantity?: number | null
  reservedQuantity?: number | null
  availableQuantity?: number | null
} | null | undefined

type ProductSuggestion = ProductListItem & {
  availableQuantity: number | null
}

type ManualOrderForm = {
  customerName: string
  customerEmail: string
  customerPhone: string
  addressLine: string
  ward: string
  district: string
  province: string
  paymentMethod: Order["paymentMethod"]
  source: "DIRECT" | "ONLINE"
  shippingFee: number
  discountAmount: number
  customerNote: string
  internalNote: string
}

const createEmptyManualOrder = (): ManualOrderForm => ({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  addressLine: "",
  ward: "",
  district: "",
  province: "TP.HCM",
  paymentMethod: PaymentMethod.COD,
  source: "ONLINE",
  shippingFee: 30000,
  discountAmount: 0,
  customerNote: "",
  internalNote: "",
})

const createEmptyManualItem = (): ManualOrderItem => ({
  lineId: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  productId: "",
  productName: "",
  sku: "",
  unitPrice: 0,
  availableQuantity: null,
  variantId: null,
  quantity: 1,
  variants: [],
})

const getInventoryAvailableQuantity = (inventory: InventoryLike) => {
  if (!inventory) return null
  if (typeof inventory.availableQuantity === "number") return inventory.availableQuantity

  if (typeof inventory.quantity !== "number") return null

  const reservedQuantity = typeof inventory.reservedQuantity === "number" ? inventory.reservedQuantity : 0
  return inventory.quantity - reservedQuantity
}

const getVariantsAvailableQuantity = (variants: ProductVariant[]) => {
  let hasInventory = false
  const total = variants.reduce((sum, variant) => {
    const availableQuantity = getInventoryAvailableQuantity(variant.inventory)
    if (availableQuantity === null) return sum

    hasInventory = true
    return sum + availableQuantity
  }, 0)

  return hasInventory ? total : null
}

const enrichProductSuggestion = async (product: ProductListItem): Promise<ProductSuggestion> => {
  try {
    if (product.type === "VARIABLE") {
      const variants = await variantService.getVariantsByProduct(product.id, { isActive: true })
      return {
        ...product,
        availableQuantity: getVariantsAvailableQuantity(variants),
      }
    }

    const detail = await productService.getProduct(product.id)
    return {
      ...product,
      availableQuantity: getInventoryAvailableQuantity(detail.inventory),
    }
  } catch (error) {
    console.error("Failed to fetch product stock", product.id, error)
    return {
      ...product,
      availableQuantity: null,
    }
  }
}

const getStockBadgeClassName = (availableQuantity: number | null) =>
  cn(
    "shrink-0 rounded-md border-0 px-2 py-0.5 text-[11px] font-medium",
    availableQuantity === null
      ? "bg-muted text-muted-foreground"
      : availableQuantity <= 0
        ? "bg-danger-soft text-danger"
        : "bg-success-soft text-success"
  )

const getManualOrderAddressLine = (manualOrder: ManualOrderForm) => {
  const addressLine = manualOrder.addressLine.trim()

  if (manualOrder.source === "DIRECT") {
    return addressLine.length >= 3 ? addressLine : "Tại cửa hàng"
  }

  return addressLine
}

const getApiErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "EM" in error) {
    const message = (error as { EM?: unknown }).EM
    if (typeof message === "string" && message.trim()) return message
  }

  return null
}

const isLikelySizeValue = (value: string) => {
  return /^(\d{1,3}|[xsml]{1,4}|[1-9]xl|free|freesize)$/i.test(value.trim())
}

const getOrderItemVariantLabel = (item: Order["items"][number]) => {
  const labels: string[] = []
  if (item.variant?.sizeLabel) labels.push(`Size: ${item.variant.sizeLabel}`)
  if (item.variant?.colorName) labels.push(`Màu: ${item.variant.colorName}`)
  if (labels.length) return labels.join(" - ")

  const variantName = item.variantName?.trim() || item.variant?.name?.trim()
  if (!variantName) return null

  if (/^(size|màu|mau|color|phân loại|phan loai)\s*:/i.test(variantName)) {
    return variantName
  }

  const parts = variantName.split(/\s+(?:-|\/)\s+/).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2 && isLikelySizeValue(parts[0])) {
    return `Size: ${parts[0]} - Màu: ${parts.slice(1).join(" - ")}`
  }

  if (isLikelySizeValue(variantName)) {
    return `Size: ${variantName}`
  }

  return `Phân loại: ${variantName}`
}

const getOrderItemDisplayName = (item: Order["items"][number]) => {
  const variantLabel = getOrderItemVariantLabel(item)
  return variantLabel ? `${item.productName} - ${variantLabel}` : item.productName
}

const getVariantOptionLabel = (variant: ProductVariant) => {
  const labels: string[] = []
  if (variant.sizeLabel) labels.push(`Size: ${variant.sizeLabel}`)
  if (variant.colorName) labels.push(`Màu: ${variant.colorName}`)
  if (labels.length) return labels.join(" - ")

  const fallbackLabel = getOrderItemVariantLabel({
    id: variant.id,
    productId: variant.productId,
    productName: variant.product?.name ?? "",
    variantId: variant.id,
    variantName: variant.name,
    sku: variant.sku,
    quantity: 1,
    price: (variant.salePrice != null && variant.salePrice > 0) ? variant.salePrice : (variant.price ?? 0),
  })

  return fallbackLabel ?? variant.sku
}

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUsingMock, setIsUsingMock] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<OrderTabValue>("all")
  const [paymentFilter, setPaymentFilter] = React.useState("ALL")
  const [shippingFilter, setShippingFilter] = React.useState("ALL")
  const [sourceFilter, setSourceFilter] = React.useState("ALL")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [internalNote, setInternalNote] = React.useState("")
  const [orderEdit, setOrderEdit] = React.useState<OrderEditForm | null>(null)
  const [trackingForm, setTrackingForm] = React.useState<TrackingForm | null>(null)
  const [paymentForm, setPaymentForm] = React.useState<PaymentForm | null>(null)
  const [orderFeedback, setOrderFeedback] = React.useState<string | null>(null)
  const [manualOrder, setManualOrder] = React.useState<ManualOrderForm>(() => createEmptyManualOrder())
  const [manualItems, setManualItems] = React.useState<ManualOrderItem[]>([createEmptyManualItem()])
  const [productSearch, setProductSearch] = React.useState<Record<string, string>>({})
  const [productSuggestions, setProductSuggestions] = React.useState<Record<string, ProductSuggestion[]>>({})
  const [loadingSuggestLine, setLoadingSuggestLine] = React.useState<string | null>(null)

  const fetchOrders = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await orderService.getOrders({ limit: 50 })
      if (data.data.length) {
        setOrders(data.data)
        setIsUsingMock(false)
      } else {
        setOrders(mockOrders)
        setIsUsingMock(true)
      }
    } catch (error) {
      console.error("Failed to fetch orders", error)
      setOrders(mockOrders)
      setIsUsingMock(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    queueMicrotask(fetchOrders)
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase()
    const createdDate = order.createdAt ? new Date(order.createdAt) : null
    const matchesSearch =
      order.code.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerPhone.toLowerCase().includes(query) ||
      order.items.some((item) => getOrderItemDisplayName(item).toLowerCase().includes(query) || item.sku.toLowerCase().includes(query))
    const matchesTab =
      activeTab === "all" ||
      (activeTab === OrderStatus.RETURNED
        ? order.status === OrderStatus.RETURNED ||
          order.shippingStatus === ShippingStatus.RETURNED
        : order.status === activeTab)
    const matchesPayment = paymentFilter === "ALL" || order.paymentStatus === paymentFilter
    const matchesShipping = shippingFilter === "ALL" || order.shippingStatus === shippingFilter
    const matchesSource = sourceFilter === "ALL" || (order.source || "ONLINE") === sourceFilter
    const matchesFrom = !dateFrom || (createdDate && createdDate >= new Date(`${dateFrom}T00:00:00`))
    const matchesTo = !dateTo || (createdDate && createdDate <= new Date(`${dateTo}T23:59:59`))
    return matchesSearch && matchesTab && matchesPayment && matchesShipping && matchesSource && matchesFrom && matchesTo
  })

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order)
    setInternalNote(order.internalNote || "")
    setOrderFeedback(null)
    setOrderEdit({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      addressLine: order.addressLine,
      ward: order.ward,
      district: order.district,
      province: order.province,
      shippingFee: order.shippingFee,
      discountAmount: order.discountAmount,
    })
    setTrackingForm({
      shippingCarrier: order.shippingCarrier || "",
      trackingNumber: order.trackingNumber || "",
      shippingStatus: order.shippingStatus,
    })
    setPaymentForm({
      paymentStatus: order.paymentStatus,
      transactionCode: order.transactionCode || "",
    })
    setIsDialogOpen(true)
  }

  const updateOrderStatus = (order: Order, status: Order["status"]) => {
    const applyLocal = (nextOrder: Order) => {
      setOrders((current) => current.map((currentOrder) => (currentOrder.id === order.id ? nextOrder : currentOrder)))
      setSelectedOrder(nextOrder)
      setOrderFeedback(`Đã cập nhật trạng thái ${nextOrder.code}.`)
    }

    if (isUsingMock) {
      applyLocal({
        ...order,
        status,
        cancelledAt: status === OrderStatus.CANCELLED ? new Date().toISOString() : order.cancelledAt,
        completedAt: status === OrderStatus.COMPLETED ? new Date().toISOString() : order.completedAt,
        returnedAt: status === OrderStatus.RETURNED ? new Date().toISOString() : order.returnedAt,
        shippingStatus: status === OrderStatus.RETURNED ? ShippingStatus.RETURNED : order.shippingStatus,
      })
      return
    }

    const request =
      status === OrderStatus.CANCELLED
        ? orderService.cancelOrder(order.id, "Hủy từ dashboard")
        : orderService.updateOrderStatus(order.id, { status })

    request
      .then((updated) => applyLocal(updated))
      .catch((error) => {
        console.error("Failed to update order status", error)
        setOrderFeedback(getApiErrorMessage(error) || "Cập nhật trạng thái thất bại.")
      })
  }

  const handleUpdateStatus = (status: Order["status"]) => {
    if (!selectedOrder) return
    updateOrderStatus(selectedOrder, status)
  }

  const applySelectedOrderPatch = (patch: Partial<Order>) => {
    if (!selectedOrder) return
    const nextOrder = { ...selectedOrder, ...patch }
    setOrders((current) => current.map((order) => (order.id === selectedOrder.id ? nextOrder : order)))
    setSelectedOrder(nextOrder)
  }

  const handleSaveNote = async () => {
    if (!selectedOrder) return
    try {
      if (!isUsingMock) {
        const updated = await orderService.updateOrderNote(selectedOrder.id, internalNote)
        applySelectedOrderPatch(updated)
      } else {
        applySelectedOrderPatch({ internalNote })
      }
      setOrderFeedback("Đã lưu ghi chú nội bộ.")
    } catch (error) {
      console.error("Failed to save order note", error)
      setOrderFeedback("Lưu ghi chú thất bại.")
    }
  }

  const saveOrderEdit = () => {
    if (!selectedOrder || !orderEdit) return
    const subTotal = selectedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    applySelectedOrderPatch({
      ...orderEdit,
      subTotal,
      totalAmount: Math.max(0, subTotal + orderEdit.shippingFee - orderEdit.discountAmount),
    })
    setOrderFeedback(isUsingMock ? "Đã cập nhật đơn mock." : "Đã cập nhật bản nháp trên giao diện. Backend hiện chưa có endpoint sửa chi tiết đơn.")
  }

  const saveTracking = () => {
    if (!selectedOrder || !trackingForm) return
    const nextStatus = trackingForm.shippingStatus
    applySelectedOrderPatch({
      shippingCarrier: trackingForm.shippingCarrier,
      trackingNumber: trackingForm.trackingNumber,
      shippingStatus: nextStatus,
      status: nextStatus === ShippingStatus.SHIPPING ? OrderStatus.SHIPPING : selectedOrder.status,
      shippingNote: [trackingForm.shippingCarrier, trackingForm.trackingNumber].filter(Boolean).join(" - ") || selectedOrder.shippingNote,
    })
    setOrderFeedback("Đã cập nhật vận chuyển/tracking.")
  }

  const savePayment = async () => {
    if (!selectedOrder || !paymentForm) return
    try {
      if (!isUsingMock) {
        const updated = await orderService.updatePayment(selectedOrder.id, {
          status: paymentForm.paymentStatus,
          transactionCode: paymentForm.transactionCode || undefined,
        })
        applySelectedOrderPatch(updated)
      } else {
        applySelectedOrderPatch({
          paymentStatus: paymentForm.paymentStatus,
          transactionCode: paymentForm.transactionCode,
          paidAt: paymentForm.paymentStatus === PaymentStatus.PAID ? new Date().toISOString() : selectedOrder.paidAt,
        })
      }
      setOrderFeedback("Đã cập nhật thanh toán.")
    } catch (error) {
      console.error("Failed to update payment", error)
      setOrderFeedback("Cập nhật thanh toán thất bại.")
    }
  }

  const resetManualOrder = () => {
    setManualOrder(createEmptyManualOrder())
    setManualItems([createEmptyManualItem()])
    setProductSearch({})
    setProductSuggestions({})
    setCreateError(null)
  }

  const manualOrderTotals = React.useMemo(() => {
    const subTotal = manualItems.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity
    }, 0)
    const totalAmount = Math.max(0, subTotal + manualOrder.shippingFee - manualOrder.discountAmount)
    return { subTotal, totalAmount }
  }, [manualItems, manualOrder.shippingFee, manualOrder.discountAmount])

  const updateManualOrder = (field: keyof ManualOrderForm, value: string | number) => {
    setManualOrder((current) => ({ ...current, [field]: value }))
  }

  const updateManualItem = (lineId: string, patch: Partial<ManualOrderItem>) => {
    setManualItems((current) =>
      current.map((item) => (item.lineId === lineId ? { ...item, ...patch } : item))
    )
  }

  const addManualItem = () => {
    setManualItems((current) => [...current, createEmptyManualItem()])
  }

  const removeManualItem = (lineId: string) => {
    setManualItems((current) => current.filter((item) => item.lineId !== lineId))
  }

  const searchProductsForLine = async (lineId: string, keyword: string) => {
    setProductSearch((current) => ({ ...current, [lineId]: keyword }))

    if (keyword.trim().length < 2) {
      setProductSuggestions((current) => ({ ...current, [lineId]: [] }))
      return
    }

    try {
      setLoadingSuggestLine(lineId)
      const data = await productService.getProducts({
        search: keyword.trim(),
        limit: 8,
        status: "PUBLISHED",
      })
      const suggestionsWithStock = await Promise.all(data.data.map(enrichProductSuggestion))
      setProductSuggestions((current) => ({ ...current, [lineId]: suggestionsWithStock }))
    } catch (error) {
      console.error("Failed to search products", error)
      setProductSuggestions((current) => ({ ...current, [lineId]: [] }))
    } finally {
      setLoadingSuggestLine(null)
    }
  }

  const selectProductForLine = async (lineId: string, product: ProductListItem) => {
    try {
      const [detail, variants] = await Promise.all([
        productService.getProduct(product.id),
        variantService.getVariantsByProduct(product.id, { isActive: true }),
      ])
      const hasVariants = variants.length > 0
      const firstVariant = variants[0]
      const inventory = hasVariants ? firstVariant.inventory : detail.inventory
      const unitPrice = hasVariants
        ? (firstVariant.salePrice != null && firstVariant.salePrice > 0)
          ? firstVariant.salePrice
          : firstVariant.price ?? (detail.salePrice != null && detail.salePrice > 0 ? detail.salePrice : detail.originalPrice)
        : (detail.salePrice != null && detail.salePrice > 0)
          ? detail.salePrice
          : detail.originalPrice

      setManualItems((current) =>
        current.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                productId: detail.id,
                productName: detail.name,
                variantId: firstVariant?.id ?? null,
                sku: firstVariant?.sku ?? detail.sku ?? "",
                unitPrice,
                availableQuantity: inventory
                  ? (inventory.quantity ?? 0) - (inventory.reservedQuantity ?? 0)
                  : null,
                variants,
                quantity: 1,
              }
            : item
        )
      )
      setProductSearch((current) => ({ ...current, [lineId]: detail.name }))
      setProductSuggestions((current) => ({ ...current, [lineId]: [] }))
    } catch (error) {
      console.error("Failed to select product", error)
      setCreateError("Không tải được biến thể/tồn kho của sản phẩm vừa chọn.")
    }
  }

  const selectVariantForLine = (lineId: string, variantId: string) => {
    setManualItems((current) =>
      current.map((item) => {
        if (item.lineId !== lineId) return item
        const variant = item.variants.find((candidate) => candidate.id === variantId)
        if (!variant) return item

        return {
          ...item,
          variantId: variant.id,
          sku: variant.sku,
          unitPrice: (variant.salePrice != null && variant.salePrice > 0) ? variant.salePrice : (variant.price ?? item.unitPrice),
          availableQuantity: variant.inventory
            ? (variant.inventory.quantity ?? 0) - (variant.inventory.reservedQuantity ?? 0)
            : null,
          quantity: 1,
        }
      })
    )
  }

  const handleCreateManualOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    const addressLine = getManualOrderAddressLine(manualOrder)
    if (manualOrder.source === "ONLINE" && addressLine.length < 3) {
      setCreateError("Anh nhập địa chỉ giao hàng tối thiểu 3 ký tự trước khi tạo đơn online.")
      return
    }

    const invalidItem = manualItems.find((item) => !item.productId)
    if (invalidItem) {
      setCreateError("Anh cần chọn đủ sản phẩm cho từng dòng trước khi tạo đơn.")
      return
    }

    try {
      setIsCreating(true)
      const created = await orderService.createOrder({
        customerName: manualOrder.customerName.trim(),
        customerEmail: manualOrder.customerEmail.trim() || undefined,
        customerPhone: manualOrder.customerPhone.trim(),
        paymentMethod: manualOrder.paymentMethod,
        source: manualOrder.source,
        addressLine,
        ward: manualOrder.ward.trim() || undefined,
        district: manualOrder.district.trim() || undefined,
        province: manualOrder.province.trim() || undefined,
        country: "VN",
        shippingFee: manualOrder.source === "DIRECT" ? 0 : manualOrder.shippingFee,
        discountAmount: manualOrder.discountAmount,
        customerNote: manualOrder.customerNote.trim() || undefined,
        internalNote: manualOrder.internalNote.trim() || undefined,
        items: manualItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
      })

      setOrders((current) => [created, ...current.filter((order) => order.id !== created.id)])
      setIsUsingMock(false)
      setSelectedOrder(created)
      setInternalNote(created.internalNote || "")
      setIsCreateDialogOpen(false)
      setIsDialogOpen(true)
      setActiveTab("all")
      resetManualOrder()
    } catch (error) {
      console.error("Failed to create order", error)
      setCreateError(getApiErrorMessage(error) ?? "Tạo đơn thất bại. Có thể sản phẩm không đủ tồn kho hoặc phiên đăng nhập hết hạn.")
    } finally {
      setIsCreating(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  const formatQuantity = (quantity: number | null) => {
    if (quantity === null) return "N/A"
    return new Intl.NumberFormat("vi-VN").format(quantity)
  }

  const exportOrdersCsv = () => {
    const csvRows = [
      ["Mã đơn", "Khách hàng", "Số điện thoại", "Trạng thái", "Thanh toán", "Vận chuyển", "Nguồn", "Tạm tính", "Phí vận chuyển", "Giảm giá", "Tổng", "Ngày tạo"],
      ...filteredOrders.map((order) => [
        order.code,
        order.customerName,
        order.customerPhone,
        order.status,
        order.paymentStatus,
        order.shippingStatus,
        order.source || "ONLINE",
        String(order.subTotal),
        String(order.shippingFee),
        String(order.discountAmount),
        String(order.totalAmount),
        order.createdAt || "",
      ]),
    ]
    const csv = csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `duky-orders-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const openPrintWindow = (title: string, body: string) => {
    const printWindow = window.open("", "_blank", "width=820,height=900")
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}.right{text-align:right}.muted{color:#666}.total{font-size:20px;font-weight:700}</style></head><body>${body}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const printOrder = (order: Order) => {
    openPrintWindow(
      `Hoa don ${order.code}`,
      `<h1>Hóa đơn ${order.code}</h1><p class="muted">${order.customerName} - ${order.customerPhone}</p><p>${order.addressLine}, ${order.ward}, ${order.district}, ${order.province}</p><table><thead><tr><th>Sản phẩm</th><th>SKU</th><th class="right">SL</th><th class="right">Giá</th></tr></thead><tbody>${order.items.map((item) => `<tr><td>${getOrderItemDisplayName(item)}</td><td>${item.sku}</td><td class="right">${item.quantity}</td><td class="right">${formatPrice(item.price)}</td></tr>`).join("")}</tbody></table><p class="right">Phí vận chuyển: ${formatPrice(order.shippingFee)}</p><p class="right">Giảm giá: ${formatPrice(order.discountAmount)}</p><p class="right total">Tổng: ${formatPrice(order.totalAmount)}</p>`
    )
  }

  const printShippingSlip = (order: Order) => {
    openPrintWindow(
      `Phieu giao ${order.code}`,
      `<h1>Phiếu giao hàng ${order.code}</h1><h2>Người nhận</h2><p><strong>${order.customerName}</strong> - ${order.customerPhone}</p><p>${order.addressLine}, ${order.ward}, ${order.district}, ${order.province}</p><h2>Vận chuyển</h2><p>Đơn vị: ${order.shippingCarrier || "Chưa chọn"}</p><p>Mã vận đơn: ${order.trackingNumber || "Chưa có"}</p><p>Trạng thái: ${shippingStatusLabels[order.shippingStatus] || order.shippingStatus}</p><h2>Hàng hóa</h2><ul>${order.items.map((item) => `<li>${getOrderItemDisplayName(item)} x ${item.quantity} (${item.sku})</li>`).join("")}</ul><p class="total">Thu hộ: ${order.paymentStatus === PaymentStatus.PAID ? "0 đ" : formatPrice(order.totalAmount)}</p>`
    )
  }

  const getTimeline = (order: Order) => [
    { label: "Tạo đơn", active: true, time: order.createdAt },
    { label: "Xác nhận", active: order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED },
    { label: "Thanh toán", active: order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.REFUNDED, time: order.paidAt },
    { label: "Đang giao", active: order.shippingStatus === ShippingStatus.SHIPPING || order.shippingStatus === ShippingStatus.DELIVERED },
    { label: "Hoàn thành", active: order.status === OrderStatus.COMPLETED || order.status === OrderStatus.RETURNED || order.status === OrderStatus.REFUNDED, time: order.completedAt },
    { label: "Trả hàng", active: order.status === OrderStatus.RETURNED || order.shippingStatus === ShippingStatus.RETURNED, time: order.returnedAt },
    { label: "Hủy/hoàn tiền", active: order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED, time: order.cancelledAt },
  ]

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dữ liệu mẫu để test giao diện quản lý đơn hàng, trạng thái và thanh toán.
          </p>
          {isUsingMock && (
            <Badge variant="secondary" className="mt-2 rounded-md border-0 bg-warning-soft text-warning">
              Đang hiển thị dữ liệu mẫu vì API chưa có dữ liệu hoặc đang lỗi
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={exportOrdersCsv}>
            <IconDownload className="mr-2 size-4" />
            CSV
          </Button>
          <Button className="rounded-xl" onClick={() => setIsCreateDialogOpen(true)}>
            <IconPlus className="mr-2 size-4" />
            Tạo đơn thủ công
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as OrderTabValue)}
          className="w-full overflow-x-auto md:w-auto"
        >
          <TabsList className="h-10 w-max rounded-xl bg-muted/50 p-1">
            {orderStatusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm mã đơn, khách, SĐT, SKU..."
              className="w-full rounded-xl pl-9 md:w-[320px]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl">
            <IconFilter className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-xl" />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-xl" />
        <select className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
          <option value="ALL">Tất cả thanh toán</option>
          {Object.values(PaymentStatus).map((status) => <option key={status} value={status}>{paymentStatusConfig[status]?.label || status}</option>)}
        </select>
        <select className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm" value={shippingFilter} onChange={(event) => setShippingFilter(event.target.value)}>
          <option value="ALL">Tất cả vận chuyển</option>
          {Object.values(ShippingStatus).map((status) => <option key={status} value={status}>{shippingStatusLabels[status] || status}</option>)}
        </select>
        <select className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="ALL">Tất cả nguồn</option>
          <option value="ONLINE">Online</option>
          <option value="DIRECT">Tại cửa hàng</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 w-[120px]">Mã đơn</TableHead>
              <TableHead className="h-12">Khách hàng</TableHead>
              <TableHead className="h-12">Sản phẩm</TableHead>
              <TableHead className="h-12">Ngày đặt</TableHead>
              <TableHead className="h-12 text-right">Tổng tiền</TableHead>
              <TableHead className="h-12 text-center">Trạng thái</TableHead>
              <TableHead className="h-12 w-[150px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <IconLoader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => handleRowClick(order)}>
                  <TableCell className="font-medium text-primary">{order.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customerName}</span>
                      <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate" title={order.items.map(getOrderItemDisplayName).join(", ")}>
                    {order.items.map(getOrderItemDisplayName).join(", ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`${statusConfig[order.status]?.color} rounded-md border-transparent hover:opacity-80`}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === OrderStatus.PENDING && (
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                          onClick={(event) => {
                            event.stopPropagation()
                            updateOrderStatus(order, OrderStatus.CONFIRMED)
                          }}
                        >
                          <IconCheck className="size-4" />
                          Duyệt
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={(event) => event.stopPropagation()}>
                            <IconDotsVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); handleRowClick(order) }} className="cursor-pointer rounded-lg">
                            <IconEye className="mr-2 size-4" /> Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Đổi trạng thái</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); updateOrderStatus(order, OrderStatus.CONFIRMED) }} className="cursor-pointer rounded-lg">
                            <IconCheck className="mr-2 size-4 text-emerald-600" /> Đã xác nhận
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); updateOrderStatus(order, OrderStatus.PROCESSING) }} className="cursor-pointer rounded-lg">
                            <IconLoader2 className="mr-2 size-4 text-blue-600" /> Đang xử lý
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); updateOrderStatus(order, OrderStatus.SHIPPING) }} className="cursor-pointer rounded-lg">
                            <IconTruckDelivery className="mr-2 size-4 text-purple-600" /> Đang giao
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); updateOrderStatus(order, OrderStatus.COMPLETED) }} className="cursor-pointer rounded-lg">
                            <IconCheck className="mr-2 size-4 text-emerald-600" /> Hoàn thành
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); updateOrderStatus(order, OrderStatus.RETURNED) }} className="cursor-pointer rounded-lg">
                            <IconTruckDelivery className="mr-2 size-4 text-orange-600" /> Trả hàng
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); updateOrderStatus(order, OrderStatus.CANCELLED) }} className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <IconX className="mr-2 size-4" /> Hủy đơn này
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="grid max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 [&>button]:right-5 [&>button]:top-5">
          <form onSubmit={handleCreateManualOrder} className="contents">
            <DialogHeader className="border-b p-6 pb-5 text-left">
              <DialogTitle className="text-2xl font-bold tracking-tight">Tạo đơn thủ công</DialogTitle>
              <DialogDescription>
                Nhập thông tin khách hàng, chọn sản phẩm và kiểm tra tổng tiền trước khi tạo đơn.
              </DialogDescription>
              {createError && (
                <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createError}
                </div>
              )}
            </DialogHeader>

            <div className="min-h-0 overflow-y-auto">
              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Khách hàng</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input
                        required
                        placeholder="Tên khách hàng *"
                        className="rounded-xl"
                        value={manualOrder.customerName}
                        onChange={(event) => updateManualOrder("customerName", event.target.value)}
                      />
                      <Input
                        required
                        placeholder="Số điện thoại *"
                        className="rounded-xl"
                        value={manualOrder.customerPhone}
                        onChange={(event) => updateManualOrder("customerPhone", event.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        className="rounded-xl"
                        value={manualOrder.customerEmail}
                        onChange={(event) => updateManualOrder("customerEmail", event.target.value)}
                      />
                      <select
                        className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        value={manualOrder.paymentMethod}
                        onChange={(event) => updateManualOrder("paymentMethod", event.target.value as Order["paymentMethod"])}
                      >
                        <option value={PaymentMethod.COD}>COD</option>
                        <option value={PaymentMethod.BANK_TRANSFER}>Chuyển khoản</option>
                        <option value={PaymentMethod.MOMO}>MoMo</option>
                        <option value={PaymentMethod.VNPAY}>VNPAY</option>
                        <option value={PaymentMethod.PAYOS}>PayOS</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Địa chỉ giao hàng</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input
                        required={manualOrder.source === "ONLINE"}
                        minLength={manualOrder.source === "ONLINE" ? 3 : undefined}
                        placeholder={manualOrder.source === "ONLINE" ? "Địa chỉ *" : "Địa chỉ (nếu có)"}
                        className="rounded-xl md:col-span-2"
                        value={manualOrder.addressLine}
                        onChange={(event) => updateManualOrder("addressLine", event.target.value)}
                      />
                      <Input
                        placeholder="Phường/Xã"
                        className="rounded-xl"
                        value={manualOrder.ward}
                        onChange={(event) => updateManualOrder("ward", event.target.value)}
                      />
                      <Input
                        placeholder="Quận/Huyện"
                        className="rounded-xl"
                        value={manualOrder.district}
                        onChange={(event) => updateManualOrder("district", event.target.value)}
                      />
                      <Input
                        placeholder="Tỉnh/Thành phố"
                        className="rounded-xl md:col-span-2"
                        value={manualOrder.province}
                        onChange={(event) => updateManualOrder("province", event.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sản phẩm</h3>
                      <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={addManualItem}>
                        <IconPlus className="mr-2 size-4" />
                        Thêm dòng
                      </Button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {manualItems.map((item) => {
                        const suggestions = productSuggestions[item.lineId] ?? []
                        return (
                          <div key={item.lineId} className="grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[minmax(0,1fr)_150px_110px_42px]">
                            <div className="relative md:col-span-4">
                              <Input
                                className="rounded-xl"
                                placeholder="Gõ tên sản phẩm hoặc SKU..."
                                value={productSearch[item.lineId] ?? item.productName}
                                onChange={(event) => searchProductsForLine(item.lineId, event.target.value)}
                              />
                              {loadingSuggestLine === item.lineId && (
                                <IconLoader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
                              )}
                              {suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-10 z-20 overflow-hidden rounded-xl border bg-popover shadow-lg">
                                  {suggestions.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                                      onClick={() => selectProductForLine(item.lineId, product)}
                                    >
                                      <span className="flex w-full items-start justify-between gap-3">
                                        <span className="min-w-0 truncate font-medium text-foreground">{product.name}</span>
                                        <Badge variant="secondary" className={getStockBadgeClassName(product.availableQuantity)}>
                                          Tồn: {formatQuantity(product.availableQuantity)}
                                        </Badge>
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        SKU: {product.sku || "N/A"} - {formatPrice(product.salePrice ?? product.originalPrice)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-muted-foreground">
                                {item.productId
                                  ? `${item.sku || "N/A"} - ${formatPrice(item.unitPrice)} - Tồn khả dụng: ${item.availableQuantity ?? "N/A"}`
                                  : "Chọn đúng sản phẩm để hiện biến thể và tồn kho"}
                              </div>
                            </div>
                            <select
                              className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
                              value={item.variantId ?? ""}
                              disabled={!item.variants.length}
                              onChange={(event) => selectVariantForLine(item.lineId, event.target.value)}
                            >
                              {!item.variants.length ? (
                                <option value="">Sản phẩm đơn</option>
                              ) : (
                                item.variants.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {getVariantOptionLabel(variant)} - Tồn: {formatQuantity(getInventoryAvailableQuantity(variant.inventory))}
                                  </option>
                                ))
                              )}
                            </select>
                            <div>
                              <Input
                                type="number"
                                min={1}
                                max={item.availableQuantity ?? undefined}
                                className="rounded-xl"
                                value={item.quantity}
                                onChange={(event) => updateManualItem(item.lineId, { quantity: Math.max(1, Number(event.target.value) || 1) })}
                              />
                              <div className="mt-1 text-xs text-muted-foreground">{formatPrice(item.unitPrice * item.quantity)}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-destructive"
                              disabled={manualItems.length <= 1}
                              onClick={() => removeManualItem(item.lineId)}
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kênh bán</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={manualOrder.source === "ONLINE" ? "default" : "outline"}
                        className="rounded-xl"
                        onClick={() => updateManualOrder("source", "ONLINE")}
                      >
                        Mua online
                      </Button>
                      <Button
                        type="button"
                        variant={manualOrder.source === "DIRECT" ? "default" : "outline"}
                        className="rounded-xl"
                        onClick={() => {
                          updateManualOrder("source", "DIRECT")
                          updateManualOrder("shippingFee", 0)
                        }}
                      >
                        Mua trực tiếp
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Mua trực tiếp sẽ tạo đơn hoàn thành, thanh toán đã ghi nhận và không tính phí vận chuyển.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tổng kết đơn</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tạm tính</span>
                        <span className="font-medium">{formatPrice(manualOrderTotals.subTotal)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="mb-1 block text-xs text-muted-foreground">Phí vận chuyển</span>
                          <Input
                            type="number"
                            min={0}
                            className="rounded-xl"
                            disabled={manualOrder.source === "DIRECT"}
                            value={manualOrder.shippingFee}
                            onChange={(event) => updateManualOrder("shippingFee", Math.max(0, Number(event.target.value) || 0))}
                          />
                        </div>
                        <div>
                          <span className="mb-1 block text-xs text-muted-foreground">Giảm giá</span>
                          <Input
                            type="number"
                            min={0}
                            className="rounded-xl"
                            value={manualOrder.discountAmount}
                            onChange={(event) => updateManualOrder("discountAmount", Math.max(0, Number(event.target.value) || 0))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="font-medium text-foreground">Tổng cần thu</span>
                        <span className="text-xl font-bold text-primary">{formatPrice(manualOrderTotals.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Textarea
                      placeholder="Ghi chú khách hàng..."
                      className="min-h-[92px] resize-none rounded-xl"
                      value={manualOrder.customerNote}
                      onChange={(event) => updateManualOrder("customerNote", event.target.value)}
                    />
                    <Textarea
                      placeholder="Ghi chú nội bộ..."
                      className="min-h-[92px] resize-none rounded-xl"
                      value={manualOrder.internalNote}
                      onChange={(event) => updateManualOrder("internalNote", event.target.value)}
                    />
                  </div>
                </section>
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/10 p-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetManualOrder()
                }}
              >
                Hủy
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isCreating}>
                {isCreating ? "Đang tạo..." : "Tạo đơn"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="grid max-h-[88vh] w-[calc(100%-2rem)] max-w-6xl grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 [&>button]:right-5 [&>button]:top-5">
          {selectedOrder && (
            <>
              <DialogHeader className="border-b p-6 pb-5 text-left">
                <div className="flex items-center gap-3 pr-8">
                  <DialogTitle className="text-2xl font-bold tracking-tight">{selectedOrder.code}</DialogTitle>
                  <Badge variant="secondary" className={`${statusConfig[selectedOrder.status]?.color} rounded-md`}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <DialogDescription className="mt-1.5">
                  Ngày đặt: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("vi-VN") : "N/A"}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 overflow-y-auto">
                <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thông tin khách hàng</h3>
                    <div className="rounded-xl border bg-card p-4 text-sm shadow-sm">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Tên khách hàng</span>
                          <span className="text-base font-medium">{selectedOrder.customerName}</span>
                        </div>
                        <div>
                          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Email</span>
                          <span>{selectedOrder.customerEmail}</span>
                        </div>
                        <div>
                          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Số điện thoại</span>
                          <span>{selectedOrder.customerPhone}</span>
                        </div>
                        <div>
                          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Địa chỉ giao hàng</span>
                          <span>{selectedOrder.addressLine}, {selectedOrder.ward}, {selectedOrder.district}, {selectedOrder.province}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {orderFeedback && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      {orderFeedback}
                    </div>
                  )}

                  {orderEdit && (
                    <section>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sửa nhanh đơn hàng</h3>
                      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2">
                        <Input value={orderEdit.customerName} onChange={(event) => setOrderEdit((current) => current && ({ ...current, customerName: event.target.value }))} className="rounded-xl" placeholder="Tên khách" />
                        <Input value={orderEdit.customerPhone} onChange={(event) => setOrderEdit((current) => current && ({ ...current, customerPhone: event.target.value }))} className="rounded-xl" placeholder="Số điện thoại" />
                        <Input value={orderEdit.customerEmail} onChange={(event) => setOrderEdit((current) => current && ({ ...current, customerEmail: event.target.value }))} className="rounded-xl" placeholder="Email" />
                        <Input value={orderEdit.addressLine} onChange={(event) => setOrderEdit((current) => current && ({ ...current, addressLine: event.target.value }))} className="rounded-xl" placeholder="Địa chỉ  " />
                        <Input value={orderEdit.ward} onChange={(event) => setOrderEdit((current) => current && ({ ...current, ward: event.target.value }))} className="rounded-xl" placeholder="Phường/Xã" />
                        <Input value={orderEdit.district} onChange={(event) => setOrderEdit((current) => current && ({ ...current, district: event.target.value }))} className="rounded-xl" placeholder="Quận/Huyện" />
                        <Input value={orderEdit.province} onChange={(event) => setOrderEdit((current) => current && ({ ...current, province: event.target.value }))} className="rounded-xl" placeholder="Tỉnh/Thành" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" value={orderEdit.shippingFee} onChange={(event) => setOrderEdit((current) => current && ({ ...current, shippingFee: Number(event.target.value) || 0 }))} className="rounded-xl" placeholder="Ph? ship" />
                          <Input type="number" value={orderEdit.discountAmount} onChange={(event) => setOrderEdit((current) => current && ({ ...current, discountAmount: Number(event.target.value) || 0 }))} className="rounded-xl" placeholder="Gi?m gi?" />
                        </div>
                        <Button type="button" className="rounded-xl md:col-span-2" onClick={saveOrderEdit}>Lưu sửa nhanh</Button>
                      </div>
                    </section>
                  )}

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Chi tiết sản phẩm</h3>
                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="h-10">Sản phẩm</TableHead>
                            <TableHead className="h-10 text-right">SL</TableHead>
                            <TableHead className="h-10 text-right">Giá</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item) => (
                            <TableRow key={item.id} className="hover:bg-transparent">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.productName}</span>
                                  {getOrderItemVariantLabel(item) && (
                                    <span className="text-xs font-medium text-primary">{getOrderItemVariantLabel(item)}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right font-medium">{formatPrice(item.price)}</TableCell>
                            </TableRow>
                          ))}
                          {selectedOrder.shippingFee > 0 && (
                            <TableRow className="text-sm hover:bg-transparent">
                              <TableCell colSpan={2} className="py-2 text-right text-muted-foreground">Phí vận chuyển</TableCell>
                              <TableCell className="py-2 text-right font-medium">{formatPrice(selectedOrder.shippingFee)}</TableCell>
                            </TableRow>
                          )}
                          {selectedOrder.discountAmount > 0 && (
                            <TableRow className="text-sm hover:bg-transparent">
                              <TableCell colSpan={2} className="py-2 text-right text-muted-foreground">Giảm giá</TableCell>
                              <TableCell className="py-2 text-right font-medium text-destructive">-{formatPrice(selectedOrder.discountAmount)}</TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-muted/10 hover:bg-muted/10">
                            <TableCell colSpan={2} className="py-4 text-right font-medium">Tổng cộng</TableCell>
                            <TableCell className="py-4 text-right text-lg font-bold text-primary">{formatPrice(selectedOrder.totalAmount)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  {paymentForm && (
                    <section>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cập nhật thanh toán</h3>
                      <div className="grid gap-2 rounded-xl border bg-card p-4 shadow-sm">
                        <select className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm" value={paymentForm.paymentStatus} onChange={(event) => setPaymentForm((current) => current && ({ ...current, paymentStatus: event.target.value as Order["paymentStatus"] }))}>
                          {Object.values(PaymentStatus).map((status) => <option key={status} value={status}>{paymentStatusConfig[status]?.label || status}</option>)}
                        </select>
                        <Input value={paymentForm.transactionCode} onChange={(event) => setPaymentForm((current) => current && ({ ...current, transactionCode: event.target.value }))} className="rounded-xl" placeholder="Mã giao dịch / tham chiếu" />
                        <Button type="button" size="sm" className="rounded-lg" onClick={savePayment}>Lưu thanh toán</Button>
                      </div>
                    </section>
                  )}

                  {trackingForm && (
                    <section>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vận chuyển</h3>
                      <div className="space-y-3 rounded-xl border bg-card p-4 text-sm shadow-sm">
                        <select className="h-9 w-full rounded-xl border border-input bg-input/30 px-3 text-sm" value={trackingForm.shippingStatus} onChange={(event) => setTrackingForm((current) => current && ({ ...current, shippingStatus: event.target.value as Order["shippingStatus"] }))}>
                          {Object.values(ShippingStatus).map((status) => <option key={status} value={status}>{shippingStatusLabels[status] || status}</option>)}
                        </select>
                        <Input value={trackingForm.shippingCarrier} onChange={(event) => setTrackingForm((current) => current && ({ ...current, shippingCarrier: event.target.value }))} className="rounded-xl" placeholder="Đơn vị vận chuyển: GHN, GHTK..." />
                        <Input value={trackingForm.trackingNumber} onChange={(event) => setTrackingForm((current) => current && ({ ...current, trackingNumber: event.target.value }))} className="rounded-xl" placeholder="Mã vận chuyển" />
                        <Button type="button" size="sm" className="rounded-lg" onClick={saveTracking}>
                          <IconTruckDelivery className="mr-2 size-4" />
                          Lưu vận chuyển
                        </Button>
                      </div>
                    </section>
                  )}

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      {getTimeline(selectedOrder).map((event) => (
                        <div key={event.label} className="flex gap-3 pb-3 last:pb-0">
                          <span className={`mt-1 size-2.5 rounded-full ${event.active ? "bg-primary" : "bg-muted"}`} />
                          <div>
                            <p className={`text-sm font-medium ${event.active ? "text-foreground" : "text-muted-foreground"}`}>{event.label}</p>
                            {event.time && <p className="text-xs text-muted-foreground">{new Date(event.time).toLocaleString("vi-VN")}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Thanh toán</h3>
                    <div className="space-y-3 rounded-xl border bg-card p-4 text-sm shadow-sm">
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-muted-foreground">Phương thức:</span>
                        <span className="font-medium">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        <Badge variant="outline" className={`rounded-md px-2.5 py-0.5 ${paymentStatusConfig[selectedOrder.paymentStatus]?.color}`}>
                          {paymentStatusConfig[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ghi chép nội bộ</h3>
                    <Textarea
                      placeholder="Thêm ghi chú nội bộ..."
                      className="min-h-[100px] resize-none rounded-xl"
                      value={internalNote}
                      onChange={(event) => setInternalNote(event.target.value)}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="secondary" className="rounded-lg" onClick={handleSaveNote}>Lưu ghi chú</Button>
                    </div>
                  </section>
                </div>
              </div>

              <DialogFooter className="border-t bg-muted/10 p-6">
                <div className="flex w-full flex-wrap gap-3">
                  <Button className="flex-1 rounded-xl" variant="outline" onClick={() => printOrder(selectedOrder)}>
                    <IconPrinter className="mr-2 size-4" />
                    In hóa đơn
                  </Button>
                  <Button className="flex-1 rounded-xl" variant="outline" onClick={() => printShippingSlip(selectedOrder)}>
                    <IconTruckDelivery className="mr-2 size-4" />
                    Phiếu giao
                  </Button>
                  {selectedOrder.status === OrderStatus.PENDING ? (
                    <Button
                      className="flex-1 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                      onClick={() => handleUpdateStatus(OrderStatus.CONFIRMED)}
                    >
                      <IconCheck className="mr-2 size-4" />
                      Duyệt đơn
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                      onClick={() => handleUpdateStatus(OrderStatus.COMPLETED)}
                      disabled={selectedOrder.status === OrderStatus.COMPLETED}
                    >
                      Xác nhận hoàn thành
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
