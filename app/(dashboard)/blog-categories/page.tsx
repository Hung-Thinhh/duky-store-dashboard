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

import { blogService } from "@/lib/api/services/blog.service"
import { BlogCategory, CreateBlogCategoryPayloadSchema, CreateBlogCategoryPayload } from "@/lib/api/schemas/blog.schema"
import { ContentStatus } from "@/lib/api/schemas/enums"

const statusConfig: Record<string, { color: string; label: string }> = {
  [ContentStatus.PUBLISHED]: { color: "bg-emerald-100 text-emerald-700", label: "Hiển thị" },
  [ContentStatus.DRAFT]: { color: "bg-slate-100 text-slate-700", label: "Bản nháp" },
  [ContentStatus.HIDDEN]: { color: "bg-amber-100 text-amber-700", label: "Đã ẩn" },
  [ContentStatus.ARCHIVED]: { color: "bg-zinc-100 text-zinc-700", label: "Lưu trữ" },
}

const mockCategories: BlogCategory[] = [
  {
    id: "bc_1",
    name: "Kiến thức đồ da",
    slug: "kien-thuc-do-da",
    description: "Cách bảo quản, nhận biết đồ da thật",
    status: "PUBLISHED",
    sortOrder: 1,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "bc_2",
    name: "Thời trang & Phối đồ",
    slug: "thoi-trang-phoi-do",
    description: "Xu hướng thời trang, cách mix match",
    status: "PUBLISHED",
    sortOrder: 2,
    createdAt: "2026-05-02T10:00:00Z",
  }
]

export default function BlogCategoriesPage() {
  const [categories, setCategories] = React.useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<BlogCategory | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateBlogCategoryPayload>({
    resolver: zodResolver(CreateBlogCategoryPayloadSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "PUBLISHED",
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
      const data = await blogService.getCategories()
      setCategories(data.data)
    } catch (error) {
      console.error("Failed to fetch blog categories", error)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleOpenSheet = (category?: BlogCategory) => {
    if (category) {
      setEditingCategory(category)
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        status: category.status as any,
        sortOrder: category.sortOrder,
        seo: category.seo || { metaTitle: "", metaDescription: "", canonicalUrl: "" },
      })
    } else {
      setEditingCategory(null)
      reset({
        name: "",
        slug: "",
        description: "",
        status: "PUBLISHED",
        sortOrder: 0,
        seo: { metaTitle: "", metaDescription: "", canonicalUrl: "" },
      })
    }
    setIsSheetOpen(true)
  }

  const onSubmit = async (data: CreateBlogCategoryPayload) => {
    try {
      setIsSaving(true)
      if (editingCategory) {
        await blogService.updateCategory(editingCategory.id, data)
      } else {
        await blogService.createCategory(data)
      }
      setIsSheetOpen(false)
      fetchCategories()
    } catch (error) {
      console.error("Failed to save blog category", error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các chuyên mục bài viết.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl" onClick={() => handleOpenSheet()}>
            <IconPlus className="mr-2 size-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, slug..."
            className="w-full rounded-xl pl-9 md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card max-w-5xl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px] h-12">Thứ tự</TableHead>
              <TableHead className="h-12 w-[300px]">Tên danh mục</TableHead>
              <TableHead className="h-12">Slug</TableHead>
              <TableHead className="h-12">Trạng thái</TableHead>
              <TableHead className="h-12 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy danh mục nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-center">{category.sortOrder}</TableCell>
                  <TableCell className="font-medium text-primary">{category.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={(statusConfig[category.status ?? "PUBLISHED"]?.color ?? "") + " border-transparent rounded-md"}
                    >
                      {statusConfig[category.status ?? "PUBLISHED"]?.label || category.status}
                    </Badge>
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[480px]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader className="border-b p-6 pb-4">
              <SheetTitle>
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="flex flex-col gap-5">
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
                            <SelectItem value={ContentStatus.PUBLISHED}>Hiển thị</SelectItem>
                            <SelectItem value={ContentStatus.DRAFT}>Bản nháp</SelectItem>
                            <SelectItem value={ContentStatus.HIDDEN}>Ẩn</SelectItem>
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
              </div>
            </ScrollArea>

            <SheetFooter className="border-t p-6">
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
