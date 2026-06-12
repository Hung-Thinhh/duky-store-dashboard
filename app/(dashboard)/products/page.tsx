"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsRight,
  IconDownload,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconFilter,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react"
import { usePermissions } from "@/hooks/usePermissions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InlineFeedback } from "@/components/ui/inline-feedback"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Category } from "@/lib/api/schemas/category.schema"
import type {
  ProductListItem,
  ProductListVariant,
} from "@/lib/api/schemas/product.schema"
import { categoryService } from "@/lib/api/services/category.service"
import { productService } from "@/lib/api/services/product.service"
import { variantService } from "@/lib/api/services/variant.service"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { className: string; label: string }> = {
  PUBLISHED: {
    className: "bg-success-soft text-success",
    label: "Đang bán",
  },
  DRAFT: {
    className: "bg-muted text-muted-foreground",
    label: "Bản nháp",
  },
  HIDDEN: {
    className: "bg-warning-soft text-foreground",
    label: "Đã ẩn",
  },
  SOLD_OUT: {
    className: "bg-danger-soft text-danger",
    label: "Hết hàng",
  },
  DISCONTINUED: {
    className: "bg-secondary text-muted-foreground",
    label: "Ngừng bán",
  },
}

const productTypeLabels: Record<string, string> = {
  SIMPLE: "Đơn giản",
  GROUPED: "Nhóm",
  EXTERNAL: "Bên ngoài",
  VARIABLE: "Có biến thể",
}

type BulkAction = "publish" | "hide" | "delete"
type Feedback = { message: string; tone: "success" | "error" | "info" }

const compactNumber = new Intl.NumberFormat("vi-VN")
const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatPrice(price?: number | null) {
  if (price == null) return "-"
  return moneyFormatter.format(price)
}

function getProductThumbnail(product: ProductListItem) {
  if (product.image?.media?.url) return product.image.media.url
  if (product.thumbnailMedia?.url) return product.thumbnailMedia.url
  return null
}

function getProductQuantity(product: ProductListItem) {
  return product.stockSummary?.quantity ?? product.inventory?.quantity ?? 0
}

function getProductAvailable(product: ProductListItem) {
  return (
    product.stockSummary?.availableQuantity ??
    product.inventory?.availableQuantity ??
    product.inventory?.quantity ??
    0
  )
}

function getVariantQuantity(variant: ProductListVariant) {
  return variant.inventory?.quantity ?? 0
}

function getVariantAvailable(variant: ProductListVariant) {
  return (
    variant.inventory?.availableQuantity ??
    variant.inventory?.quantity ??
    0
  )
}

function getVariantReserved(variant: ProductListVariant) {
  return variant.inventory?.reservedQuantity ?? 0
}

function getVariantName(product: ProductListItem, variant: ProductListVariant) {
  if (variant.name) return variant.name

  const attrs = [variant.colorName, variant.sizeLabel].filter(Boolean).join(" - ")
  return attrs ? `${product.name} - ${attrs}` : product.name
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      cells.push(current)
      current = ""
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function ProductImageCell({
  alt,
  src,
  size = "md",
}: {
  alt: string
  src: string | null
  size?: "sm" | "md"
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded-md border bg-muted object-cover",
        size === "sm" ? "size-9" : "size-11"
      )}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border bg-muted text-[10px] text-muted-foreground",
        size === "sm" ? "size-9" : "size-11"
      )}
    >
      No img
    </div>
  )
}

