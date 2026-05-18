"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconDeviceFloppy,
  IconCornerDownRight,
  IconFolder,
  IconGripVertical,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { categoryService } from "@/lib/api/services/category.service"
import {
  Category,
  CreateCategoryPayloadSchema,
  CreateCategoryPayload,
  CreateCategoryFormInput,
} from "@/lib/api/schemas/category.schema"
import { CategoryStatus } from "@/lib/api/schemas/enums"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { color: string; label: string }> = {
  [CategoryStatus.ACTIVE]: { color: "bg-emerald-100 text-emerald-700", label: "Hiển thị" },
  [CategoryStatus.INACTIVE]: { color: "bg-amber-100 text-amber-700", label: "Đã ẩn" },
}

const mockCategories: Category[] = [
  {
    id: "c1",
    name: "Giày Boot Nam",
    slug: "giay-boot-nam",
    description: "Bộ sưu tập giày boot nam cao cấp",
    status: "ACTIVE",
    sortOrder: 1,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "c2",
    name: "Phụ kiện đồ da",
    slug: "phu-kien-do-da",
    description: "Ví da, thắt lưng, túi xách",
    status: "ACTIVE",
    sortOrder: 2,
    createdAt: "2026-05-02T10:00:00Z",
  }
]

type CategoryTreeRow = Category & {
  depth: number
  parentName: string | null
}
type DropPosition = "before" | "inside" | "after"
type DropTarget = {
  categoryId: string
  position: DropPosition
}

