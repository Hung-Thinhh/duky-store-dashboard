"use client"

import * as React from "react"
import { IconCopy, IconFile, IconSearch, IconTrash, IconUpload } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { InlineFeedback } from "@/components/ui/inline-feedback"
import { Input } from "@/components/ui/input"
import { Media } from "@/lib/api/schemas/media.schema"
import { mediaService } from "@/lib/api/services/media.service"

export default function MediaPage() {
  const [mediaList, setMediaList] = React.useState<Media[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Media | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ message: string; tone: "success" | "error" | "info" } | null>(null)

  const fetchMedia = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await mediaService.getMediaList()
      setMediaList(data.data)
    } catch (error) {
      console.error("Failed to fetch media", error)
      setMediaList([])
      setFeedback({ message: "Không tải được thư viện media.", tone: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return

    try {
      setIsUploading(true)
      setFeedback(null)
      const files = Array.from(event.target.files)
      await mediaService.uploadMultipleMedia(files)
      await fetchMedia()
      setFeedback({ message: `Đã tải lên ${files.length} file.`, tone: "success" })
    } catch (error) {
      console.error("Failed to upload media", error)
      setFeedback({ message: "Tải file thất bại. Vui lòng kiểm tra định dạng ảnh và thử lại.", tone: "error" })
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setFeedback({ message: "Đã copy URL media.", tone: "success" })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsDeleting(true)
      setFeedback(null)
      await mediaService.deleteMedia(deleteTarget.id)
      await fetchMedia()
      setFeedback({ message: "Đã xóa media.", tone: "success" })
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to delete media", error)
      setFeedback({ message: "Xóa media thất bại.", tone: "error" })
    } finally {
      setIsDeleting(false)
    }
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const filteredMedia = mediaList.filter((media) =>
    media.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thư viện Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý hình ảnh và tệp tin.</p>
        </div>
        <Button asChild className="cursor-pointer rounded-xl" disabled={isUploading}>
          <label>
            <IconUpload className="mr-2 size-4" />
            {isUploading ? "Đang tải..." : "Tải lên"}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên file..."
            className="w-full rounded-xl pl-9 md:w-[350px]"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <InlineFeedback message={feedback?.message ?? null} tone={feedback?.tone} />

      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
      ) : filteredMedia.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Không tìm thấy tệp tin nào.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {filteredMedia.map((media) => (
            <Card key={media.id} className="group relative overflow-hidden rounded-xl border border-muted transition-all hover:border-primary/20 hover:shadow-md">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
                {media.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt={media.filename} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <IconFile className="size-12 text-muted-foreground" />
                )}

                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="secondary" className="size-8 rounded-full" onClick={() => copyToClipboard(media.url)} title="Copy URL">
                    <IconCopy className="size-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="size-8 rounded-full" title="Xóa" onClick={() => setDeleteTarget(media)}>
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2 text-xs">
                <p className="truncate font-medium" title={media.filename}>{media.filename}</p>
                <p className="mt-0.5 flex justify-between text-muted-foreground">
                  <span>{formatBytes(media.size ?? 0)}</span>
                  <span>{media.width && media.height ? `${media.width}x${media.height}` : ""}</span>
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa media?"
        description={deleteTarget ? `File "${deleteTarget.filename}" sẽ bị xóa khỏi thư viện.` : undefined}
        confirmLabel="Xóa"
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
