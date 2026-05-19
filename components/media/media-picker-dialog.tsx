"use client"

import * as React from "react"
import {
  IconCheck,
  IconLink,
  IconLoader2,
  IconPhoto,
  IconRefresh,
  IconSearch,
  IconUpload,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type Media } from "@/lib/api/schemas/media.schema"
import { mediaService } from "@/lib/api/services/media.service"
import { cn } from "@/lib/utils"

type MediaPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: Media) => void
  onSelectUrl?: (url: string) => void
  title?: string
  initialSelectedUrl?: string | null
  initialDraft?: Partial<MediaDraft> | null
  captionOnly?: boolean
  lockDraftOnSelection?: boolean
}

type MediaTab = "upload" | "library" | "url"

type MediaDraft = {
  altText: string
  caption: string
  description: string
  title: string
}

const emptyDraft: MediaDraft = {
  altText: "",
  caption: "",
  description: "",
  title: "",
}

function getReadableSize(size?: number | null) {
  if (!size) return "N/A"
  const kb = size / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  onSelectUrl,
  title = "Thêm media",
  initialSelectedUrl = null,
  initialDraft = null,
  captionOnly = false,
  lockDraftOnSelection = false,
}: MediaPickerDialogProps) {
  const [items, setItems] = React.useState<Media[]>([])
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [tab, setTab] = React.useState<MediaTab>("library")
  const [selectedMediaId, setSelectedMediaId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<MediaDraft>(emptyDraft)
  const [isUploading, setIsUploading] = React.useState(false)
  const [urlInput, setUrlInput] = React.useState("")
  const shouldApplyInitialDraftRef = React.useRef(false)
  const [isDraftDirty, setIsDraftDirty] = React.useState(false)

  const selectedMedia = React.useMemo(
    () => items.find((item) => item.id === selectedMediaId) ?? null,
    [items, selectedMediaId]
  )

  const fetchMedia = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await mediaService.getMediaList({
        page: 1,
        limit: 80,
        search: search || undefined,
      })
      setItems(response.data)
      if (!selectedMediaId && response.data.length) {
        setSelectedMediaId(response.data[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch media", error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [search, selectedMediaId])

  React.useEffect(() => {
    if (!open) return
    fetchMedia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search])

  React.useEffect(() => {
    if (!open) return
    setTab("library")
    shouldApplyInitialDraftRef.current = Boolean(initialDraft)
    setIsDraftDirty(false)
  }, [open])

  React.useEffect(() => {
    if (!open || !initialSelectedUrl || !items.length) return
    const matched = items.find((item) => item.url === initialSelectedUrl || item.secureUrl === initialSelectedUrl)
    if (matched) {
      setSelectedMediaId(matched.id)
    }
  }, [open, initialSelectedUrl, items])

  React.useEffect(() => {
    if (!selectedMedia) {
      setDraft(emptyDraft)
      return
    }
    if (shouldApplyInitialDraftRef.current) {
      setDraft({
        altText: initialDraft?.altText ?? selectedMedia.altText ?? "",
        caption: initialDraft?.caption ?? "",
        description: initialDraft?.description ?? "",
        title: initialDraft?.title ?? selectedMedia.title ?? selectedMedia.filename ?? "",
      })
      shouldApplyInitialDraftRef.current = false
      return
    }
    if (lockDraftOnSelection && (isDraftDirty || captionOnly)) {
      return
    }
    setDraft({
      altText: selectedMedia.altText ?? "",
      caption: "",
      description: "",
      title: selectedMedia.title ?? selectedMedia.filename ?? "",
    })
  }, [captionOnly, initialDraft, isDraftDirty, lockDraftOnSelection, selectedMedia])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      const uploaded = await mediaService.uploadMedia(file)
      setTab("library")
      await fetchMedia()
      setSelectedMediaId(uploaded.id)
    } catch (error) {
      console.error("Failed to upload media", error)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleInsertSelectedMedia = () => {
    if (!selectedMedia) return
    onSelect({
      ...selectedMedia,
      altText: captionOnly ? selectedMedia.altText : draft.altText,
      title: captionOnly ? selectedMedia.title : draft.title,
      caption: draft.caption,
      description: draft.description,
    } as Media)
    onOpenChange(false)
  }

  const handleInsertByUrl = () => {
    const nextUrl = urlInput.trim()
    if (!nextUrl) return
    if (onSelectUrl) {
      onSelectUrl(nextUrl)
      onOpenChange(false)
      setUrlInput("")
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>Giao diện dùng chung cho upload/chọn media trong toàn bộ admin.</DialogDescription>
            </div>
            <div className="inline-flex shrink-0 rounded-lg border border-stone-200 bg-white p-1">
              {[
                { id: "upload" as const, label: "Tải file", icon: IconUpload },
                { id: "library" as const, label: "Thư viện", icon: IconPhoto },
                { id: "url" as const, label: "Chèn URL", icon: IconLink },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition",
                    tab === item.id ? "bg-orange-100 text-orange-700" : "text-stone-600 hover:bg-stone-100"
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {tab === "upload" ? (
          <div className="p-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
              <IconUpload className="size-10 text-stone-400" />
              <h3 className="mt-4 text-xl font-semibold text-stone-900">Thả file hoặc chọn file để tải lên</h3>
              <Label htmlFor="unified-media-upload" className="mt-5">
                <Button type="button" className="rounded-xl" asChild>
                  <span>{isUploading ? "Đang upload..." : "Chọn file"}</span>
                </Button>
              </Label>
              <input
                id="unified-media-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>
        ) : null}

        {tab === "url" ? (
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
              <Label htmlFor="media-url-input">URL hình ảnh</Label>
              <Input
                id="media-url-input"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder="https://..."
              />
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                {urlInput.trim() ? (
                  <img src={urlInput} alt={draft.altText || "Image preview"} className="h-72 w-full object-contain" />
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-stone-500">Chưa có URL ảnh</div>
                )}
              </div>
            </div>
            <aside className="max-h-[62vh] space-y-4 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <Label htmlFor="media-url-alt">Văn bản thay thế</Label>
              <Textarea
                id="media-url-alt"
                value={draft.altText}
                onChange={(event) => {
                  setIsDraftDirty(true)
                  setDraft((prev) => ({ ...prev, altText: event.target.value }))
                }}
                className="min-h-20"
              />
              <Button type="button" className="w-full rounded-xl" disabled={!urlInput.trim()} onClick={handleInsertByUrl}>
                Chèn ảnh bằng URL
              </Button>
            </aside>
          </div>
        ) : null}

        {tab === "library" ? (
          <div className="grid min-h-[62vh] grid-cols-1 lg:grid-cols-2">
            <section className="border-r border-stone-200">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && fetchMedia()}
                    placeholder="Tìm kiếm media..."
                    className="rounded-xl pl-9"
                  />
                </div>
                <Button type="button" variant="outline" className="rounded-xl" onClick={fetchMedia} disabled={isLoading}>
                  {isLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                </Button>
              </div>
              <div className="max-h-[54vh] overflow-auto p-4">
                {isLoading ? (
                  <div className="flex h-56 items-center justify-center text-stone-500">Đang tải media...</div>
                ) : items.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-stone-300 text-stone-500">
                    Chưa có media
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((media) => {
                      const isSelected = selectedMediaId === media.id
                      return (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => setSelectedMediaId(media.id)}
                          className={cn(
                            "relative overflow-hidden rounded-xl border bg-white text-left transition",
                            isSelected ? "border-orange-400 ring-2 ring-orange-100" : "border-stone-200 hover:border-orange-300"
                          )}
                        >
                          <div className="aspect-square bg-stone-100">
                            <img src={media.url} alt={media.altText || media.filename} className="h-full w-full object-cover" />
                          </div>
                          <div className="p-2">
                            <p className="truncate text-xs font-medium text-stone-800">{media.filename}</p>
                          </div>
                          {isSelected ? (
                            <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-orange-600 text-white">
                              <IconCheck className="size-3.5" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            <aside className="flex max-h-[62vh] flex-col overflow-hidden bg-stone-50">
              <div className="border-b px-4 py-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Chi tiết ảnh</h4>
              </div>
              {selectedMedia ? (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-stone-200 bg-white p-3">
                    <div className="h-44 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1">
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.altText || selectedMedia.filename}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 text-sm text-stone-600">
                      <p className="truncate font-medium text-stone-800">{selectedMedia.filename}</p>
                      <p>{getReadableSize(selectedMedia.size)}</p>
                      <p>{selectedMedia.mimeType}</p>
                    </div>
                  </div>
              {!captionOnly ? (
                <div className="space-y-2">
                  <Label htmlFor="media-alt">Văn bản thay thế</Label>
                    <Textarea
                      id="media-alt"
                      value={draft.altText}
                      onChange={(event) => {
                        setIsDraftDirty(true)
                        setDraft((prev) => ({ ...prev, altText: event.target.value }))
                      }}
                      className="min-h-20"
                    />
                  </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="media-caption">Chú thích ảnh (caption)</Label>
                <Textarea
                  id="media-caption"
                  value={draft.caption}
                  onChange={(event) => {
                    setIsDraftDirty(true)
                    setDraft((prev) => ({ ...prev, caption: event.target.value }))
                  }}
                  className="min-h-16"
                />
              </div>
            </div>
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-sm text-stone-500">Chọn một ảnh để xem chi tiết</div>
              )}
              <div className="border-t p-4">
                <Button type="button" className="w-full rounded-xl" disabled={!selectedMedia} onClick={handleInsertSelectedMedia}>
                  Chèn vào nội dung
                </Button>
              </div>
            </aside>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
