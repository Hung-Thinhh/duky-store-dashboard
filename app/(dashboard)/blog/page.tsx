"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconFilter,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { blogService } from "@/lib/api/services/blog.service"
import type {
  BlogCategory,
  BlogMedia,
  BlogPostSummary,
} from "@/lib/api/schemas/blog.schema"
import { ContentStatus } from "@/lib/api/schemas/enums"
import type { Pagination } from "@/lib/api/schemas/base.schema"
import { cn } from "@/lib/utils"

const ALL_STATUSES = "ALL"
const ALL_CATEGORIES = "ALL"

const statusConfig: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  [ContentStatus.PUBLISHED]: {
    label: "Đã đăng",
    className: "bg-success-soft text-success",
    dotClassName: "bg-success",
  },
  [ContentStatus.DRAFT]: {
    label: "Bản nháp",
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
  [ContentStatus.HIDDEN]: {
    label: "Đã ẩn",
    className: "bg-warning-soft text-foreground",
    dotClassName: "bg-warning",
  },
  [ContentStatus.ARCHIVED]: {
    label: "Lưu trữ",
    className: "bg-secondary text-secondary-foreground",
    dotClassName: "bg-muted-foreground",
  },
}

type Feedback = {
  message: string
  tone: "info" | "success" | "error"
}

const initialPagination: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

function getMediaUrl(media?: BlogMedia | null) {
  return media?.secureUrl || media?.url || ""
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có"

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function getCategoryNames(post: BlogPostSummary) {
  if (!post.categories?.length) return "Chưa phân loại"
  return post.categories.map((category: any) => category.name).join(", ")
}

function getPageNumbers(pagination: Pagination) {
  const pages: Array<number | "..."> = []
  const total = pagination.totalPages || 1
  const current = pagination.page || 1

  if (total <= 7) {
    for (let index = 1; index <= total; index++) pages.push(index)
  } else if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total)
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total)
  }

  return pages
}