export default function ProductsPage() {
  const { hasPermission } = usePermissions()
  const [products, setProducts] = React.useState<ProductListItem[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isBulkLoading, setIsBulkLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [typeFilter, setTypeFilter] = React.useState("ALL")
  const [categoryFilter, setCategoryFilter] = React.useState("ALL")
  const [flagFilter, setFlagFilter] = React.useState("ALL")
  const [stockFilter, setStockFilter] = React.useState("ALL")
  const [priceSort, setPriceSort] = React.useState("DEFAULT")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [expandedIds, setExpandedIds] = React.useState<string[]>([])
  const [variantsByProductId, setVariantsByProductId] = React.useState<
    Record<string, ProductListVariant[]>
  >({})
  const [loadingVariantIds, setLoadingVariantIds] = React.useState<string[]>([])
  const [variantErrorIds, setVariantErrorIds] = React.useState<string[]>([])
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [bulkAction, setBulkAction] = React.useState<BulkAction | null>(null)
  const [bulkEditorOpen, setBulkEditorOpen] = React.useState(false)
  const [bulkEditorForm, setBulkEditorForm] = React.useState({
    originalPrice: "",
    salePrice: "",
    stockQuantity: "",
    lowStockThreshold: "",
  })
  const importInputRef = React.useRef<HTMLInputElement>(null)

  const fetchProducts = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setFeedback(null)

      const data = await productService.getProducts({
        page: currentPage,
        limit: pagination.limit,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
        ...(categoryFilter !== "ALL" ? { categoryId: categoryFilter } : {}),
      })

      setProducts(data.data)
      setSelectedIds([])
      setExpandedIds((current) =>
        current.filter((id) => data.data.some((product) => product.id === id))
      )
      setPagination(data.pagination!)
    } catch (error) {
      console.error("Failed to fetch products", error)
      setProducts([])
      setSelectedIds([])
      setExpandedIds([])
      setFeedback({
        message: "Không tải được danh sách sản phẩm từ API.",
        tone: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    categoryFilter,
    currentPage,
    pagination.limit,
    searchQuery,
    statusFilter,
    typeFilter,
  ])

  React.useEffect(() => {
    const timeout = window.setTimeout(fetchProducts, 250)
    return () => window.clearTimeout(timeout)
  }, [fetchProducts])

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories({ limit: 100 })
        setCategories(data.data)
      } catch (error) {
        console.error("Failed to fetch product categories", error)
      }
    }

    fetchCategories()
  }, [])

  const visibleProducts = React.useMemo(() => {
    const filtered = products.filter((product) => {
      if (flagFilter === "FEATURED") return product.isFeatured
      if (flagFilter === "BEST_SELLER") return product.isBestSeller
      if (flagFilter === "NEW_ARRIVAL") return product.isNewArrival
      if (flagFilter === "CONTACT_PRICE") return product.contactForPrice
      if (flagFilter === "SALE") return Boolean(product.salePrice)
      if (stockFilter === "OUT") return getProductAvailable(product) <= 0
      if (stockFilter === "LOW") return Boolean(product.stockSummary?.isLowStock)
      if (stockFilter === "IN") return getProductAvailable(product) > 0
      return true
    })

    if (priceSort === "DEFAULT") return filtered

    return [...filtered].sort((a, b) => {
      const priceA = a.salePrice ?? a.originalPrice
      const priceB = b.salePrice ?? b.originalPrice
      return priceSort === "ASC" ? priceA - priceB : priceB - priceA
    })
  }, [flagFilter, priceSort, products, stockFilter])

  const selectedProducts = React.useMemo(
    () => visibleProducts.filter((product) => selectedIds.includes(product.id)),
    [selectedIds, visibleProducts]
  )

  const bulkActionText =
    bulkAction === "publish" ? "đăng bán" : bulkAction === "hide" ? "ẩn" : "xóa"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
    setTypeFilter("ALL")
    setCategoryFilter("ALL")
    setFlagFilter("ALL")
    setStockFilter("ALL")
    setPriceSort("DEFAULT")
    setCurrentPage(1)
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? visibleProducts.map((product) => product.id) : [])
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((item) => item !== id)
    )
  }

  const loadProductVariants = React.useCallback(
    async (productId: string) => {
      if (variantsByProductId[productId] || loadingVariantIds.includes(productId)) {
        return
      }

      setLoadingVariantIds((current) => [...new Set([...current, productId])])
      setVariantErrorIds((current) => current.filter((id) => id !== productId))

      try {
        const variants = await variantService.getVariantsByProduct(productId)
        setVariantsByProductId((current) => ({
          ...current,
          [productId]: variants as ProductListVariant[],
        }))
      } catch (error) {
        console.error("Failed to fetch product variants", error)
        setVariantErrorIds((current) => [...new Set([...current, productId])])
      } finally {
        setLoadingVariantIds((current) =>
          current.filter((id) => id !== productId)
        )
      }
    },
    [loadingVariantIds, variantsByProductId]
  )

  const toggleExpanded = (product: ProductListItem) => {
    const variantsCount = product.variantsCount ?? product.variants.length
    const isExpanded = expandedIds.includes(product.id)

    setExpandedIds((current) =>
      isExpanded
        ? current.filter((item) => item !== product.id)
        : [...current, product.id]
    )

    if (!isExpanded && variantsCount > 0) {
      void loadProductVariants(product.id)
    }
  }

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

  const exportCsv = () => {
    const rows = selectedProducts.length ? selectedProducts : visibleProducts
    const csvRows = [
      [
        "Tên",
        "SKU",
        "Loại",
        "Trạng thái",
        "Tồn kho",
        "Có thể bán",
        "Giá gốc",
        "Giá sale",
        "Số biến thể",
      ],
      ...rows.map((product) => [
        product.name,
        product.sku || "",
        product.type,
        product.status,
        String(getProductQuantity(product)),
        String(getProductAvailable(product)),
        String(product.originalPrice),
        product.salePrice ? String(product.salePrice) : "",
        String(product.variantsCount ?? product.variants.length),
      ]),
    ]
    const csv = csvRows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `duky-products-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setFeedback({
      message: `Đã xuất ${rows.length} sản phẩm ra CSV.`,
      tone: "success",
    })
  }

  const exportWooCsv = () => {
    const rows = selectedProducts.length ? selectedProducts : visibleProducts
    const csvRows = [
      [
        "Loại",
        "SKU",
        "Tên",
        "Đã đăng",
        "Hiển thị trong catalog",
        "Giá thường",
        "Giá sale",
        "Danh mục",
        "Nhãn",
      ],
      ...rows.map((product) => [
        product.type === "VARIABLE"
          ? "variable"
          : product.type === "EXTERNAL"
            ? "external"
            : "simple",
        product.sku || "",
        product.name,
        product.status === "PUBLISHED" ? "1" : "0",
        product.catalogVisibility.toLowerCase(),
        String(product.originalPrice ?? ""),
        product.salePrice ? String(product.salePrice) : "",
        "",
        [
          product.isFeatured ? "featured" : "",
          product.isBestSeller ? "best-seller" : "",
          product.isNewArrival ? "new-arrival" : "",
        ]
          .filter(Boolean)
          .join(", "),
      ]),
    ]
    const csv = csvRows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `duky-woocommerce-products-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setFeedback({
      message: `Đã xuất ${rows.length} sản phẩm theo format WooCommerce.`,
      tone: "success",
    })
  }

  const importCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      setIsBulkLoading(true)
      setFeedback({ message: "Đang nhập CSV sản phẩm...", tone: "info" })

      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((line) => line.trim())
      const [headerLine, ...rowLines] = lines
      const headers = parseCsvLine(headerLine).map((header) =>
        header.toLowerCase().trim()
      )
      const getCell = (row: string[], names: string[]) => {
        const index = headers.findIndex((header) => names.includes(header))
        return index >= 0 ? row[index] ?? "" : ""
      }

      let created = 0
      for (const line of rowLines) {
        const row = parseCsvLine(line)
        const name = getCell(row, ["name", "product name", "tên"]).trim()
        if (!name) continue

        const regularPrice =
          Number(
            getCell(row, [
              "regular price",
              "original price",
              "price",
              "giá gốc",
            ])
          ) || 0
        const salePriceRaw = getCell(row, ["sale price", "sale", "giá sale"])

        await productService.createProduct({
          name,
          slug: slugify(getCell(row, ["slug", "đường dẫn"]) || name),
          sku: getCell(row, ["sku"]) || null,
          type: "SIMPLE",
          status: getCell(row, ["published"]) === "1" ? "PUBLISHED" : "DRAFT",
          catalogVisibility: "VISIBLE",
          originalPrice: regularPrice,
          salePrice: salePriceRaw ? Number(salePriceRaw) || null : null,
          contactForPrice: false,
          categoryIds: [],
          tagIds: [],
          brandIds: [],
          images: [],
          isFeatured: false,
          isBestSeller: false,
          isNewArrival: false,
          soldIndividually: false,
          menuOrder: 0,
          enableReviews: true,
          relations: {
            crossSellIds: [],
            relatedProductIds: [],
            upsellIds: [],
          },
        })
        created++
      }

      setFeedback({
        message: `Đã import ${created} sản phẩm từ CSV.`,
        tone: "success",
      })
      await fetchProducts()
    } catch (error) {
      console.error("Failed to import product CSV", error)
      setFeedback({
        message: "Nhập CSV thất bại. Kiểm tra lại file và các cột Tên/Giá/SKU.",
        tone: "error",
      })
    } finally {
      setIsBulkLoading(false)
    }
  }

  const runBulkPriceStockUpdate = async () => {
    if (!selectedIds.length) return

    const payload: Record<string, unknown> = {}
    if (bulkEditorForm.originalPrice) {
      payload.originalPrice = Number(bulkEditorForm.originalPrice)
    }
    if (bulkEditorForm.salePrice) {
      payload.salePrice = Number(bulkEditorForm.salePrice)
    }
    if (bulkEditorForm.stockQuantity || bulkEditorForm.lowStockThreshold) {
      payload.inventory = {
        ...(bulkEditorForm.stockQuantity
          ? {
              quantity: Number(bulkEditorForm.stockQuantity),
              soldOut: Number(bulkEditorForm.stockQuantity) <= 0,
            }
          : {}),
        ...(bulkEditorForm.lowStockThreshold
          ? { lowStockThreshold: Number(bulkEditorForm.lowStockThreshold) }
          : {}),
      }
    }

    if (!Object.keys(payload).length) {
      setFeedback({
        message: "Chưa nhập giá hoặc tồn kho cần cập nhật.",
        tone: "error",
      })
      return
    }

    try {
      setIsBulkLoading(true)
      await Promise.all(
        selectedIds.map((id) => productService.updateProduct(id, payload))
      )
      setBulkEditorOpen(false)
      setBulkEditorForm({
        originalPrice: "",
        salePrice: "",
        stockQuantity: "",
        lowStockThreshold: "",
      })
      setFeedback({
        message: `Đã cập nhật giá/tồn kho cho ${selectedIds.length} sản phẩm.`,
        tone: "success",
      })
      await fetchProducts()
    } catch (error) {
      console.error("Failed to run bulk price/stock update", error)
      setFeedback({
        message: "Cập nhật giá/tồn kho hàng loạt thất bại.",
        tone: "error",
      })
    } finally {
      setIsBulkLoading(false)
    }
  }

  const runBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return

    try {
      setIsBulkLoading(true)
      setFeedback(null)

      if (bulkAction === "delete") {
        await Promise.all(selectedIds.map((id) => productService.deleteProduct(id)))
      } else {
        const status = bulkAction === "publish" ? "PUBLISHED" : "HIDDEN"
        await Promise.all(
          selectedIds.map((id) => productService.updateProduct(id, { status }))
        )
      }

      setFeedback({
        message: `Đã xử lý ${selectedIds.length} sản phẩm.`,
        tone: "success",
      })
      setBulkAction(null)
      await fetchProducts()
    } catch (error) {
      console.error("Failed to run bulk product action", error)
      setFeedback({ message: "Thao tác hàng loạt thất bại.", tone: "error" })
    } finally {
      setIsBulkLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6 w-full min-w-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bảng cha-con để xem nhanh sản phẩm và toàn bộ biến thể theo size, màu, SKU.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={importCsv}
          />
          {hasPermission('products.create') && (
            <Button
              variant="outline"
              onClick={() => importInputRef.current?.click()}
              disabled={isBulkLoading}
            >
              <IconUpload data-icon="inline-start" />
              Nhập CSV
            </Button>
          )}
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!visibleProducts.length}
          >
            <IconDownload data-icon="inline-start" />
            Xuất CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportWooCsv}
            disabled={!visibleProducts.length}
          >
            <IconDownload data-icon="inline-start" />
            Woo CSV
          </Button>
          {hasPermission('products.create') && (
            <Button asChild>
              <Link href="/products/new">
                <IconPlus data-icon="inline-start" />
                Thêm sản phẩm
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4">
          <div className="flex h-12 items-center">
            <button className="h-full border-b-2 border-primary px-2 text-sm font-semibold text-primary">
              Tất cả sản phẩm
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b bg-background/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-64 flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã sản phẩm, tên sản phẩm, barcode"
                className="pl-9"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Loại sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Loại sản phẩm</SelectItem>
                  <SelectItem value="SIMPLE">Đơn giản</SelectItem>
                  <SelectItem value="GROUPED">Nhóm</SelectItem>
                  <SelectItem value="EXTERNAL">Bên ngoài</SelectItem>
                  <SelectItem value="VARIABLE">Có biến thể</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Trạng thái</SelectItem>
                  <SelectItem value="PUBLISHED">Đang bán</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
                  <SelectItem value="SOLD_OUT">Hết hàng</SelectItem>
                  <SelectItem value="DISCONTINUED">Ngừng bán</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.parentId ? "- " : ""}
                      {category.name}
                      {category.productsCount != null
                        ? ` (${category.productsCount})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tồn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Tất cả kho</SelectItem>
                  <SelectItem value="IN">Còn hàng</SelectItem>
                  <SelectItem value="LOW">Sắp hết</SelectItem>
                  <SelectItem value="OUT">Hết hàng</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={flagFilter} onValueChange={setFlagFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Nhãn" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Nhãn hiệu</SelectItem>
                  <SelectItem value="FEATURED">Nổi bật</SelectItem>
                  <SelectItem value="BEST_SELLER">Bán chạy</SelectItem>
                  <SelectItem value="NEW_ARRIVAL">Hàng mới</SelectItem>
                  <SelectItem value="SALE">Đang sale</SelectItem>
                  <SelectItem value="CONTACT_PRICE">Giá liên hệ</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={priceSort} onValueChange={setPriceSort}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="DEFAULT">Ngày tạo</SelectItem>
                  <SelectItem value="ASC">Giá thấp đến cao</SelectItem>
                  <SelectItem value="DESC">Giá cao đến thấp</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={resetFilters}>
              <IconFilter data-icon="inline-start" />
              Bỏ lọc
            </Button>
          </div>
        </div>

        <InlineFeedback message={feedback?.message ?? null} tone={feedback?.tone} />

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-3">
            <span className="mr-2 text-sm font-medium text-primary">
              Đã chọn {selectedIds.length}
            </span>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              Bỏ chọn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAction("publish")}
            >
              Đăng bán
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAction("hide")}
            >
              Ẩn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkEditorOpen(true)}
            >
              Giá / tồn kho
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkAction("delete")}
            >
              <IconTrash data-icon="inline-start" />
              Xóa
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-3" />
              <TableHead className="w-10 px-2">
                <Checkbox
                  checked={
                    visibleProducts.length > 0 &&
                    selectedIds.length === visibleProducts.length
                  }
                  onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                  aria-label="Chọn tất cả"
                />
              </TableHead>
              <TableHead className="w-[84px]">Ảnh</TableHead>
              <TableHead className="min-w-[280px]">Sản phẩm</TableHead>
              <TableHead className="min-w-[150px]">Loại</TableHead>
              <TableHead className="text-right">Có thể bán</TableHead>
              <TableHead className="text-right">Tồn kho</TableHead>
              <TableHead className="min-w-[120px]">Ngày khởi tạo</TableHead>
              <TableHead className="min-w-[120px]">Cập nhật cuối</TableHead>
              <TableHead className="w-12 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center">
                  <IconLoader2 className="mx-auto animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : visibleProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-40 text-center text-muted-foreground"
                >
                  Không tìm thấy sản phẩm nào.
                </TableCell>
              </TableRow>
            ) : (
              visibleProducts.map((product) => {
                const thumb = getProductThumbnail(product)
                const status = statusConfig[product.status]
                const loadedVariants =
                  variantsByProductId[product.id] ?? product.variants
                const variantsCount = product.variantsCount ?? loadedVariants.length
                const isExpanded = expandedIds.includes(product.id)
                const isVariantsLoading = loadingVariantIds.includes(product.id)
                const hasVariantError = variantErrorIds.includes(product.id)
                const canExpand = variantsCount > 0
                const available = getProductAvailable(product)
                const quantity = getProductQuantity(product)

                return (
                  <React.Fragment key={product.id}>
                    <TableRow
                      aria-expanded={isExpanded}
                      data-state={selectedIds.includes(product.id) ? "selected" : undefined}
                      className={cn(
                        "hover:bg-info-soft/40",
                        isExpanded && "bg-info-soft/60 hover:bg-info-soft/70"
                      )}
                    >
                      <TableCell className="px-3">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={!canExpand}
                          aria-label={
                            isExpanded ? "Thu gọn biến thể" : "Xem biến thể"
                          }
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpanded(product)}
                        >
                          {isVariantsLoading ? (
                            <IconLoader2 className="animate-spin" />
                          ) : isExpanded ? (
                            <IconChevronDown />
                          ) : (
                            <IconChevronsRight />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="px-2">
                        <Checkbox
                          checked={selectedIds.includes(product.id)}
                          onCheckedChange={(checked) =>
                            toggleSelect(product.id, checked === true)
                          }
                          aria-label={`Chọn ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <ProductImageCell
                          src={thumb}
                          alt={product.image?.altText || product.name}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-1">
                          <Link
                            href={`/products/${product.id}`}
                            className="w-fit max-w-[420px] truncate font-medium text-primary hover:underline"
                          >
                            {product.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {product.sku && (
                              <span className="font-mono text-xs text-muted-foreground truncate max-w-[240px] block" title={product.sku}>
                                {product.sku}
                              </span>
                            )}
                            {variantsCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({variantsCount} phiên bản)
                              </span>
                            )}
                            {product.isFeatured && (
                              <Badge variant="outline" className="h-5 rounded-md px-1.5">
                                Nổi bật
                              </Badge>
                            )}
                            {product.isBestSeller && (
                              <Badge variant="outline" className="h-5 rounded-md px-1.5">
                                Bán chạy
                              </Badge>
                            )}
                            {product.isNewArrival && (
                              <Badge variant="outline" className="h-5 rounded-md px-1.5">
                                Mới
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{productTypeLabels[product.type] ?? product.type}</span>
                          <Badge
                            variant="secondary"
                            className={cn("w-fit rounded-md border-transparent", status?.className)}
                          >
                            {status?.label || product.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{compactNumber.format(available)}</div>
                        {variantsCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ({variantsCount} phiên bản)
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{compactNumber.format(quantity)}</div>
                        {product.stockSummary?.isLowStock && (
                          <div className="text-xs text-danger">Sắp hết</div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(product.createdAt)}</TableCell>
                      <TableCell>{formatDate(product.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <IconDotsVertical />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {hasPermission('products.update') && (
                              <DropdownMenuItem asChild>
                                <Link href={`/products/${product.id}`}>
                                  <IconEdit data-icon="inline-start" />
                                  Sửa
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}`}>
                                <IconEye data-icon="inline-start" />
                                Xem chi tiết
                              </Link>
                            </DropdownMenuItem>
                            {hasPermission('products.delete') && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedIds([product.id])
                                  setBulkAction("delete")
                                }}
                              >
                                <IconTrash data-icon="inline-start" />
                                Xóa
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-info-soft/35 hover:bg-info-soft/35">
                        <TableCell colSpan={10} className="p-0">
                          <div className="ml-20 max-w-[1040px] border-l bg-card">
                            <Table>
                              <TableHeader className="bg-card">
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="min-w-[300px] pl-6">
                                    Phiên bản
                                  </TableHead>
                                  <TableHead className="text-right">Tồn kho</TableHead>
                                  <TableHead className="text-right">Có thể bán</TableHead>
                                  <TableHead className="text-right">Đang giao dịch</TableHead>
                                  <TableHead className="text-right">Giá bán lẻ</TableHead>
                                  <TableHead className="text-right">Giá bán buôn</TableHead>
                                  <TableHead className="text-right pr-6">Giá nhập</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {isVariantsLoading ? (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell
                                      colSpan={7}
                                      className="h-20 text-center text-muted-foreground"
                                    >
                                      <IconLoader2 className="mx-auto animate-spin" />
                                    </TableCell>
                                  </TableRow>
                                ) : hasVariantError ? (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell
                                      colSpan={7}
                                      className="h-20 text-center text-muted-foreground"
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadProductVariants(product.id)}
                                      >
                                        Táº£i láº¡i biáº¿n thá»ƒ
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ) : loadedVariants.length === 0 ? (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell
                                      colSpan={7}
                                      className="h-20 text-center text-muted-foreground"
                                    >
                                      ChÆ°a cÃ³ biáº¿n thá»ƒ.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  loadedVariants.map((variant) => {
                                  const retailPrice =
                                    variant.salePrice ??
                                    variant.price ??
                                    product.salePrice ??
                                    product.originalPrice

                                  return (
                                    <TableRow key={variant.id} className="hover:bg-muted/40">
                                      <TableCell className="pl-6">
                                        <div className="flex min-w-0 items-center gap-3">
                                          <ProductImageCell
                                            src={thumb}
                                            alt={getVariantName(product, variant)}
                                            size="sm"
                                          />
                                          <div className="min-w-0">
                                            <Link
                                              href={`/variants`}
                                              className="block max-w-[360px] truncate text-primary hover:underline"
                                            >
                                              {getVariantName(product, variant)}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                              <span className="font-mono">{variant.sku}</span>
                                              {variant.colorName && <span>{variant.colorName}</span>}
                                              {variant.sizeLabel && <span>Size {variant.sizeLabel}</span>}
                                              {!variant.isActive && (
                                                <span className="text-danger">Tạm tắt</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {compactNumber.format(getVariantQuantity(variant))}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {compactNumber.format(getVariantAvailable(variant))}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {compactNumber.format(getVariantReserved(variant))}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatPrice(retailPrice)}
                                      </TableCell>
                                      <TableCell className="text-right">-</TableCell>
                                      <TableCell className="text-right pr-6">-</TableCell>
                                    </TableRow>
                                  )
                                })
                                )}
                              </TableBody>
                            </Table>
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
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page}/{pagination.totalPages} ({pagination.total} sản phẩm)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={pagination.page <= 1}
            >
              <IconChevronLeft data-icon="inline-start" />
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
                    variant={pagination.page === page ? "default" : "outline"}
                    size="icon-sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
              }
              disabled={pagination.page >= pagination.totalPages}
            >
              Sau
              <IconChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!bulkAction}
        title={`Xác nhận ${bulkActionText} sản phẩm?`}
        description={`Thao tác này sẽ áp dụng cho ${selectedIds.length} sản phẩm đã chọn.`}
        confirmLabel={bulkAction === "delete" ? "Xóa" : "Xác nhận"}
        destructive={bulkAction === "delete"}
        isLoading={isBulkLoading}
        onOpenChange={(open) => !open && setBulkAction(null)}
        onConfirm={runBulkAction}
      />

      <Dialog open={bulkEditorOpen} onOpenChange={setBulkEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật giá và tồn kho hàng loạt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Giá gốc mới
              <Input
                type="number"
                value={bulkEditorForm.originalPrice}
                onChange={(event) =>
                  setBulkEditorForm((current) => ({
                    ...current,
                    originalPrice: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Giá sale mới
              <Input
                type="number"
                value={bulkEditorForm.salePrice}
                onChange={(event) =>
                  setBulkEditorForm((current) => ({
                    ...current,
                    salePrice: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Tồn kho mới
              <Input
                type="number"
                value={bulkEditorForm.stockQuantity}
                onChange={(event) =>
                  setBulkEditorForm((current) => ({
                    ...current,
                    stockQuantity: event.target.value,
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Ngưỡng sắp hết
              <Input
                type="number"
                value={bulkEditorForm.lowStockThreshold}
                onChange={(event) =>
                  setBulkEditorForm((current) => ({
                    ...current,
                    lowStockThreshold: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkEditorOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={runBulkPriceStockUpdate}
              disabled={isBulkLoading}
            >
              {isBulkLoading && <IconLoader2 data-icon="inline-start" className="animate-spin" />}
              Cập nhật {selectedIds.length} sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
