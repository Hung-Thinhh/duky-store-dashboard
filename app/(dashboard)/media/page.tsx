"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconFile,
  IconMaximize,
  IconPencil,
  IconSearch,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { MediaUploadDialog } from "@/components/media/media-upload-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InlineFeedback } from "@/components/ui/inline-feedback"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Media } from "@/lib/api/schemas/media.schema"
import { mediaService } from "@/lib/api/services/media.service"

const MEDIA_PAGE_SIZE = 20

export default function MediaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const searchFromUrl = searchParams.get("search") ?? ""

  const [mediaList, setMediaList] = React.useState<Media[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState(searchFromUrl)
  const [searchQuery, setSearchQuery] = React.useState(searchFromUrl)
  const [currentPage, setCurrentPage] = React.useState(pageFromUrl)
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: MEDIA_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Media | null>(null)
  const [editTarget, setEditTarget] = React.useState<Media | null>(null)
  const [editDraft, setEditDraft] = React.useState({
    altText: "",
    title: "",
  })
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)
  const [isMultiSelectMode, setIsMultiSelectMode] = React.useState(false)
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<string[]>([])
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isUpdatingMedia, setIsUpdatingMedia] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)
  const [feedback, setFeedback] = React.useState<{
    message: string
    tone: "success" | "error" | "info"
  } | null>(null)

  const fetchMedia = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await mediaService.getMediaList({
        page: currentPage,
        limit: MEDIA_PAGE_SIZE,
        search: searchQuery || undefined,
      })
      setMediaList(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch media", error)
      setMediaList([])
      setFeedback({ message: "Không tải được thư viện media.", tone: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery])

  React.useEffect(() => {
    void Promise.resolve().then(fetchMedia)
  }, [fetchMedia])

  React.useEffect(() => {
    setCurrentPage(pageFromUrl)
    setSearchInput(searchFromUrl)
    setSearchQuery(searchFromUrl)
    setSelectedMediaIds([])
    setIsMultiSelectMode(false)
  }, [pageFromUrl, searchFromUrl])

  React.useEffect(() => {
    if (!feedback) return

    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 3200)

    return () => window.clearTimeout(timeout)
  }, [feedback])

  const handleUploaded = async () => {
    await fetchMedia()
    setFeedback({
      message: "Đã lưu ảnh cùng metadata vào thư viện.",
      tone: "success",
    })
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setFeedback({ message: "Đã copy URL media.", tone: "success" })
  }

  const openEditDialog = (media: Media) => {
    setEditTarget(media)
    setEditDraft({
      altText: media.altText ?? "",
      title: media.title ?? "",
    })
  }

  const handleUpdateMedia = async () => {
    if (!editTarget) return

    try {
      setIsUpdatingMedia(true)
      setFeedback(null)
      await mediaService.updateMedia(editTarget.id, {
        altText: editDraft.altText.trim() || undefined,
        title: editDraft.title.trim() || undefined,
      })
      await fetchMedia()
      setFeedback({ message: "Đã cập nhật metadata ảnh.", tone: "success" })
      setEditTarget(null)
    } catch (error) {
      console.error("Failed to update media metadata", error)
      setFeedback({ message: "Cập nhật metadata ảnh thất bại.", tone: "error" })
    } finally {
      setIsUpdatingMedia(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsDeleting(true)
      setFeedback(null)
      await mediaService.deleteMedia(deleteTarget.id)
      await fetchMedia()
      setFeedback({ message: "Đã xóa media.", tone: "success" })
      setSelectedMediaIds((current) =>
        current.filter((id) => id !== deleteTarget.id)
      )
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to delete media", error)
      setFeedback({ message: "Xóa media thất bại.", tone: "error" })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSelectMedia = (mediaId: string, checked: boolean) => {
    setSelectedMediaIds((current) =>
      checked
        ? Array.from(new Set([...current, mediaId]))
        : current.filter((id) => id !== mediaId)
    )
  }

  const toggleSelectCurrentPage = (checked: boolean) => {
    const currentPageIds = mediaList.map((media) => media.id)

    setSelectedMediaIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...currentPageIds]))
      }

      return current.filter((id) => !currentPageIds.includes(id))
    })
  }

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode((current) => {
      const next = !current
      if (!next) {
        setSelectedMediaIds([])
      }
      return next
    })
  }

  const updateMediaUrl = React.useCallback(
    (page: number, search = searchQuery) => {
      const nextPage = Math.max(1, page)
      const nextSearch = search.trim()
      const params = new URLSearchParams(searchParams.toString())

      if (nextPage > 1) {
        params.set("page", String(nextPage))
      } else {
        params.delete("page")
      }

      if (nextSearch) {
        params.set("search", nextSearch)
      } else {
        params.delete("search")
      }

      const queryString = params.toString()
      router.push(queryString ? `/media?${queryString}` : "/media")
      setCurrentPage(nextPage)
      setSearchQuery(nextSearch)
      setSelectedMediaIds([])
      setIsMultiSelectMode(false)
    },
    [router, searchParams, searchQuery]
  )

  const handleSearchSubmit = () => {
    updateMediaUrl(1, searchInput)
  }

  const handleBulkDelete = async () => {
    if (!selectedMediaIds.length) return

    const idsToDelete = selectedMediaIds

    try {
      setIsDeleting(true)
      setFeedback(null)
      await Promise.all(idsToDelete.map((id) => mediaService.deleteMedia(id)))
      await fetchMedia()
      setFeedback({
        message: `Đã xóa ${idsToDelete.length} media.`,
        tone: "success",
      })
      setSelectedMediaIds([])
      setIsMultiSelectMode(false)
      setIsBulkDeleteOpen(false)
    } catch (error) {
      console.error("Failed to delete selected media", error)
      setFeedback({ message: "Xóa media đã chọn thất bại.", tone: "error" })
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

  const canGoPrevious = pagination.page > 1
  const canGoNext = pagination.page < pagination.totalPages
  const selectedCount = selectedMediaIds.length
  const currentPageIds = mediaList.map((media) => media.id)
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedMediaIds.includes(id))

  // ── Rubber-band drag-to-select ──
  const getPageNumbers = () => {
    const pages: Array<number | "..."> = []
    const total = pagination.totalPages
    const current = pagination.page

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", total)
    } else if (current >= total - 3) {
      pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total)
    }

    return pages
  }

  const gridRef = React.useRef<HTMLDivElement>(null)
  const cardRefsMap = React.useRef<Map<string, HTMLElement>>(new Map())
  const isDraggingRef = React.useRef(false)
  const dragStartRef = React.useRef({ x: 0, y: 0 })
  const [dragRect, setDragRect] = React.useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const start = dragStartRef.current
      const x = Math.min(start.x, e.clientX)
      const y = Math.min(start.y, e.clientY)
      const w = Math.abs(e.clientX - start.x)
      const h = Math.abs(e.clientY - start.y)
      setDragRect({ x, y, w, h })

      // Auto-select cards that intersect the rectangle
      const selRect = { left: x, right: x + w, top: y, bottom: y + h }
      const hitIds: string[] = []
      cardRefsMap.current.forEach((el, id) => {
        const r = el.getBoundingClientRect()
        if (
          r.left < selRect.right &&
          r.right > selRect.left &&
          r.top < selRect.bottom &&
          r.bottom > selRect.top
        ) {
          hitIds.push(id)
        }
      })
      setSelectedMediaIds(hitIds)
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setDragRect(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (!isMultiSelectMode) return
    // Only start drag from grid background, not from cards/buttons
    const target = e.target as HTMLElement
    if (
      target.closest("[data-media-card]") ||
      target.closest("button") ||
      target.closest("label")
    )
      return
    e.preventDefault()
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    setDragRect(null)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thư viện Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý hình ảnh và tệp tin.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-xl"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <IconUpload className="mr-2 size-4" />
          Tải lên
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên file..."
              className="w-full rounded-xl pl-9 md:w-[350px]"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 rounded-2xl bg-primary text-white hover:bg-primary/90"
            disabled={isLoading}
            title="Tìm kiếm"
            onClick={handleSearchSubmit}
          >
            <IconSearch className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button
            type="button"
            variant={isMultiSelectMode ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            disabled={isDeleting}
            onClick={toggleMultiSelectMode}
          >
            {isMultiSelectMode ? "Thoát chọn nhiều" : "Chọn nhiều"}
          </Button>
          <label className="hidden">
            <Checkbox
              checked={isAllCurrentPageSelected}
              onCheckedChange={(checked) =>
                toggleSelectCurrentPage(checked === true)
              }
              aria-label="Chọn tất cả ảnh trang này"
            />
            Chọn trang này
          </label>
          {isMultiSelectMode && selectedCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-stone-700">
                Đã chọn {selectedCount} ảnh
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={isDeleting}
                onClick={() => setSelectedMediaIds([])}
              >
                Bỏ chọn
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-xl"
                disabled={isDeleting}
                onClick={() => setIsBulkDeleteOpen(true)}
              >
                <IconTrash className="mr-1 size-4" />
                Xóa đã chọn
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <InlineFeedback
        message={feedback?.message ?? null}
        tone={feedback?.tone}
      />

      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : mediaList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          Không tìm thấy tệp tin nào.
        </div>
      ) : (
        <>
          <div
            ref={gridRef}
            className="relative grid grid-cols-2 gap-4 select-none md:grid-cols-4 lg:grid-cols-5"
            onMouseDown={handleGridMouseDown}
          >
            {/* Rubber-band selection rectangle */}
            {dragRect && (
              <div
                className="pointer-events-none fixed z-50 rounded border-2 border-orange-400 bg-orange-200/30"
                style={{
                  left: dragRect.x,
                  top: dragRect.y,
                  width: dragRect.w,
                  height: dragRect.h,
                }}
              />
            )}
            {mediaList.map((media) => {
              const isSelected = selectedMediaIds.includes(media.id)

              const mediaIndex = mediaList.indexOf(media)

              return (
                <Card
                  key={media.id}
                  ref={(el: HTMLDivElement | null) => {
                    if (el) cardRefsMap.current.set(media.id, el)
                    else cardRefsMap.current.delete(media.id)
                  }}
                  data-media-card
                  className={`group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-xl border bg-muted transition-all hover:shadow-lg ${isSelected ? "border-orange-500 ring-2 ring-orange-100" : "border-muted hover:border-stone-300"}`}
                  onClick={(event) => {
                    if (
                      (event.target as HTMLElement).closest(
                        "[data-media-card-action]"
                      )
                    ) {
                      return
                    }

                    if (isMultiSelectMode) {
                      toggleSelectMedia(media.id, !isSelected)
                      return
                    }

                    if (media.mimeType.startsWith("image/")) {
                      setLightboxIndex(mediaIndex)
                    }
                  }}
                >
                  {isMultiSelectMode ? (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/10">
                      <div
                        className={`grid size-8 place-items-center rounded-full shadow-lg ring-2 ring-white transition ${isSelected ? "bg-orange-500/90 text-white" : "bg-white/95 text-stone-500"}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleSelectMedia(media.id, checked === true)
                          }
                          aria-label={`Chọn ${media.filename}`}
                        />
                      </div>
                    </div>
                  ) : null}
                  {!isMultiSelectMode ? (
                    <div
                      data-media-card-action
                      className="absolute top-3 right-3 z-30 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-9 rounded-full bg-white text-stone-700 shadow-lg ring-2 ring-white hover:bg-white"
                        title="Chỉnh metadata"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(media)
                        }}
                      >
                        <IconPencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-9 rounded-full bg-white text-stone-700 shadow-lg ring-2 ring-white hover:bg-white"
                        title="Copy URL"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(media.url)
                        }}
                      >
                        <IconCopy className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="size-9 rounded-full bg-red-500 text-white shadow-lg ring-2 ring-white hover:bg-red-600"
                        title="Xóa"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(media)
                        }}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                  <div
                    className={`pointer-events-none absolute inset-0 z-[5] rounded-xl transition-colors duration-200 ${isMultiSelectMode ? "bg-black/0" : "bg-black/0 group-hover:bg-black/10"}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-muted">
                    {media.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.url}
                        alt={media.altText || media.filename}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <IconFile className="size-12 text-muted-foreground" />
                    )}

                    {!isMultiSelectMode ? (
                      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="secondary"
                          data-media-card-action
                          className="pointer-events-auto size-8 rounded-full"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setLightboxIndex(mediaIndex)
                          }}
                          title="Phóng to"
                        >
                          <IconMaximize className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/45 to-transparent p-3 pt-10 text-xs text-white">
                    <p
                      className="truncate font-semibold drop-shadow"
                      title={media.filename}
                    >
                      {media.filename}
                    </p>
                    <p className="mt-1 flex justify-between text-white/85">
                      <span>{formatBytes(media.size ?? 0)}</span>
                      <span>
                        {media.width && media.height
                          ? `${media.width}x${media.height}`
                          : ""}
                      </span>
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              Trang {pagination.page}/{Math.max(pagination.totalPages, 1)} -{" "}
              {pagination.total} media, {MEDIA_PAGE_SIZE} ảnh/trang
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={!canGoPrevious || isLoading}
                onClick={() => updateMediaUrl(pagination.page - 1)}
              >
                <IconChevronLeft className="mr-1 size-4" />
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) =>
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
                      disabled={isLoading}
                      onClick={() => updateMediaUrl(page)}
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
                className="rounded-xl"
                disabled={!canGoNext || isLoading}
                onClick={() => updateMediaUrl(pagination.page + 1)}
              >
                Sau
                <IconChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Gallery Lightbox ── */}
      {lightboxIndex !== null &&
        mediaList[lightboxIndex] &&
        (() => {
          const current = mediaList[lightboxIndex]
          const hasPrev = lightboxIndex > 0
          const hasNext = lightboxIndex < mediaList.length - 1
          return (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setLightboxIndex(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setLightboxIndex(null)
                if (e.key === "ArrowLeft" && hasPrev)
                  setLightboxIndex(lightboxIndex - 1)
                if (e.key === "ArrowRight" && hasNext)
                  setLightboxIndex(lightboxIndex + 1)
              }}
              tabIndex={0}
              ref={(el) => el?.focus()}
            >
              {/* Close button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 z-10 size-10 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setLightboxIndex(null)}
              >
                <IconX className="size-5" />
              </Button>

              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-10 rounded-full bg-white/10 text-white/85 shadow-lg hover:bg-white/20 hover:text-white"
                  title="Chỉnh metadata"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditDialog(current)
                  }}
                >
                  <IconPencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="size-10 rounded-full bg-red-500/80 text-white shadow-lg hover:bg-red-600"
                  title="Xóa ảnh này"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(current)
                    setLightboxIndex(null)
                  }}
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>

              {/* Copy URL button */}
              <div className="absolute top-4 left-28 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-10 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                  title="Copy URL"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(current.url)
                  }}
                >
                  <IconCopy className="size-4" />
                </Button>
              </div>

              {/* Previous arrow */}
              {hasPrev && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1/2 left-4 z-10 size-12 -translate-y-1/2 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(lightboxIndex - 1)
                  }}
                >
                  <IconChevronLeft className="size-7" />
                </Button>
              )}

              {/* Next arrow */}
              {hasNext && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1/2 right-4 z-10 size-12 -translate-y-1/2 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(lightboxIndex + 1)
                  }}
                >
                  <IconChevronRight className="size-7" />
                </Button>
              )}

              {/* Full-size image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.altText || current.filename}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Bottom info bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm text-white/90 backdrop-blur-sm">
                <span className="font-medium">{current.filename}</span>
                <span className="mx-2 text-white/40">·</span>
                <span>{formatBytes(current.size ?? 0)}</span>
                {current.width && current.height ? (
                  <>
                    <span className="mx-2 text-white/40">·</span>
                    <span>
                      {current.width}×{current.height}
                    </span>
                  </>
                ) : null}
                <span className="mx-2 text-white/40">·</span>
                <span>
                  {lightboxIndex + 1}/{mediaList.length}
                </span>
              </div>
            </div>
          )
        })()}

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open && !isUpdatingMedia) setEditTarget(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chỉnh thông tin ảnh</DialogTitle>
            <DialogDescription>
              Cập nhật alt text, tiêu đề và tên file SEO cho ảnh trong thư viện.
            </DialogDescription>
          </DialogHeader>

          {editTarget ? (
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-xl border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editTarget.url}
                  alt={editDraft.altText || editTarget.filename}
                  className="max-h-56 w-full object-contain"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="media-edit-alt">Alt text</Label>
                <Textarea
                  id="media-edit-alt"
                  value={editDraft.altText}
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      altText: event.target.value,
                    }))
                  }
                  placeholder="Mô tả nội dung ảnh"
                  maxLength={125}
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {editDraft.altText.length}/125
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="media-edit-title">Tiêu đề</Label>
                <Input
                  id="media-edit-title"
                  value={editDraft.title}
                  onChange={(event) =>
                    setEditDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Tiêu đề SEO cho ảnh"
                  maxLength={200}
                />
              </div>

              <div className="grid gap-2">
                <Label>Tên file đã lưu</Label>
                <div className="rounded-xl border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  <p
                    className="truncate"
                    title={editTarget.fileName ?? editTarget.filename}
                  >
                    {editTarget.fileName ?? editTarget.filename}
                  </p>
                  <p className="mt-1 text-xs">
                    Tên file/URL trên R2 được cố định sau khi upload. Muốn đổi
                    tên SEO thật, hãy tải lại ảnh với tên mới.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isUpdatingMedia}
              onClick={() => setEditTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={isUpdatingMedia}
              onClick={handleUpdateMedia}
            >
              {isUpdatingMedia ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa media?"
        description={
          deleteTarget
            ? `File "${deleteTarget.filename}" sẽ bị xóa khỏi thư viện.`
            : undefined
        }
        confirmLabel="Xóa"
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={isBulkDeleteOpen}
        title={`Xóa ${selectedCount} media?`}
        description="Những ảnh đã chọn sẽ bị xóa khỏi thư viện media."
        confirmLabel={`Xóa ${selectedCount} ảnh`}
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => !open && setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />
      <MediaUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