function BlogCover({ post }: { post: BlogPostSummary }) {
  const imageUrl = getMediaUrl(post.coverMedia)

  if (!imageUrl) {
    return (
      <div className="flex size-12 items-center justify-center rounded-md border bg-muted text-[10px] text-muted-foreground">
        No img
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={post.coverMedia?.altText || post.title}
      className="size-12 rounded-md object-cover"
    />
  )
}

function BlogPostsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = React.useState<BlogPostSummary[]>([])
  const [categories, setCategories] = React.useState<BlogCategory[]>([])
  const [pagination, setPagination] =
    React.useState<Pagination>(initialPagination)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") || "")
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") || ALL_STATUSES)
  const [categoryFilter, setCategoryFilter] = React.useState(searchParams.get("category") || ALL_CATEGORIES)
  const [sort, setSort] = React.useState<"newest" | "oldest">(
    (searchParams.get("sort") as "newest" | "oldest") || "newest"
  )
  const [currentPage, setCurrentPage] = React.useState(
    Number(searchParams.get("page")) || 1
  )

  // Sync URL when page/filters change
  React.useEffect(() => {
    const params = new URLSearchParams()
    if (currentPage > 1) params.set("page", String(currentPage))
    if (statusFilter !== ALL_STATUSES) params.set("status", statusFilter)
    if (categoryFilter !== ALL_CATEGORIES) params.set("category", categoryFilter)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (sort !== "newest") params.set("sort", sort)
    const qs = params.toString()
    router.replace(`/blog${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [currentPage, statusFilter, categoryFilter, searchQuery, sort, router])
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [postToDelete, setPostToDelete] = React.useState<BlogPostSummary | null>(null)

  const fetchPosts = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setFeedback(null)

      const data = await blogService.getPosts({
        page: currentPage,
        limit: pagination.limit,
        sort,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(statusFilter !== ALL_STATUSES ? { status: statusFilter } : {}),
        ...(categoryFilter !== ALL_CATEGORIES
          ? { categorySlug: categoryFilter }
          : {}),
      })

      setPosts(data.data)
      setPagination(data.pagination!) 
    } catch (error) {
      console.error("Failed to fetch blog posts", error)
      setPosts([])
      setPagination((current) => ({
        ...current,
        page: currentPage,
        total: 0,
        totalPages: 1,
      }))
      setFeedback({
        message: "Không tải được danh sách bài viết từ API.",
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
    sort,
    statusFilter,
  ])

  React.useEffect(() => {
    const timeout = window.setTimeout(fetchPosts, 250)
    return () => window.clearTimeout(timeout)
  }, [fetchPosts])

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await blogService.getCategories({ limit: 100 })
        setCategories(response.data)
      } catch (error) {
        console.error("Failed to fetch blog categories", error)
      }
    }

    fetchCategories()
  }, [])

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter(ALL_STATUSES)
    setCategoryFilter(ALL_CATEGORIES)
    setSort("newest")
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!postToDelete) return

    try {
      setIsDeleting(true)
      await blogService.deletePost(postToDelete.id)
      setFeedback({
        message: `Đã xoá bài viết "${postToDelete.title}".`,
        tone: "success",
      })
      setPostToDelete(null)
      await fetchPosts()
    } catch (error) {
      console.error("Failed to delete blog post", error)
      setFeedback({
        message: "Chưa xoá được bài viết. Kiểm tra API/backend rồi thử lại.",
        tone: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const copySlug = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(slug)
      setFeedback({ message: "Đã sao chép slug bài viết.", tone: "success" })
    } catch {
      setFeedback({ message: "Không sao chép được slug.", tone: "error" })
    }
  }

  const hasFilters =
    searchQuery ||
    statusFilter !== ALL_STATUSES ||
    categoryFilter !== ALL_CATEGORIES ||
    sort !== "newest"

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bài viết</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách, trạng thái xuất bản và nội dung blog bán hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchPosts}
            disabled={isLoading}
          >
            {isLoading ? (
              <IconLoader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <IconRefresh data-icon="inline-start" />
            )}
            Tải lại
          </Button>
          <Button asChild>
            <Link href="/blog/new">
              <IconPlus data-icon="inline-start" />
              Viết bài mới
            </Link>
          </Button>
        </div>
      </div>

      <InlineFeedback
        message={feedback?.message ?? null}
        tone={feedback?.tone}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconFilter />
            Bộ lọc bài viết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <IconSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm tiêu đề, slug, mô tả..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_STATUSES}>Tất cả trạng thái</SelectItem>
                  <SelectItem value={ContentStatus.PUBLISHED}>Đã đăng</SelectItem>
                  <SelectItem value={ContentStatus.DRAFT}>Bản nháp</SelectItem>
                  <SelectItem value={ContentStatus.HIDDEN}>Đã ẩn</SelectItem>
                  <SelectItem value={ContentStatus.ARCHIVED}>Lưu trữ</SelectItem>
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
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_CATEGORIES}>Tất cả danh mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as "newest" | "oldest")
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {hasFilters ? (
              <Button type="button" variant="ghost" onClick={resetFilters}>
                Xoá lọc
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto max-w-full rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[350px] max-w-[350px]">Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-20 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-40 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <IconLoader2 className="animate-spin" />
                    Đang tải bài viết...
                  </div>
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-40 text-center text-muted-foreground"
                >
                  Không tìm thấy bài viết phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => {
                const status = statusConfig[post.status ?? ContentStatus.DRAFT]

                return (
                  <TableRow
                    key={post.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="max-w-[320px]">
                      <div className="flex min-w-0 items-center gap-3">
                        <BlogCover post={post} />
                        <div className="min-w-0 max-w-[240px]">
                          <Link
                            href={`/blog/${post.id}`}
                            className="block truncate font-medium text-foreground hover:text-primary"
                          >
                            {post.title}
                          </Link>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            /blog/{post.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.author?.fullName || post.author?.email || "Admin"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </TableCell>
                    <TableCell className="max-w-48">
                      <span className="line-clamp-2 text-sm">
                        {getCategoryNames(post)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const score = post.seo?.seoScore
                        if (score == null) return <span className="text-xs text-muted-foreground">—</span>
                        const color = score >= 70 ? "bg-emerald-100 text-emerald-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        return (
                          <Badge variant="secondary" className={cn("border-transparent text-xs font-semibold", color)}>
                            {score}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("gap-1.5 border-transparent", status.className)}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", status.dotClassName)}
                        />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Mở thao tác bài viết"
                          >
                            <IconDotsVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.id}`}>
                                <IconEdit />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copySlug(post.slug)}>
                              <IconCopy />
                              Sao chép slug
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPostToDelete(post)}
                            >
                              <IconTrash />
                              Xoá bài viết
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            Trang {pagination.page || 1}/{pagination.totalPages || 1} ·{" "}
            {pagination.total} bài viết
          </span>
          <Select
            value={String(pagination.limit)}
            onValueChange={(value) => {
              setPagination((current) => ({
                ...current,
                limit: Number(value),
              }))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="25">25 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={isLoading || pagination.page <= 1}
          >
            <IconChevronLeft data-icon="inline-start" />
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {getPageNumbers(pagination).map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
                  type="button"
                  variant={pagination.page === page ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setCurrentPage(page)}
                  disabled={isLoading}
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
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(pagination.totalPages || 1, page + 1)
              )
            }
            disabled={isLoading || pagination.page >= pagination.totalPages}
          >
            Sau
            <IconChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!postToDelete}
        title="Xoá bài viết này?"
        description={
          postToDelete
            ? `Bài "${postToDelete.title}" sẽ bị xoá mềm khỏi dashboard.`
            : undefined
        }
        confirmLabel="Xoá bài viết"
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => !open && setPostToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default function BlogPostsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex h-screen items-center justify-center gap-2">
        <IconLoader2 className="animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Đang tải danh sách bài viết...</span>
      </div>
    }>
      <BlogPostsContent />
    </React.Suspense>
  )
}
