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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { tagService } from "@/lib/api/services/tag.service"
import { Tag, CreateTagPayloadSchema, CreateTagPayload } from "@/lib/api/schemas/tag.schema"
import { TagType } from "@/lib/api/schemas/enums"

const typeConfig: Record<string, { color: string; label: string }> = {
  [TagType.PRODUCT]: { color: "bg-blue-100 text-blue-700", label: "Sản phẩm" },
  [TagType.BLOG]: { color: "bg-amber-100 text-amber-700", label: "Bài viết" },
  [TagType.BOTH]: { color: "bg-emerald-100 text-emerald-700", label: "Chung" },
}

const mockTags: Tag[] = [
  {
    id: "t1",
    name: "Da bò thật",
    slug: "da-bo-that",
    type: "PRODUCT",
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "t2",
    name: "Mẹo phối đồ",
    slug: "meo-phoi-do",
    type: "BLOG",
    createdAt: "2026-05-02T10:00:00Z",
  },
  {
    id: "t3",
    name: "Khuyến mãi",
    slug: "khuyen-mai",
    type: "BOTH",
    createdAt: "2026-05-03T10:00:00Z",
  }
]

export default function TagsPage() {
  const [tags, setTags] = React.useState<Tag[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTagPayload>({
    resolver: zodResolver(CreateTagPayloadSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "BOTH",
    },
  })

  const fetchTags = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await tagService.getTags()
      setTags(data.data)
    } catch (error) {
      console.error("Failed to fetch tags", error)
      setTags([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleOpenSheet = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag)
      reset({
        name: tag.name,
        slug: tag.slug,
        type: tag.type as any,
      })
    } else {
      setEditingTag(null)
      reset({
        name: "",
        slug: "",
        type: "BOTH",
      })
    }
    setIsSheetOpen(true)
  }

  const onSubmit = async (data: CreateTagPayload) => {
    try {
      setIsSaving(true)
      if (editingTag) {
        await tagService.updateTag(editingTag.id, data)
      } else {
        await tagService.createTag(data)
      }
      setIsSheetOpen(false)
      fetchTags()
    } catch (error) {
      console.error("Failed to save tag", error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý từ khóa / nhãn cho sản phẩm và bài viết.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl" onClick={() => handleOpenSheet()}>
            <IconPlus className="mr-2 size-4" />
            Thêm tag
          </Button>
        </div>
      </div>

      {/* Search */}
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card max-w-4xl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 w-[250px]">Tên tag</TableHead>
              <TableHead className="h-12 w-[250px]">Slug</TableHead>
              <TableHead className="h-12">Phân loại</TableHead>
              <TableHead className="h-12 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy tag nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredTags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-primary">{tag.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{tag.slug}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={(typeConfig[tag.type ?? "BOTH"]?.color ?? "") + " border-transparent rounded-md"}
                    >
                      {typeConfig[tag.type ?? "BOTH"]?.label || tag.type}
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
                        <DropdownMenuItem onClick={() => handleOpenSheet(tag)} className="rounded-lg cursor-pointer">
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

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[400px]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader className="border-b p-6 pb-4">
              <SheetTitle>
                {editingTag ? "Sửa tag" : "Thêm tag mới"}
              </SheetTitle>
              <SheetDescription>
                Điền tên và slug cho tag.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-6 flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Tên tag *</Label>
                <Input id="name" {...register("name")} className="rounded-xl" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" {...register("slug")} className="rounded-xl" />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label>Phân loại</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value={TagType.PRODUCT}>Sản phẩm</SelectItem>
                        <SelectItem value={TagType.BLOG}>Bài viết</SelectItem>
                        <SelectItem value={TagType.BOTH}>Chung</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

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
