"use client"

import * as React from "react"
import { IconLoader2, IconPhoto, IconRefresh, IconSearch } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { mediaService } from "@/lib/api/services/media.service"
import { Media } from "@/lib/api/schemas/media.schema"

type MediaPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: Media) => void
  title?: string
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Chọn media",
}: MediaPickerDialogProps) {
  const [items, setItems] = React.useState<Media[]>([])
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchMedia = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await mediaService.getMediaList({
        page: 1,
        limit: 60,
        search: search || undefined,
      })
      setItems(response.data)
    } catch (error) {
      console.error("Failed to fetch media", error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    if (!open) return
    fetchMedia()
  }, [fetchMedia, open])

  const handleSelect = (media: Media) => {
    onSelect(media)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Dùng chung cho sản phẩm, bài viết, trang chủ và phần cấu hình hình ảnh.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b px-6 py-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") fetchMedia()
              }}
              placeholder="Tìm theo tên ảnh..."
              className="rounded-xl pl-9"
            />
          </div>
          <Button type="button" variant="outline" onClick={fetchMedia} disabled={isLoading} className="rounded-xl">
            {isLoading ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconRefresh className="mr-2 size-4" />}
            Tải lại
          </Button>
        </div>

        <div className="max-h-[58vh] overflow-auto p-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <IconLoader2 className="mr-2 size-5 animate-spin" />
              Đang tải media...
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground">
              <IconPhoto className="size-8" />
              Chưa có media phù hợp.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((media) => (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => handleSelect(media)}
                  className="group overflow-hidden rounded-xl border bg-card text-left transition hover:border-primary hover:shadow-sm"
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={media.url}
                      alt={media.altText || media.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{media.filename}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{media.mimeType}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
