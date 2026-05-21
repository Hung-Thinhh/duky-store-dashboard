"use client"

import * as React from "react"
import {
  IconAlertTriangle,
  IconCheck,
  IconLink,
  IconLoader2,
  IconPhoto,
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
import { useMediaPagination } from "@/hooks/use-media-pagination"
import { type Media } from "@/lib/api/schemas/media.schema"
import { mediaService } from "@/lib/api/services/media.service"
import { cn } from "@/lib/utils"
import { SeoMetadataForm, type SeoMetadataPayload } from "./seo-metadata-form"

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
  const {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    search: hookSearch,
    retry,
    fetchNextPage,
  } = useMediaPagination({ batchSize: 20, enabled: open })

  const [searchInput, setSearchInput] = React.useState("")
  const [tab, setTab] = React.useState<MediaTab>("library")
  const [selectedMediaId, setSelectedMediaId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<MediaDraft>(emptyDraft)
  const [isUploading, setIsUploading] = React.useState(false)
  const [urlInput, setUrlInput] = React.useState("")
  const shouldApplyInitialDraftRef = React.useRef(false)
  const [isDraftDirty, setIsDraftDirty] = React.useState(false)
  const prevOpenRef = React.useRef(false)
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // Task 7.2: State for "just uploaded" media to show SEO form
  const [justUploadedMedia, setJustUploadedMedia] = React.useState<Media | null>(null)
  const [uploadedFileExtension, setUploadedFileExtension] = React.useState<string>(".jpg")
  const [isSavingSeo, setIsSavingSeo] = React.useState(false)
  const [seoError, setSeoError] = React.useState<string | null>(null)

  // Task 7.4: State for editing SEO in detail panel
  const [isUpdatingDetail, setIsUpdatingDetail] = React.useState(false)
  const [detailSeoError, setDetailSeoError] = React.useState<string | null>(null)
  const [detailAltText, setDetailAltText] = React.useState("")
  const [detailTitle, setDetailTitle] = React.useState("")
  const [detailFileName, setDetailFileName] = React.useState("")

  // Wrap hookSearch to also reset selection state
  const handleSearch = React.useCallback(
    (query: string) => {
      setSelectedMediaId(null)
      hookSearch(query)
    },
    [hookSearch]
  )

  const selectedMedia = React.useMemo(
    () => items.find((item) => item.id === selectedMediaId) ?? null,
    [items, selectedMediaId]
  )

  // Reset and fetch when dialog opens (open transitions from false → true)
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSearchInput("")
      setSelectedMediaId(null)
      setJustUploadedMedia(null)
      setSeoError(null)
      setDetailSeoError(null)
      // search("") resets internal state AND fetches page 1
      hookSearch("")
    }
    prevOpenRef.current = open
  }, [open, hookSearch])

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
      setDetailAltText("")
      setDetailTitle("")
      setDetailFileName("")
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
      setDetailAltText(selectedMedia.altText ?? "")
      setDetailTitle(selectedMedia.title ?? "")
      setDetailFileName(selectedMedia.fileName ?? selectedMedia.filename ?? "")
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
    // Task 7.4: Populate detail panel edit fields
    setDetailAltText(selectedMedia.altText ?? "")
    setDetailTitle(selectedMedia.title ?? "")
    setDetailFileName(selectedMedia.fileName ?? selectedMedia.filename ?? "")
    setDetailSeoError(null)
  }, [captionOnly, initialDraft, isDraftDirty, lockDraftOnSelection, selectedMedia])

  // Orphaned selection check: reset if selectedMediaId is not in items
  React.useEffect(() => {
    if (!selectedMediaId || items.length === 0 || isLoading) return
    const exists = items.some((item) => item.id === selectedMediaId)
    if (!exists) {
      setSelectedMediaId(null)
    }
  }, [selectedMediaId, items, isLoading])

  // IntersectionObserver for infinite scroll sentinel
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    if (!hasMore || isLoadingMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoadingMore, isLoading, fetchNextPage])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      const uploaded = await mediaService.uploadMedia(file)

      // Get extension from the actual stored file (backend may have converted to webp)
      const storedUrl = uploaded.url || ""
      const storedExt = storedUrl.includes(".") ? `.${storedUrl.split(".").pop()?.toLowerCase() || "webp"}` : ".webp"
      setUploadedFileExtension(storedExt)
      setJustUploadedMedia(uploaded)
      setSeoError(null)
    } catch (error) {
      console.error("Failed to upload media", error)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  // Task 7.2: Handle SEO form save after upload
  const handleSeoSave = async (data: SeoMetadataPayload) => {
    if (!justUploadedMedia) return
    try {
      setIsSavingSeo(true)
      setSeoError(null)
      const updated = await mediaService.updateMedia(justUploadedMedia.id, {
        altText: data.altText,
        title: data.title || undefined,
        fileName: data.fileName || undefined,
      })
      // Transition back to library with the media selected
      setJustUploadedMedia(null)
      setTab("library")
      hookSearch("")
      setSelectedMediaId(updated.id)
    } catch (err: any) {
      const message = err?.EM || err?.message || "Lưu thông tin SEO thất bại. Vui lòng thử lại."
      setSeoError(message)
    } finally {
      setIsSavingSeo(false)
    }
  }

  const handleSkipSeo = () => {
    if (!justUploadedMedia) return
    setJustUploadedMedia(null)
    setTab("library")
    hookSearch("")
    setSelectedMediaId(justUploadedMedia.id)
  }

  // Task 7.4: Handle detail panel SEO update
  const handleDetailUpdate = async () => {
    if (!selectedMedia) return
    try {
      setIsUpdatingDetail(true)
      setDetailSeoError(null)
      const updated = await mediaService.updateMedia(selectedMedia.id, {
        altText: detailAltText.trim() || undefined,
        title: detailTitle.trim() || undefined,
        fileName: detailFileName.trim() || undefined,
      })
      // Update the item in the list without reload
      // The hook items are read-only, so we update selectedMedia via re-fetch
      hookSearch(searchQuery || "")
      setSelectedMediaId(updated.id)
    } catch (err: any) {
      const message = err?.EM || err?.message || "Cập nhật thất bại. Vui lòng thử lại."
      setDetailSeoError(message)
    } finally {
      setIsUpdatingDetail(false)
    }
  }

  // Validation error for insert
  const [insertError, setInsertError] = React.useState<string | null>(null)
  const [insertValidationFields, setInsertValidationFields] = React.useState<{ altText?: boolean; caption?: boolean }>({})

  const handleInsertSelectedMedia = () => {
    if (!selectedMedia) return

    const missing: { altText?: boolean; caption?: boolean } = {}
    const altText = detailAltText.trim() || selectedMedia.altText
    if (!altText) missing.altText = true
    if (!draft.caption.trim()) missing.caption = true

    if (missing.altText || missing.caption) {
      setInsertValidationFields(missing)
      setInsertError("Vui lòng nhập đủ thông tin trước khi chèn.")
      return
    }

    setInsertError(null)
    setInsertValidationFields({})
    onSelect({
      ...selectedMedia,
      altText: detailAltText.trim() || selectedMedia.altText,
      title: detailTitle.trim() || selectedMedia.title,
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
      <DialogContent className="max-h-[90vh] md:min-h-[85vh] md:max-h-[95vh] max-w-7xl overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>Upload/chọn media cho nội dung.</DialogDescription>
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
            {justUploadedMedia ? (
              <div className="grid grid-cols-1 gap-6 px-6 lg:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    <img
                      src={justUploadedMedia.url}
                      alt={justUploadedMedia.altText || justUploadedMedia.filename}
                      className="h-full max-h-[60vh] w-full object-contain p-2"
                    />
                  </div>
                  <div className="mt-3 w-full space-y-1 rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-500">Tên gốc:</span>
                      <span className="truncate text-stone-800">{justUploadedMedia.originalName || justUploadedMedia.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-500">Kích thước:</span>
                      <span className="text-stone-800">{getReadableSize(justUploadedMedia.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-500">Định dạng:</span>
                      <span className="text-stone-800">{justUploadedMedia.mimeType}</span>
                    </div>
                    {justUploadedMedia.width && justUploadedMedia.height ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-500">Kích cỡ:</span>
                        <span className="text-stone-800">{justUploadedMedia.width} × {justUploadedMedia.height}px</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-4 overflow-y-auto px-4">
                  <h3 className="text-lg font-semibold text-stone-900">Thông tin SEO cho ảnh</h3>
                  <p className="text-sm text-stone-500">Thêm mô tả và tiêu đề giúp ảnh được tìm thấy tốt hơn trên Google.</p>
                  <SeoMetadataForm
                    originalExtension={uploadedFileExtension}
                    onSave={handleSeoSave}
                    isSaving={isSavingSeo}
                    error={seoError}
                  />
                  <button
                    type="button"
                    onClick={handleSkipSeo}
                    className="w-full text-center text-sm text-stone-500 hover:text-stone-700 underline mt-4"
                  >
                    Bỏ qua, thêm sau
                  </button>
                </div>
              </div>
            ) : (
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
            )}
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
            <aside className="min-h-[70vh] max-h-[80vh] space-y-4 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-4">
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
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearch(searchInput.trim())
                      }
                    }}
                    placeholder="Tìm kiếm media..."
                    className="rounded-xl pl-9"
                  />
                </div>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleSearch(searchInput.trim())} disabled={isLoading}>
                  {isLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                </Button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 text-stone-500">
                    <IconLoader2 className="size-8 animate-spin text-orange-500" />
                    <span className="text-sm">Đang tải media...</span>
                  </div>
                ) : error && items.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 text-stone-500">
                    <p className="text-sm text-red-600">Không thể tải media. Vui lòng thử lại.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => retry()}
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-stone-300 text-stone-500">
                    {searchQuery ? "Không tìm thấy media phù hợp" : "Chưa có media"}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map((media) => {
                        const isSelected = selectedMediaId === media.id
                        const missingAltText = !media.altText
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
                            {/* Task 7.3: SEO warning indicator for missing altText */}
                            {missingAltText ? (
                              <span
                                className="absolute left-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-600"
                                title="Chưa có alt text"
                              >
                                <IconAlertTriangle className="size-3.5" />
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                    {/* Loading indicator when fetching more pages */}
                    {isLoadingMore ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-stone-500">
                        <IconLoader2 className="size-5 animate-spin text-orange-500" />
                        <span className="text-sm">Đang tải thêm...</span>
                      </div>
                    ) : null}
                    {/* Error state with retry button when loading more fails */}
                    {error && items.length > 0 ? (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <span className="text-sm text-red-600">Tải thêm thất bại.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50"
                          onClick={() => retry()}
                        >
                          Thử lại
                        </Button>
                      </div>
                    ) : null}
                    {/* Sentinel element for IntersectionObserver infinite scroll */}
                    <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
                  </>
                )}
              </div>
            </section>

            <aside className="flex min-h-[70vh] max-h-[80vh] flex-col overflow-hidden bg-stone-50">
              <div className="border-b px-4 py-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Chi tiết ảnh</h4>
              </div>
              {selectedMedia ? (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                    <div className="h-48 w-full bg-stone-100 p-2">
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.altText || selectedMedia.filename}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-medium text-stone-500">Tên file:</span>
                      <span className="break-all text-stone-800">{selectedMedia.filename}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-medium text-stone-500">Kích thước:</span>
                      <span className="text-stone-800">{getReadableSize(selectedMedia.size)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-medium text-stone-500">Định dạng:</span>
                      <span className="text-stone-800">{selectedMedia.mimeType}</span>
                    </div>
                    {selectedMedia.width && selectedMedia.height ? (
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 font-medium text-stone-500">Kích cỡ:</span>
                        <span className="text-stone-800">{selectedMedia.width} × {selectedMedia.height}px</span>
                      </div>
                    ) : null}
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-medium text-stone-500">URL:</span>
                      <span className="break-all text-xs text-stone-600">{selectedMedia.url}</span>
                    </div>
                  </div>

                  {/* Task 7.4: Editable SEO fields in detail panel */}
                  <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Thông tin SEO</h5>
                    {!selectedMedia.altText ? (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <IconAlertTriangle className="size-3.5 shrink-0" />
                        <span>Ảnh chưa có alt text. Thêm mô tả để cải thiện SEO.</span>
                      </div>
                    ) : null}
                    <div className="space-y-1.5">
                      <Label htmlFor="detail-alt-text" className="text-xs">Alt text</Label>
                      <Textarea
                        id="detail-alt-text"
                        value={detailAltText}
                        onChange={(e) => {
                          setDetailAltText(e.target.value)
                          if (e.target.value.trim()) {
                            setInsertValidationFields((prev) => ({ ...prev, altText: false }))
                            if (!insertValidationFields.caption) setInsertError(null)
                          }
                        }}
                        placeholder="Mô tả nội dung ảnh..."
                        className={cn("min-h-14 text-xs", insertValidationFields.altText && "border-red-400 ring-1 ring-red-100")}
                        maxLength={125}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="detail-title" className="text-xs">Tiêu đề</Label>
                      <Input
                        id="detail-title"
                        value={detailTitle}
                        onChange={(e) => setDetailTitle(e.target.value)}
                        placeholder="Tiêu đề SEO"
                        maxLength={200}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="detail-filename" className="text-xs">Tên file</Label>
                      <Input
                        id="detail-filename"
                        value={detailFileName}
                        onChange={(e) => setDetailFileName(e.target.value)}
                        placeholder="ten-file-seo.jpg"
                        className="text-xs"
                      />
                    </div>
                    {detailSeoError ? (
                      <p className="text-xs text-red-500">{detailSeoError}</p>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-xs"
                      disabled={isUpdatingDetail}
                      onClick={handleDetailUpdate}
                    >
                      {isUpdatingDetail ? (
                        <>
                          <IconLoader2 className="mr-1.5 size-3 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        "Cập nhật"
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="media-caption">Chú thích ảnh (caption)</Label>
                    <Textarea
                      id="media-caption"
                      value={draft.caption}
                      onChange={(event) => {
                        setIsDraftDirty(true)
                        setDraft((prev) => ({ ...prev, caption: event.target.value }))
                        if (event.target.value.trim()) {
                          setInsertValidationFields((prev) => ({ ...prev, caption: false }))
                          if (!insertValidationFields.altText) setInsertError(null)
                        }
                      }}
                      placeholder="Nhập chú thích cho ảnh..."
                      className={cn("min-h-16", insertValidationFields.caption && "border-red-400 ring-1 ring-red-100")}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-sm text-stone-500">Chọn một ảnh để xem chi tiết</div>
              )}
              <div className="border-t p-4">
                {insertError ? (
                  <p className="mb-2 text-center text-xs text-red-500">{insertError}</p>
                ) : null}
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
