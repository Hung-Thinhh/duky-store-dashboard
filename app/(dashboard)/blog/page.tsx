"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

import { blogService } from "@/lib/api/services/blog.service"
import { BlogPost } from "@/lib/api/schemas/blog.schema"
import { ContentStatus } from "@/lib/api/schemas/enums"

const statusConfig: Record<string, { color: string; label: string }> = {
  [ContentStatus.PUBLISHED]: { color: "bg-emerald-100 text-emerald-700", label: "Đã xuất bản" },
  [ContentStatus.DRAFT]: { color: "bg-slate-100 text-slate-700", label: "Bản nháp" },
  [ContentStatus.HIDDEN]: { color: "bg-amber-100 text-amber-700", label: "Đã ẩn" },
  [ContentStatus.ARCHIVED]: { color: "bg-zinc-100 text-zinc-700", label: "Lưu trữ" },
}

const mockPosts: BlogPost[] = [
  {
    id: "bp_1",
    title: "Cách phân biệt da bò thật và giả",
    slug: "cach-phan-biet-da-bo-that-va-gia",
    status: "PUBLISHED",
    categoryId: "bc_1",
    publishedAt: "2026-05-01T10:00:00Z",
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "bp_2",
    title: "Xu hướng giày boot nam thu đông 2026",
    slug: "xu-huong-giay-boot-nam-thu-dong-2026",
    status: "DRAFT",
    categoryId: "bc_2",
    createdAt: "2026-05-05T10:00:00Z",
  }
]

export default function BlogPostsPage() {
  const [posts, setPosts] = React.useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        const data = await blogService.getPosts()
        setPosts(data.data)
      } catch (error) {
        console.warn("Failed to fetch blog posts, using mock data", error)
        setPosts(mockPosts)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bài viết</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý nội dung bài viết trên blog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/blog/new">
              <IconPlus className="mr-2 size-4" />
              Viết bài mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tiêu đề..."
            className="w-full rounded-xl pl-9 md:w-[350px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12">Bài viết</TableHead>
              <TableHead className="h-12">Danh mục</TableHead>
              <TableHead className="h-12">Trạng thái</TableHead>
              <TableHead className="h-12">Ngày xuất bản</TableHead>
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
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-primary">{post.title}</span>
                      <span className="text-xs text-muted-foreground">{post.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.categoryId || "Chưa có"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={(statusConfig[post.status ?? "DRAFT"]?.color ?? "") + " border-transparent rounded-md"}
                    >
                      {statusConfig[post.status ?? "DRAFT"]?.label || post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN") : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-32">
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                          <Link href={`/blog/${post.id}`}>
                            <IconEdit className="mr-2 size-4" /> Sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg cursor-pointer">
                          <IconEye className="mr-2 size-4" /> Xem public
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
    </div>
  )
}
