"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconArchive,
  IconArrowsExchange,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconHistory,
  IconLoader2,
  IconMinus,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { productService } from "@/lib/api/services/product.service"
import { variantService } from "@/lib/api/services/variant.service"
import { inventoryService } from "@/lib/api/services/inventory.service"
import type { ProductListItem, ProductListVariant } from "@/lib/api/schemas/product.schema"

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value)

export default function InventoryDetailsPage() {
  const [products, setProducts] = React.useState<ProductListItem[]>([])
  const [variantsMap, setVariantsMap] = React.useState<Record<string, ProductListVariant[]>>({})
  const [expandedProductIds, setExpandedProductIds] = React.useState<Set<string>>(new Set())
  const [loadingProducts, setLoadingProducts] = React.useState(true)
  const [loadingVariants, setLoadingVariants] = React.useState<Record<string, boolean>>({})
  const [updatingVariants, setUpdatingVariants] = React.useState<Record<string, boolean>>({})
  const [editedVariants, setEditedVariants] = React.useState<Record<string, { quantity?: string; price?: string; salePrice?: string }>>({})
  const [updatingProducts, setUpdatingProducts] = React.useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [inventoryStatus, setInventoryStatus] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("updatedAt_desc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [toast, setToast] = React.useState<{ message: string; tone: "success" | "error" | "info" } | null>(null)

  const [selectedLogsInfo, setSelectedLogsInfo] = React.useState<{ productName: string; variantName: string; sku: string } | null>(null)
  const [logs, setLogs] = React.useState<any[]>([])
  const [isLogsLoading, setIsLogsLoading] = React.useState(false)
  const [isLogsDialogOpen, setIsLogsDialogOpen] = React.useState(false)

  const handleOpenLogs = async (inventoryId: string, productName: string, variantName: string, sku: string) => {
    setSelectedLogsInfo({ productName, variantName, sku })
    setIsLogsDialogOpen(true)
    try {
      setIsLogsLoading(true)
      const data = await inventoryService.getInventoryLogs(inventoryId)
      setLogs(data.data)
    } catch (error) {
      console.error("Failed to fetch logs", error)
      setLogs([])
    } finally {
      setIsLogsLoading(false)
    }
  }

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case "IMPORT":
        return "Nhập thêm kho"
      case "ADJUST":
        return "Điều chỉnh kiểm kê"
      case "ORDER_DECREASE":
        return "Bán hàng (Xuất kho)"
      case "ORDER_RESTORE":
        return "Hủy đơn (Hoàn kho)"
      case "RETURN_RESTORE":
        return "Khách trả hàng"
      default:
        return "Khác"
    }
  }

  const showToast = React.useCallback((message: string, tone: "success" | "error" | "info" = "success") => {
    setToast({ message, tone })
  }, [])

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoadingProducts(true)
      const data = await productService.getProducts({
        page: currentPage,
        limit: 10,
        search: searchQuery.trim() || undefined,
        inventoryStatus: inventoryStatus !== "all" ? inventoryStatus : undefined,
        sortBy: sortBy,
      })
      setProducts(data.data)
      setPagination(data.pagination!)
    } catch (error) {
      console.error("Failed to fetch products", error)
      showToast("Không thể tải danh sách sản phẩm", "error")
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [currentPage, searchQuery, inventoryStatus, sortBy, showToast])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const getPageNumbers = () => {
    const pages: Array<number | "..."> = []
    const total = pagination.totalPages
    const current = pagination.page

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", total)
    } else if (current >= total - 3) {
      pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total)
    }

    return pages
  }

  const toggleExpand = async (productId: string) => {
    const newExpanded = new Set(expandedProductIds)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
      setExpandedProductIds(newExpanded)
    } else {
      newExpanded.add(productId)
      setExpandedProductIds(newExpanded)
      // Load variants if not loaded yet
      if (!variantsMap[productId]) {
        try {
          setLoadingVariants((prev) => ({ ...prev, [productId]: true }))
          const [data] = await Promise.all([
            variantService.getVariantsByProduct(productId),
            new Promise((resolve) => setTimeout(resolve, 500)), // 500ms delay to make skeleton visible smoothly
          ])
          setVariantsMap((prev) => ({ ...prev, [productId]: data }))
        } catch (error) {
          console.error("Failed to fetch variants", error)
          showToast("Không thể tải danh sách biến thể", "error")
        } finally {
          setLoadingVariants((prev) => ({ ...prev, [productId]: false }))
        }
      }
    }
  }

  const hasChanges = (productId: string) => {
    const productVariants = variantsMap[productId] || []
    return productVariants.some((v) => {
      const draft = editedVariants[v.id]
      if (!draft) return false
      
      const qtyChanged = draft.quantity !== undefined && draft.quantity !== (v.inventory?.quantity ?? 0).toString()
      const priceChanged = draft.price !== undefined && draft.price !== (v.price ?? 0).toString()
      const salePriceChanged = draft.salePrice !== undefined && draft.salePrice !== (v.salePrice != null && v.salePrice > 0 ? v.salePrice.toString() : "")
      
      return qtyChanged || priceChanged || salePriceChanged
    })
  }

  const handleCancelChanges = (productId: string) => {
    const productVariants = variantsMap[productId] || []
    setEditedVariants((prev) => {
      const next = { ...prev }
      for (const v of productVariants) {
        delete next[v.id]
      }
      return next
    })
    showToast("Đã hủy các thay đổi", "info")
  }

  const handleSaveChanges = async (productId: string) => {
    const productVariants = variantsMap[productId] || []
    const variantsToUpdate = productVariants.filter((v) => {
      const draft = editedVariants[v.id]
      if (!draft) return false
      const qtyChanged = draft.quantity !== undefined && draft.quantity !== (v.inventory?.quantity ?? 0).toString()
      const priceChanged = draft.price !== undefined && draft.price !== (v.price ?? 0).toString()
      const salePriceChanged = draft.salePrice !== undefined && draft.salePrice !== (v.salePrice != null && v.salePrice > 0 ? v.salePrice.toString() : "")
      return qtyChanged || priceChanged || salePriceChanged
    })

    if (variantsToUpdate.length === 0) return

    // Validation
    for (const variant of variantsToUpdate) {
      const draft = editedVariants[variant.id]
      
      let finalPrice = variant.price ?? 0
      if (draft.price !== undefined) {
        const parsedPrice = parseFloat(draft.price.replace(/[^0-9]/g, ""))
        if (isNaN(parsedPrice)) {
          showToast(`Giá bán lẻ không hợp lệ cho SKU: ${variant.sku}`, "error")
          return
        }
        finalPrice = parsedPrice
      }

      let finalSalePrice = variant.salePrice ?? null
      if (draft.salePrice !== undefined) {
        if (draft.salePrice.trim() === "") {
          finalSalePrice = null
        } else {
          const parsedSale = parseFloat(draft.salePrice.replace(/[^0-9]/g, ""))
          if (isNaN(parsedSale)) {
            showToast(`Giá khuyến mãi không hợp lệ cho SKU: ${variant.sku}`, "error")
            return
          }
          finalSalePrice = parsedSale > 0 ? parsedSale : null
        }
      }

      if (draft.quantity !== undefined) {
        const parsedQty = parseInt(draft.quantity.replace(/[^0-9]/g, ""), 10)
        if (isNaN(parsedQty) || parsedQty < 0) {
          showToast(`Số lượng tồn kho không hợp lệ cho SKU: ${variant.sku}`, "error")
          return
        }
      }

      if (finalSalePrice !== null && finalSalePrice > finalPrice) {
        showToast(`Giá bán lẻ không được nhỏ hơn giá khuyến mãi cho SKU: ${variant.sku}`, "error")
        return
      }
    }

    try {
      setUpdatingProducts((prev) => ({ ...prev, [productId]: true }))

      // Update in parallel
      const updatePromises = variantsToUpdate.map(async (variant) => {
        const draft = editedVariants[variant.id]
        const payload: { price?: number; salePrice?: number | null; quantity?: number } = {}
        
        if (draft.price !== undefined) {
          payload.price = parseFloat(draft.price.replace(/[^0-9]/g, ""))
        }
        if (draft.salePrice !== undefined) {
          payload.salePrice = draft.salePrice.trim() === "" ? null : parseFloat(draft.salePrice.replace(/[^0-9]/g, ""))
        }
        if (draft.quantity !== undefined) {
          payload.quantity = parseInt(draft.quantity.replace(/[^0-9]/g, ""), 10)
        }

        const updated = await variantService.quickUpdateVariant(variant.id, payload)
        return { variantId: variant.id, updated }
      })

      const results = await Promise.all(updatePromises)

      // 1. Update local variantsMap
      setVariantsMap((prev) => {
        const currentVariants = prev[productId] || []
        const updatedVariants = currentVariants.map((v) => {
          const match = results.find((r) => r.variantId === v.id)
          return match ? { ...v, ...match.updated } : v
        })
        return { ...prev, [productId]: updatedVariants }
      })

      // 2. Recalculate totals for parent product
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (p.id !== productId) return p

          const currentVariants = (variantsMap[productId] || []).map((v) => {
            const match = results.find((r) => r.variantId === v.id)
            return match ? { ...v, ...match.updated } : v
          })

          const totalQuantity = currentVariants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0)
          const totalReserved = currentVariants.reduce((sum, v) => sum + (v.inventory?.reservedQuantity ?? 0), 0)
          const totalAvailable = totalQuantity - totalReserved
          const isLowStock = currentVariants.some((v) => v.inventory?.isLowStock ?? false)
          const soldOut = totalQuantity <= 0

          return {
            ...p,
            stockSummary: {
              quantity: totalQuantity,
              reservedQuantity: totalReserved,
              availableQuantity: totalAvailable,
              soldOut,
              isLowStock,
            },
          }
        })
      )

      // 3. Clear drafts
      setEditedVariants((prev) => {
        const next = { ...prev }
        for (const variant of variantsToUpdate) {
          delete next[variant.id]
        }
        return next
      })

      showToast(`Đã cập nhật thay đổi thành công cho sản phẩm`, "success")
    } catch (error: any) {
      console.error("Failed to update variants", error)
      const errorMsg = error?.response?.data?.EM || "Cập nhật thất bại"
      showToast(errorMsg, "error")
    } finally {
      setUpdatingProducts((prev) => ({ ...prev, [productId]: false }))
    }
  }

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
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

      <div className="flex gap-2 border-b border-border/60 pb-px">
        <Link
          href="/inventory"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Tổng quan tồn kho
        </Link>
        <Link
          href="/inventory/details"
          className="border-b-2 border-primary px-4 py-2 text-sm font-semibold text-primary"
        >
          Chi tiết tồn kho (Sửa nhanh)
        </Link>
      </div>

      <Card className="border-border/60 shadow-none w-full overflow-hidden">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">Bảng cập nhật nhanh</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Bảng lồng phân cấp. Nhập trực tiếp số lượng tồn và giá của biến thể rồi nhấn Enter hoặc click ra ngoài để lưu.
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between mt-2">
            <div className="relative w-full md:w-[320px]">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm sản phẩm cha, SKU biến thể..."
                className="rounded-xl pl-9"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full md:w-[200px]"
                value={inventoryStatus}
                onChange={(e) => {
                  setInventoryStatus(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="all">Tất cả trạng thái kho</option>
                <option value="instock">Còn hàng</option>
                <option value="lowstock">Sắp hết hàng</option>
                <option value="outofstock">Hết hàng</option>
              </select>

              <select
                className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full md:w-[200px]"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="updatedAt_desc">Mới cập nhật</option>
                <option value="createdAt_desc">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="stock_asc">Tồn kho: Ít đến Nhiều</option>
                <option value="stock_desc">Tồn kho: Nhiều đến Ít</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto border-t">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="h-12 w-[30%] max-w-[200px] md:max-w-[350px]">Sản phẩm cha</TableHead>
                  <TableHead className="h-12 w-[15%] hidden md:table-cell">SKU cha</TableHead>
                  <TableHead className="h-12 w-[9%] text-center">Tổng tồn kho</TableHead>
                  <TableHead className="h-12 w-[9%] text-center hidden lg:table-cell">Tổng đang đặt</TableHead>
                  <TableHead className="h-12 w-[9%] text-center">Tổng khả dụng</TableHead>
                  <TableHead className="h-12 w-[9%] text-center hidden md:table-cell">Số biến thể</TableHead>
                  <TableHead className="h-12 w-[9%] text-right">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <IconLoader2 className="size-5 animate-spin text-primary" />
                        <span>Đang tải danh sách sản phẩm...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                      Không tìm thấy sản phẩm nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const isExpanded = expandedProductIds.has(product.id)
                    const totalStock = product.stockSummary?.quantity ?? 0
                    const totalReserved = product.stockSummary?.reservedQuantity ?? 0
                    const totalAvailable = product.stockSummary?.availableQuantity ?? totalStock - totalReserved
                    const isLowStock = product.stockSummary?.isLowStock ?? false
                    const isSoldOut = product.stockSummary?.soldOut ?? totalStock <= 0

                    return (
                      <React.Fragment key={product.id}>
                        <TableRow className="transition-colors hover:bg-muted/30">
                          <TableCell className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg"
                              onClick={() => toggleExpand(product.id)}
                            >
                              {isExpanded ? (
                                <IconChevronDown className="size-4 text-muted-foreground" />
                              ) : (
                                <IconChevronRight className="size-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-semibold text-primary py-3 max-w-[200px] md:max-w-[350px]">
                            <div className="flex items-center gap-3 min-w-0 w-full">
                              {product.thumbnailMedia?.url && (
                                <img
                                  src={product.thumbnailMedia.url}
                                  alt={product.name}
                                  className="size-9 shrink-0 rounded-lg object-cover border"
                                />
                              )}
                              <span className="line-clamp-2 break-words whitespace-normal text-sm leading-snug flex-1">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm hidden md:table-cell">{product.sku || "N/A"}</TableCell>
                          <TableCell className="text-center text-base font-bold">
                            <span className={isLowStock ? "text-danger" : "text-foreground"}>
                              {formatNumber(totalStock)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground hidden lg:table-cell">
                            {formatNumber(totalReserved)}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-foreground">
                            {formatNumber(totalAvailable)}
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <Badge variant="secondary" className="rounded-md border-0 bg-secondary px-2">
                              {product.variantsCount ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isSoldOut ? (
                              <Badge variant="secondary" className="bg-danger-soft text-danger rounded-md border-transparent">
                                Hết hàng
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="secondary" className="bg-warning-soft text-warning rounded-md border-transparent">
                                <IconAlertCircle className="mr-1 size-3" /> Sắp hết
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-success-soft text-success rounded-md border-transparent">
                                Còn hàng
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-muted/10 hover:bg-transparent">
                            <TableCell colSpan={8} className="p-0 border-t-0">
                              <div className="border-l-2 border-primary/40 bg-secondary/10 px-8 py-4 max-w-full overflow-hidden">
                                {loadingVariants[product.id] ? (
                                  <div className="rounded-xl border bg-card w-full overflow-x-auto">
                                    <Table>
                                      <TableHeader className="bg-muted/40">
                                        <TableRow className="hover:bg-transparent">
                                          <TableHead className="text-xs font-semibold">Phiên bản</TableHead>
                                          <TableHead className="text-xs font-semibold hidden md:table-cell">SKU biến thể</TableHead>
                                          <TableHead className="text-xs font-semibold text-center w-[160px]">
                                            Tồn kho
                                          </TableHead>
                                          <TableHead className="text-xs font-semibold text-center w-[120px] hidden lg:table-cell">
                                            Đang đặt
                                          </TableHead>
                                          <TableHead className="text-xs font-semibold text-center w-[120px]">
                                            Có thể bán
                                          </TableHead>
                                          <TableHead className="text-xs font-semibold text-center w-[160px]">
                                            Giá bán lẻ (đ)
                                          </TableHead>
                                          <TableHead className="text-xs font-semibold text-center w-[160px] hidden lg:table-cell">
                                            Giá khuyến mãi (đ)
                                          </TableHead>
                                          <TableHead className="text-xs font-semibold text-center w-[80px] hidden xl:table-cell">
                                            Lịch sử
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {[1, 2, 3].map((i) => (
                                          <TableRow key={i} className="hover:bg-transparent">
                                            <TableCell>
                                              <Skeleton className="h-5 w-24 bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                              <Skeleton className="h-4 w-32 bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell className="p-2">
                                              <Skeleton className="mx-auto h-8 w-20 rounded-lg bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell className="hidden min-[1600px]:table-cell">
                                              <Skeleton className="mx-auto h-4 w-12 bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell>
                                              <Skeleton className="mx-auto h-4 w-12 bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell className="p-2">
                                              <Skeleton className="mx-auto h-8 w-32 rounded-lg bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell className="p-2 hidden min-[1700px]:table-cell">
                                              <Skeleton className="mx-auto h-8 w-32 rounded-lg bg-muted-foreground/15" />
                                            </TableCell>
                                            <TableCell className="p-2 hidden min-[1800px]:table-cell">
                                              <Skeleton className="mx-auto h-8 w-8 rounded-lg bg-muted-foreground/15" />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : !variantsMap[product.id] || variantsMap[product.id].length === 0 ? (
                                  <div className="text-center py-6 text-sm text-muted-foreground">
                                    Sản phẩm này không có biến thể nào được tạo.
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-4">
                                    <div className="rounded-xl border bg-card w-full overflow-x-auto">
                                      <Table>
                                        <TableHeader className="bg-muted/40">
                                          <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold">Phiên bản</TableHead>
                                            <TableHead className="text-xs font-semibold hidden md:table-cell">SKU biến thể</TableHead>
                                            <TableHead className="text-xs font-semibold text-center w-[160px]">
                                              Tồn kho
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-center w-[120px] hidden min-[1600px]:table-cell">
                                              Đang đặt
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-center w-[120px]">
                                              Có thể bán
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-center w-[160px]">
                                              Giá bán lẻ (đ)
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-center w-[160px] hidden min-[1700px]:table-cell">
                                              Giá khuyến mãi (đ)
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-center w-[80px] hidden min-[1800px]:table-cell">
                                              Lịch sử
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {variantsMap[product.id].map((variant) => {
                                            const variantQty = variant.inventory?.quantity ?? 0
                                            const variantReserved = variant.inventory?.reservedQuantity ?? 0
                                            const variantAvailable = variantQty - variantReserved
                                            const isUpdating = updatingProducts[product.id] || updatingVariants[variant.id]

                                            // Get draft values
                                            const draft = editedVariants[variant.id]
                                            const displayQty = draft?.quantity !== undefined ? draft.quantity : variantQty.toString()
                                            const displayPrice = draft?.price !== undefined ? draft.price : (variant.price ?? 0).toString()
                                            const displaySalePrice = draft?.salePrice !== undefined ? draft.salePrice : (variant.salePrice != null && variant.salePrice > 0 ? variant.salePrice.toString() : "")

                                            // Build label: Color / Size
                                            const labelParts = [
                                              variant.colorName,
                                              variant.sizeLabel,
                                            ].filter(Boolean)
                                            const label = labelParts.length > 0 ? labelParts.join(" - ") : "Mặc định"

                                            return (
                                              <TableRow
                                                key={variant.id}
                                                className="hover:bg-muted/20 relative"
                                              >
                                                <TableCell className="font-medium">
                                                  <div className="flex items-center gap-2">
                                                    {variant.colorHex && (
                                                      <span
                                                        className="size-3.5 rounded-full border border-border/80 shadow-sm shrink-0"
                                                        style={{ backgroundColor: variant.colorHex }}
                                                      />
                                                    )}
                                                    <span>{label}</span>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                                                  {variant.sku}
                                                </TableCell>
                                                <TableCell className="text-center p-2">
                                                  <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="icon"
                                                      className="size-7 rounded-lg shrink-0 border-border hover:border-primary/50 hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                                      disabled={isUpdating}
                                                      onClick={() => {
                                                        const currentVal = parseInt(displayQty.replace(/[^0-9]/g, ""), 10) || 0
                                                        const newVal = Math.max(0, currentVal - 1)
                                                        setEditedVariants((prev) => ({
                                                          ...prev,
                                                          [variant.id]: {
                                                            ...prev[variant.id],
                                                            quantity: newVal.toString(),
                                                          },
                                                        }))
                                                      }}
                                                    >
                                                      <IconMinus className="size-3.5" />
                                                    </Button>

                                                    <div className="relative flex items-center justify-center">
                                                      <Input
                                                        type="text"
                                                        disabled={isUpdating}
                                                        value={displayQty}
                                                        className="w-16 text-center h-8 rounded-lg bg-transparent border-border hover:border-primary/50 focus:border-primary font-semibold text-sm transition-all focus:bg-card"
                                                        onChange={(e) => {
                                                          const val = e.target.value
                                                          setEditedVariants((prev) => ({
                                                            ...prev,
                                                            [variant.id]: { ...prev[variant.id], quantity: val },
                                                          }))
                                                        }}
                                                        onKeyDown={(e) => {
                                                          if (e.key === "Enter") {
                                                            handleSaveChanges(product.id)
                                                          }
                                                        }}
                                                      />
                                                      {isUpdating && (
                                                        <span className="absolute right-0.5 size-4">
                                                          <IconLoader2 className="size-3.5 animate-spin text-primary" />
                                                        </span>
                                                      )}
                                                    </div>

                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="icon"
                                                      className="size-7 rounded-lg shrink-0 border-border hover:border-primary/50 hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                                      disabled={isUpdating}
                                                      onClick={() => {
                                                        const currentVal = parseInt(displayQty.replace(/[^0-9]/g, ""), 10) || 0
                                                        const newVal = currentVal + 1
                                                        setEditedVariants((prev) => ({
                                                          ...prev,
                                                          [variant.id]: {
                                                            ...prev[variant.id],
                                                            quantity: newVal.toString(),
                                                          },
                                                        }))
                                                      }}
                                                    >
                                                      <IconPlus className="size-3.5" />
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-center text-xs text-muted-foreground hidden min-[1600px]:table-cell">
                                                  {variantReserved}
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-semibold text-foreground">
                                                  {variantAvailable}
                                                </TableCell>
                                                <TableCell className="text-center p-2">
                                                  <Input
                                                    type="text"
                                                    disabled={isUpdating}
                                                    value={displayPrice}
                                                    className="w-32 text-center h-8 rounded-lg bg-transparent border-border hover:border-primary/50 focus:border-primary text-sm transition-all focus:bg-card"
                                                    onChange={(e) => {
                                                      const val = e.target.value
                                                      setEditedVariants((prev) => ({
                                                        ...prev,
                                                        [variant.id]: { ...prev[variant.id], price: val },
                                                      }))
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") {
                                                        handleSaveChanges(product.id)
                                                      }
                                                    }}
                                                  />
                                                </TableCell>
                                                <TableCell className="text-center p-2 hidden min-[1700px]:table-cell">
                                                  <Input
                                                    type="text"
                                                    disabled={isUpdating}
                                                    value={displaySalePrice}
                                                    placeholder="Không có"
                                                    className="w-32 text-center h-8 rounded-lg bg-transparent border-border hover:border-primary/50 focus:border-primary text-sm transition-all focus:bg-card"
                                                    onChange={(e) => {
                                                      const val = e.target.value
                                                      setEditedVariants((prev) => ({
                                                        ...prev,
                                                        [variant.id]: { ...prev[variant.id], salePrice: val },
                                                      }))
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") {
                                                        handleSaveChanges(product.id)
                                                      }
                                                    }}
                                                  />
                                                </TableCell>
                                                <TableCell className="text-center p-2 hidden min-[1800px]:table-cell">
                                                  {variant.inventory?.id ? (
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="icon"
                                                      className="size-8 rounded-lg hover:text-primary transition-colors"
                                                      onClick={() => handleOpenLogs(variant.inventory!.id!, product.name, label, variant.sku)}
                                                    >
                                                      <IconHistory className="size-4" />
                                                    </Button>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                    {hasChanges(product.id) && (
                                      <div className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning-soft/10 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center gap-2 text-sm text-warning-foreground font-medium">
                                          <IconAlertCircle className="size-4 text-warning" />
                                          <span>Sản phẩm này có thay đổi tồn kho hoặc giá chưa lưu.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-lg h-9"
                                            disabled={updatingProducts[product.id]}
                                            onClick={() => handleCancelChanges(product.id)}
                                          >
                                            Hủy
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="rounded-lg h-9"
                                            disabled={updatingProducts[product.id]}
                                            onClick={() => handleSaveChanges(product.id)}
                                          >
                                            {updatingProducts[product.id] && (
                                              <IconLoader2 className="mr-2 size-3.5 animate-spin" />
                                            )}
                                            Cập nhật
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Hiển thị trang <span className="font-medium text-foreground">{pagination.page}</span> /{" "}
                <span className="font-medium text-foreground">{pagination.totalPages || 1}</span>{" "}
                ({formatNumber(pagination.total)} sản phẩm cha)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={loadingProducts || currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft data-icon="inline-start" className="size-4 mr-1" />
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        type="button"
                        variant={pagination.page === page ? "default" : "outline"}
                        size="icon-sm"
                        className="rounded-lg"
                        disabled={loadingProducts}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={loadingProducts || currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Sau
                  <IconChevronRight data-icon="inline-end" className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-5 duration-300 min-w-[300px] ${
            toast.tone === "success"
              ? "border-success/20 bg-success-soft text-success"
              : toast.tone === "error"
              ? "border-danger/20 bg-danger-soft text-danger"
              : "border-info/20 bg-info-soft text-info"
          }`}
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconHistory className="size-5 text-primary" />
              Lịch sử biến động kho
            </DialogTitle>
            {selectedLogsInfo && (
              <DialogDescription className="space-y-1 pt-1.5 text-xs text-muted-foreground">
                <div>Sản phẩm: <strong className="text-foreground">{selectedLogsInfo.productName}</strong></div>
                <div>Biến thể: <strong className="text-foreground">{selectedLogsInfo.variantName}</strong></div>
                <div>SKU: <strong className="text-foreground">{selectedLogsInfo.sku || "N/A"}</strong></div>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="max-h-[380px] overflow-y-auto py-2 pr-1">
            {isLogsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IconLoader2 className="size-6 animate-spin mb-2" />
                Đang tải lịch sử...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <IconHistory className="size-8 mb-2 text-muted-foreground/40" />
                Chưa có lịch sử biến động nào cho biến thể này.
              </div>
            ) : (
              <div className="relative border-l border-muted pl-4 ml-3 space-y-5 py-1">
                {logs.map((log) => {
                  const typeLabel = getChangeTypeLabel(log.changeType)
                  const isPositive = log.quantityChange > 0
                  const isZero = log.quantityChange === 0
                  return (
                    <div key={log.id} className="relative">
                      <span className={`absolute -left-[22px] top-1 size-3 rounded-full border-2 border-background ${
                        isPositive ? "bg-success" : isZero ? "bg-info" : "bg-danger"
                      }`} />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">{typeLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-2 text-sm">
                        <span className={`font-bold ${isPositive ? "text-success" : isZero ? "text-info" : "text-danger"}`}>
                          {isPositive ? "+" : ""}{log.quantityChange}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (Tồn kho: {log.quantityBefore} → {log.quantityAfter})
                        </span>
                      </div>
                      {log.note && (
                        <p className="mt-1.5 rounded-lg bg-muted/65 p-2 text-xs text-muted-foreground">
                          Ghi chú: {log.note}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsLogsDialogOpen(false)} className="rounded-xl w-full sm:w-auto">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
