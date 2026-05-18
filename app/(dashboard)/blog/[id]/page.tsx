"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { blogService } from "@/lib/api/services/blog.service"
import { CreateBlogPostPayload, CreateBlogPostPayloadSchema } from "@/lib/api/schemas/blog.schema"
import { ContentStatus } from "@/lib/api/schemas/enums"

export default function BlogPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === "new"

  const [isLoading, setIsLoading] = React.useState(!isNew)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [thumbnailUrl, setThumbnailUrl] = React.useState("")

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBlogPostPayload>({
    resolver: zodResolver(CreateBlogPostPayloadSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      thumbnailMediaId: "",
      status: ContentStatus.DRAFT,
      categoryId: "",
      seo: {
        metaTitle: "",
        metaDescription: "",
        canonicalUrl: "",
      },
    },
  })

  React.useEffect(() => {
    if (isNew) return

    const fetchPost = async () => {
      try {
        const data = await blogService.getPost(params.id as string)
        reset({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          thumbnailMediaId: data.thumbnailMediaId,
          status: data.status as any,
          categoryId: data.categoryId,
          seo: data.seo,
        })
      } catch (error) {
        console.error("Failed to fetch post", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [isNew, params.id, reset])

  const preview = watch()

  const onSubmit = async (data: CreateBlogPostPayload) => {
    try {
      setIsSaving(true)
      if (isNew) {
        await blogService.createPost(data)
      } else {
        await blogService.updatePost(params.id as string, data)
      }
      router.push("/blog")
    } catch (error) {
      console.error("Failed to save post", error)
      alert("Chưa lưu được bài viết. Kiểm tra backend/API rồi thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="sticky top-0 z-10 -mt-2 flex flex-col gap-4 bg-background/80 pb-4 pt-2 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/blog">
              <IconArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "Viết bài mới" : "Chỉnh sửa bài viết"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Soạn nội dung, chọn ảnh đại diện, kiểm tra SEO preview rồi lưu.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} className="rounded-xl">
            <IconEye className="mr-2 size-4" />
            Xem preview
          </Button>
          <Button type="button" variant="outline" asChild className="rounded-xl">
            <Link href="/blog">Hủy</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="rounded-xl">
            {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Nội dung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input id="title" {...register("title")} className="rounded-xl" />
                {errors.title ? <p className="text-xs text-destructive">{errors.title.message as string}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" {...register("slug")} className="rounded-xl font-mono text-sm" />
                {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message as string}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Mô tả ngắn</Label>
                <Textarea id="excerpt" {...register("excerpt")} className="min-h-[80px] rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung bài viết</Label>
                <Textarea
                  id="content"
                  {...register("content")}
                  className="min-h-[420px] rounded-xl font-mono text-sm"
                  placeholder="Hỗ trợ Markdown / HTML content..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin SEO</CardTitle>
              <CardDescription>Quản lý metadata theo bài viết để khớp sitemap và social preview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo.metaTitle">Tiêu đề meta</Label>
                <Input id="seo.metaTitle" {...register("seo.metaTitle")} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo.metaDescription">Mô tả meta</Label>
                <Textarea id="seo.metaDescription" {...register("seo.metaDescription")} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo.canonicalUrl">URL chính tắc</Label>
                <Input id="seo.canonicalUrl" {...register("seo.canonicalUrl")} className="rounded-xl font-mono text-sm" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trạng thái hiển thị</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value={ContentStatus.PUBLISHED}>Đã xuất bản</SelectItem>
                        <SelectItem value={ContentStatus.DRAFT}>Bản nháp</SelectItem>
                        <SelectItem value={ContentStatus.HIDDEN}>Ẩn</SelectItem>
                        <SelectItem value={ContentStatus.ARCHIVED}>Lưu trữ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Ảnh đại diện</CardTitle>
              <CardDescription>Chọn từ thư viện media dùng chung của dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input type="hidden" {...register("thumbnailMediaId")} />
              {thumbnailUrl ? (
                <div className="overflow-hidden rounded-xl border bg-muted">
                  <img src={thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-center text-muted-foreground">
                  <IconPhoto className="mb-2 size-8" />
                  Chưa chọn ảnh
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="flex-1 rounded-xl"
                >
                  <IconPlus className="mr-2 size-4" />
                  Chọn ảnh
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setThumbnailUrl("")
                    setValue("thumbnailMediaId", "")
                  }}
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>
              <Input readOnly value={preview.thumbnailMediaId || ""} className="rounded-xl font-mono text-xs" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Xem trước bài viết</DialogTitle>
            <DialogDescription>Kiểm tra tiêu đề, excerpt, ảnh đại diện và SEO trước khi lưu.</DialogDescription>
          </DialogHeader>
          <article className="space-y-5">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="aspect-[16/7] w-full rounded-xl object-cover" />
            ) : null}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{preview.status}</p>
              <h2 className="text-3xl font-bold tracking-tight">{preview.title || "Tiêu đề bài viết"}</h2>
              <p className="text-muted-foreground">{preview.excerpt || "Mô tả ngắn sẽ hiển thị ở đây."}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Đoạn xem trước SEO</p>
              <p className="mt-2 text-base text-primary">{preview.seo?.metaTitle || preview.title || "Meta title"}</p>
              <p className="text-sm text-muted-foreground">
                {preview.seo?.metaDescription || preview.excerpt || "Meta description"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">/{preview.slug || "slug-bai-viet"}</p>
            </div>
            <div className="whitespace-pre-wrap rounded-xl border p-4 text-sm leading-7">
              {preview.content || "Nội dung bài viết sẽ hiển thị ở đây."}
            </div>
          </article>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(media) => {
          setValue("thumbnailMediaId", media.id, { shouldDirty: true })
          setThumbnailUrl(media.url)
        }}
        title="Chọn ảnh đại diện bài viết"
      />
    </form>
  )
}