function buildCategoryTreeRows(categories: Category[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const childrenByParent = new Map<string | null, Category[]>()

  categories.forEach((category) => {
    const parentKey = category.parentId && categoryById.has(category.parentId) ? category.parentId : null
    const children = childrenByParent.get(parentKey) ?? []
    children.push(category)
    childrenByParent.set(parentKey, children)
  })

  childrenByParent.forEach((children) => {
    children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "vi"))
  })

  const rows: CategoryTreeRow[] = []
  const walk = (parentId: string | null, depth: number, parentName: string | null) => {
    const children = childrenByParent.get(parentId) ?? []

    children.forEach((category) => {
      rows.push({ ...category, depth, parentName })
      walk(category.id, depth + 1, category.name)
    })
  }

  walk(null, 0, null)

  return rows
}

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [draggingCategoryId, setDraggingCategoryId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null)
  const [pendingCategoryOrder, setPendingCategoryOrder] = React.useState<Array<{ id: string; parentId: string | null; sortOrder: number }>>([])
  const [isSavingOrder, setIsSavingOrder] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryFormInput, unknown, CreateCategoryPayload>({
    resolver: zodResolver(CreateCategoryPayloadSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "ACTIVE",
      parentId: null,
      sortOrder: 0,
      seo: {
        metaTitle: "",
        metaDescription: "",
        canonicalUrl: "",
      }
    },
  })

  const fetchCategories = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await categoryService.getCategories()
      setCategories(data.data)
      setPendingCategoryOrder([])
    } catch (error) {
      console.warn("Failed to fetch categories, using mock data", error)
      setCategories(mockCategories)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleOpenSheet = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        status: category.status as any,
        parentId: category.parentId ?? null,
        sortOrder: category.sortOrder,
        seo: category.seo || { metaTitle: "", metaDescription: "", canonicalUrl: "" },
      })
    } else {
      setEditingCategory(null)
      reset({
        name: "",
        slug: "",
        description: "",
        status: "ACTIVE",
        parentId: null,
        sortOrder: 0,
        seo: { metaTitle: "", metaDescription: "", canonicalUrl: "" },
      })
    }
    setIsSheetOpen(true)
  }

  const onSubmit = async (data: CreateCategoryPayload) => {
    try {
      setIsSaving(true)
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data)
      } else {
        await categoryService.createCategory(data)
      }
      setIsSheetOpen(false)
      fetchCategories()
    } catch (error) {
      console.error("Failed to save category", error)
    } finally {
      setIsSaving(false)
    }
  }

  const categoryRows = React.useMemo(() => buildCategoryTreeRows(categories), [categories])
  const parentOptions = React.useMemo(
    () => categoryRows.filter((category) => category.id !== editingCategory?.id),
    [categoryRows, editingCategory?.id]
  )
  const filteredCategories = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return categoryRows

    return categoryRows.filter((category) =>
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      category.parentName?.toLowerCase().includes(query)
    )
  }, [categoryRows, searchQuery])

  const getDropPosition = (event: React.DragEvent<HTMLTableRowElement>): DropPosition => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const ratio = offsetY / rect.height

    if (ratio < 0.3) return "before"
    if (ratio > 0.7) return "after"
    return "inside"
  }

  const handleDragOverCategory = (event: React.DragEvent<HTMLTableRowElement>, category: Category) => {
    event.preventDefault()
    if (!draggingCategoryId || draggingCategoryId === category.id) return
    setDropTarget({ categoryId: category.id, position: getDropPosition(event) })
  }

  const handleDropOnCategory = async (targetCategory: Category, position: DropPosition) => {
    if (!draggingCategoryId || draggingCategoryId === targetCategory.id) return

    const draggedCategory = categories.find((category) => category.id === draggingCategoryId)
    const targetParentId = position === "inside" ? targetCategory.id : targetCategory.parentId ?? null

    if (!draggedCategory || targetParentId === draggingCategoryId) {
      setDraggingCategoryId(null)
      setDropTarget(null)
      return
    }

    const parentCategory = targetParentId
      ? categories.find((category) => category.id === targetParentId)
      : null
    const siblings = categories
      .filter((category) => (category.parentId ?? null) === targetParentId && category.id !== draggingCategoryId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "vi"))
    const targetIndex = position === "inside"
      ? siblings.length
      : siblings.findIndex((category) => category.id === targetCategory.id)

    if (targetIndex === -1) {
      setDraggingCategoryId(null)
      setDropTarget(null)
      return
    }

    const reorderedSiblings = [...siblings]
    const insertIndex =
      position === "inside" ? targetIndex : position === "before" ? targetIndex : targetIndex + 1
    reorderedSiblings.splice(insertIndex, 0, {
      ...draggedCategory,
      parentId: targetParentId,
      parent: parentCategory
        ? { id: parentCategory.id, name: parentCategory.name, slug: parentCategory.slug }
        : null,
    })

    const updates = reorderedSiblings.map((category, index) => ({
      id: category.id,
      parentId: category.id === draggingCategoryId ? targetParentId : category.parentId ?? null,
      sortOrder: (index + 1) * 10,
      parent:
        category.id === draggingCategoryId && parentCategory
          ? { id: parentCategory.id, name: parentCategory.name, slug: parentCategory.slug }
          : category.id === draggingCategoryId
            ? null
            : category.parent ?? null,
    }))

    try {
      setCategories((current) =>
        current.map((category) => {
          const update = updates.find((item) => item.id === category.id)
          return update
            ? { ...category, parentId: update.parentId, parent: update.parent, sortOrder: update.sortOrder }
            : category
        })
      )
      setPendingCategoryOrder((current) => {
        const next = new Map(current.map((item) => [item.id, item]))
        updates.forEach((update) => {
          next.set(update.id, {
            id: update.id,
            parentId: update.parentId,
            sortOrder: update.sortOrder,
          })
        })
        return Array.from(next.values())
      })
    } catch (error) {
      console.error("Failed to reorder category", error)
      fetchCategories()
    } finally {
      setDraggingCategoryId(null)
      setDropTarget(null)
    }
  }

  const handleSaveCategoryOrder = async () => {
    if (!pendingCategoryOrder.length) return

    try {
      setIsSavingOrder(true)
      await Promise.all(
        pendingCategoryOrder.map((update) =>
          categoryService.updateCategory(update.id, {
            parentId: update.parentId,
            sortOrder: update.sortOrder,
          })
        )
      )
      await fetchCategories()
    } catch (error) {
      console.error("Failed to save category order", error)
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleMoveToRoot = async (category: Category) => {
    if (!category.parentId) return

    try {
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, parentId: null, parent: null } : item
        )
      )
      await categoryService.updateCategory(category.id, { parentId: null })
      fetchCategories()
    } catch (error) {
      console.error("Failed to move category to root", error)
      fetchCategories()
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh mục sản phẩm của cửa hàng.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleSaveCategoryOrder}
            disabled={!pendingCategoryOrder.length || isSavingOrder}
          >
            {isSavingOrder ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
            Lưu thứ tự
          </Button>
          <Button className="rounded-xl" onClick={() => handleOpenSheet()}>
            <IconPlus className="mr-2 size-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, slug..."
            className="w-full rounded-xl pl-9 md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {pendingCategoryOrder.length > 0 && (
          <p className="text-sm text-orange-600">
            Có {pendingCategoryOrder.length} thay đổi thứ tự chưa lưu.
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[72px] h-12">Cấp</TableHead>
              <TableHead className="h-12">Tên danh mục</TableHead>
              <TableHead className="h-12">Danh mục cha</TableHead>
              <TableHead className="h-12">Slug</TableHead>
              <TableHead className="h-12">Trạng thái</TableHead>
              <TableHead className="h-12">Ngày tạo</TableHead>
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
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy danh mục nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow
                  key={category.id}
                  draggable
                  onDragStart={() => setDraggingCategoryId(category.id)}
                  onDragEnd={() => {
                    setDraggingCategoryId(null)
                    setDropTarget(null)
                  }}
                  onDragEnter={() => {
                    if (draggingCategoryId && draggingCategoryId !== category.id) {
                      setDropTarget({ categoryId: category.id, position: "inside" })
                    }
                  }}
                  onDragOver={(event) => handleDragOverCategory(event, category)}
                  onDragLeave={() => {
                    if (dropTarget?.categoryId === category.id) {
                      setDropTarget(null)
                    }
                  }}
                  onDrop={() => handleDropOnCategory(category, dropTarget?.position ?? "after")}
                  className={cn(
                    "relative transition-all hover:bg-orange-50/50",
                    draggingCategoryId === category.id && "opacity-45",
                    dropTarget?.categoryId === category.id &&
                      dropTarget.position === "inside" &&
                      "z-10 bg-white shadow-[0_0_0_2px_rgba(249,115,22,0.5),0_10px_24px_rgba(249,115,22,0.12)]",
                    dropTarget?.categoryId === category.id &&
                      dropTarget.position === "before" &&
                      "shadow-[inset_0_3px_0_rgba(249,115,22,0.9)]",
                    dropTarget?.categoryId === category.id &&
                      dropTarget.position === "after" &&
                      "shadow-[inset_0_-3px_0_rgba(249,115,22,0.9)]"
                  )}
                >
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      {category.depth === 0 ? "Gốc" : `Cấp ${category.depth}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: category.depth * 22 }}>
                        <IconGripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                        {category.depth > 0 ? (
                          <IconCornerDownRight className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <IconFolder className="size-4 shrink-0 text-orange-500" />
                        )}
                        <span>{category.name}</span>
                      </div>
                      {dropTarget?.categoryId === category.id && (
                        <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                          {dropTarget.position === "before"
                            ? "Chèn phía trên"
                            : dropTarget.position === "after"
                              ? "Chèn phía dưới"
                              : "Đưa vào làm con"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.parentName || "Không có"}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={statusConfig[category.status]?.color + " border-transparent rounded-md"}
                    >
                      {statusConfig[category.status]?.label || category.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {category.createdAt ? new Date(category.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-32">
                        <DropdownMenuItem onClick={() => handleOpenSheet(category)} className="rounded-lg cursor-pointer">
                          <IconEdit className="mr-2 size-4" /> Sửa
                        </DropdownMenuItem>
                        {category.parentId && (
                          <DropdownMenuItem onClick={() => handleMoveToRoot(category)} className="rounded-lg cursor-pointer">
                            <IconFolder className="mr-2 size-4" /> Đưa về gốc
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <IconTrash className="mr-2 size-4" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex h-dvh w-full flex-col overflow-hidden p-0 sm:max-w-[480px]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="shrink-0 border-b p-6 pb-4">
              <SheetTitle>
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
              </SheetTitle>
              <SheetDescription>
                Điền thông tin chi tiết cho danh mục sản phẩm.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-5 p-6 pb-8">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên danh mục *</Label>
                  <Input id="name" {...register("name")} className="rounded-xl" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input id="slug" {...register("slug")} className="rounded-xl" />
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea 
                    id="description" 
                    {...register("description")} 
                    className="rounded-xl min-h-[100px]" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Danh mục cha</Label>
                  <Controller
                    name="parentId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => field.onChange(value === "ROOT" ? null : value)}
                        value={field.value || "ROOT"}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Chọn danh mục cha" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="ROOT">Không có - danh mục gốc</SelectItem>
                          {parentOptions.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {"— ".repeat(category.depth)}{category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value={CategoryStatus.ACTIVE}>Hiển thị</SelectItem>
                            <SelectItem value={CategoryStatus.INACTIVE}>Ẩn</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
                    <Input 
                      id="sortOrder" 
                      type="number" 
                      {...register("sortOrder", { valueAsNumber: true })} 
                      className="rounded-xl" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t mt-2">
                  <h4 className="text-sm font-semibold mb-4">Thông tin SEO</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="seo.metaTitle">Tiêu đề meta</Label>
                      <Input id="seo.metaTitle" {...register("seo.metaTitle")} className="rounded-xl text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo.metaDescription">Mô tả meta</Label>
                      <Textarea id="seo.metaDescription" {...register("seo.metaDescription")} className="rounded-xl text-sm min-h-[80px]" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="shrink-0 border-t bg-background p-6">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="rounded-xl w-full">
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl w-full">
                {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
                Lưu
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
