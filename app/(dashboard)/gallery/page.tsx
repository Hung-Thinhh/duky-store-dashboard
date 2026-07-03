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
import { GalleryUploadDialog } from "@/components/gallery/gallery-upload-dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GalleryImage } from "@/lib/api/schemas/gallery.schema"
import { galleryService } from "@/lib/api/services/gallery.service"

const GALLERY_PAGE_SIZE = 20

function GalleryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const searchFromUrl = searchParams.get("search") ?? ""
  const forMaleFromUrl = searchParams.get("forMale") ?? "all" // "all", "true", "false"

  const [galleryList, setGalleryList] = React.useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState(searchFromUrl)
  const [searchQuery, setSearchQuery] = React.useState(searchFromUrl)
  const [forMaleFilter, setForMaleFilter] = React.useState(forMaleFromUrl)
  const [currentPage, setCurrentPage] = React.useState(pageFromUrl)
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: GALLERY_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryImage | null>(null)
  const [editTarget, setEditTarget] = React.useState<GalleryImage | null>(null)
  const [editDraft, setEditDraft] = React.useState<{
    altText: string
    title: string
    forMale: boolean | undefined
  }>({
    altText: "",
    title: "",
    forMale: undefined,
  })
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)
  const [isMultiSelectMode, setIsMultiSelectMode] = React.useState(false)
  const [selectedGalleryIds, setSelectedGalleryIds] = React.useState<string[]>([])
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isUpdatingGallery, setIsUpdatingGallery] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)
  const [feedback, setFeedback] = React.useState<{
    message: string
    tone: "success" | "error" | "info"
  } | null>(null)

  const fetchGallery = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const params: Record<string, string | number | boolean | undefined> = {
        page: currentPage,
        limit: GALLERY_PAGE_SIZE,
        search: searchQuery || undefined,
      }

      if (forMaleFilter === "true") {
        params.forMale = true
      } else if (forMaleFilter === "false") {
        params.forMale = false
      }

      const data = await galleryService.getGalleryList(params)
      setGalleryList(data.data)
      setPagination(data.pagination!)
    } catch (error) {
      console.error("Failed to fetch gallery images", error)
      setGalleryList([])
      setFeedback({ message: "Không tải được thư viện gallery.", tone: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, forMaleFilter])

  React.useEffect(() => {
    void Promise.resolve().then(fetchGallery)
  }, [fetchGallery])

  React.useEffect(() => {
    setCurrentPage(pageFromUrl)
    setSearchInput(searchFromUrl)
    setSearchQuery(searchFromUrl)
    setForMaleFilter(forMaleFromUrl)
    setSelectedGalleryIds([])
    setIsMultiSelectMode(false)
  }, [pageFromUrl, searchFromUrl, forMaleFromUrl])

  React.useEffect(() => {
    if (!feedback) return

    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 3200)

    return () => window.clearTimeout(timeout)
  }, [feedback])

  const handleUploaded = async () => {
    await fetchGallery()
    setFeedback({
      message: "Đã lưu ảnh cùng metadata vào gallery.",
      tone: "success",
    })
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setFeedback({ message: "Đã copy URL ảnh.", tone: "success" })
  }

  const openEditDialog = (gallery: GalleryImage) => {
    setEditTarget(gallery)
    setEditDraft({
      altText: gallery.altText ?? "",
      title: gallery.title ?? "",
      forMale: gallery.forMale === null ? undefined : gallery.forMale,
    })
  }

  const handleUpdateGallery = async () => {
    if (!editTarget) return

    try {
      setIsUpdatingGallery(true)
      setFeedback(null)
      await galleryService.updateGallery(editTarget.id, {
        altText: editDraft.altText.trim() || undefined,
        title: editDraft.title.trim() || undefined,
        forMale: editDraft.forMale,
      })
      await fetchGallery()
      setFeedback({ message: "Đã cập nhật thông tin ảnh gallery.", tone: "success" })
      setEditTarget(null)
    } catch (error) {
      console.error("Failed to update gallery metadata", error)
      setFeedback({ message: "Cập nhật thông tin ảnh thất bại.", tone: "error" })
    } finally {
      setIsUpdatingGallery(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsDeleting(true)
      setFeedback(null)
      await galleryService.deleteGallery(deleteTarget.id)
      await fetchGallery()
      setFeedback({ message: "Đã xóa ảnh gallery.", tone: "success" })
      setSelectedGalleryIds((current) =>
        current.filter((id) => id !== deleteTarget.id)
      )
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to delete gallery image", error)
      setFeedback({ message: "Xóa ảnh thất bại.", tone: "error" })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSelectGallery = (id: string, checked: boolean) => {
    setSelectedGalleryIds((current) =>
      checked
        ? Array.from(new Set([...current, id]))
        : current.filter((x) => x !== id)
    )
  }

  const toggleSelectCurrentPage = (checked: boolean) => {
    const currentPageIds = galleryList.map((x) => x.id)

    setSelectedGalleryIds((current) => {
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
        setSelectedGalleryIds([])
      }
      return next
    })
  }

  const updateGalleryUrl = React.useCallback(
    (page: number, search = searchQuery, forMale = forMaleFilter) => {
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

      if (forMale && forMale !== "all") {
        params.set("forMale", forMale)
      } else {
        params.delete("forMale")
      }

      const queryString = params.toString()
      router.push(queryString ? `/gallery?${queryString}` : "/gallery")
      setCurrentPage(nextPage)
      setSearchQuery(nextSearch)
      setForMaleFilter(forMale)
      setSelectedGalleryIds([])
      setIsMultiSelectMode(false)
    },
    [router, searchParams, searchQuery, forMaleFilter]
  )

  const handleSearchSubmit = () => {
    updateGalleryUrl(1, searchInput, forMaleFilter)
  }

  const handleGenderFilterChange = (value: string) => {
    updateGalleryUrl(1, searchInput, value)
  }

  const handleBulkDelete = async () => {
    if (!selectedGalleryIds.length) return

    const idsToDelete = selectedGalleryIds

    try {
      setIsDeleting(true)
      setFeedback(null)
      await Promise.all(idsToDelete.map((id) => galleryService.deleteGallery(id)))
      await fetchGallery()
      setFeedback({
        message: `Đã xóa ${idsToDelete.length} ảnh gallery.`,
        tone: "success",
      })
      setSelectedGalleryIds([])
      setIsMultiSelectMode(false)
      setIsBulkDeleteOpen(false)
    } catch (error) {
      console.error("Failed to delete selected gallery images", error)
      setFeedback({ message: "Xóa các ảnh đã chọn thất bại.", tone: "error" })
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
  const selectedCount = selectedGalleryIds.length
  const currentPageIds = galleryList.map((x) => x.id)
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedGalleryIds.includes(id))

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
      setSelectedGalleryIds(hitIds)
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
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thư viện Gallery (Lookbook)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý hình ảnh lookbook và phân loại theo nam/nữ.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-xl"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <IconUpload className="mr-2 size-4" />
          Tải lên Gallery
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên file..."
              className="w-full rounded-xl pl-9 md:w-[250px]"
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

          {/* Gender Filter Dropdown */}
          <div className="w-[200px]">
            <Select
              value={forMaleFilter}
              onValueChange={handleGenderFilterChange}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Phân loại giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ảnh</SelectItem>
                <SelectItem value="true">Thời trang Nam 👦</SelectItem>
                <SelectItem value="false">Thời trang Nữ 👧</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                onClick={() => setSelectedGalleryIds([])}
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
      ) : galleryList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          Không tìm thấy tệp tin nào trong Gallery.
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
            {galleryList.map((media) => {
              const isSelected = selectedGalleryIds.includes(media.id)
              const mediaIndex = galleryList.indexOf(media)

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
                      toggleSelectGallery(media.id, !isSelected)
                      return
                    }

                    if (media.mimeType.startsWith("image/")) {
                      setLightboxIndex(mediaIndex)
                    }
                  }}
                >
                  {/* Gender badge */}
                  {media.forMale !== null && media.forMale !== undefined && (
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {media.forMale ? "👦 Nam" : "👧 Nữ"}
                    </div>
                  )}

                  {isMultiSelectMode ? (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/10">
                      <div
                        className={`grid size-8 place-items-center rounded-full shadow-lg ring-2 ring-white transition ${isSelected ? "bg-orange-500/90 text-white" : "bg-white/95 text-stone-500"}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleSelectGallery(media.id, checked === true)
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
                        title="Chỉnh sửa thông tin"
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
              {pagination.total} ảnh, {GALLERY_PAGE_SIZE} ảnh/trang
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={!canGoPrevious || isLoading}
                onClick={() => updateGalleryUrl(pagination.page - 1)}
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
                      onClick={() => updateGalleryUrl(page)}
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
                onClick={() => updateGalleryUrl(pagination.page + 1)}
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
        galleryList[lightboxIndex] &&
        (() => {
          const current = galleryList[lightboxIndex]
          const hasPrev = lightboxIndex > 0
          const hasNext = lightboxIndex < galleryList.length - 1
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
                  title="Chỉnh sửa thông tin"
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
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm text-white/90 backdrop-blur-sm flex items-center gap-2">
                <span className="font-medium">{current.filename}</span>
                <span className="text-white/40">·</span>
                <span>{formatBytes(current.size ?? 0)}</span>
                {current.width && current.height ? (
                  <>
                    <span className="text-white/40">·</span>
                    <span>
                      {current.width}×{current.height}
                    </span>
                  </>
                ) : null}
                {current.forMale !== null && current.forMale !== undefined ? (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      {current.forMale ? "Nam" : "Nữ"}
                    </span>
                  </>
                ) : null}
                <span className="text-white/40">·</span>
                <span>
                  {lightboxIndex + 1}/{galleryList.length}
                </span>
              </div>
            </div>
          )
        })()}

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open && !isUpdatingGallery) setEditTarget(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chỉnh thông tin ảnh Gallery</DialogTitle>
            <DialogDescription>
              Cập nhật mô tả, tiêu đề SEO và phân loại giới tính cho ảnh gallery.
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
                <Label htmlFor="gallery-edit-alt">Alt text</Label>
                <Textarea
                  id="gallery-edit-alt"
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
                <Label htmlFor="gallery-edit-title">Tiêu đề</Label>
                <Input
                  id="gallery-edit-title"
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
                <Label htmlFor="gallery-edit-for-male">Phân loại giới tính</Label>
                <Select
                  value={editDraft.forMale === undefined ? "all" : String(editDraft.forMale)}
                  onValueChange={(val) => {
                    setEditDraft((current) => ({
                      ...current,
                      forMale: val === "all" ? undefined : val === "true"
                    }))
                  }}
                >
                  <SelectTrigger id="gallery-edit-for-male">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cả hai / Không xác định</SelectItem>
                    <SelectItem value="true">Thời trang Nam</SelectItem>
                    <SelectItem value="false">Thời trang Nữ</SelectItem>
                  </SelectContent>
                </Select>
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
              disabled={isUpdatingGallery}
              onClick={() => setEditTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={isUpdatingGallery}
              onClick={handleUpdateGallery}
            >
              {isUpdatingGallery ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa ảnh?"
        description={
          deleteTarget
            ? `Ảnh "${deleteTarget.filename}" sẽ bị xóa khỏi Gallery.`
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
        title={`Xóa ${selectedCount} ảnh?`}
        description="Những ảnh đã chọn sẽ bị xóa khỏi thư viện Gallery."
        confirmLabel={`Xóa ${selectedCount} ảnh`}
        destructive
        isLoading={isDeleting}
        onOpenChange={(open) => !open && setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />
      <GalleryUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploaded={handleUploaded}
      />
    </div>
  )
}

export default function GalleryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center gap-2">
          <span className="animate-spin text-lg">⏳</span>
          <span className="text-xs text-muted-foreground">
            Đang tải Gallery...
          </span>
        </div>
      }
    >
      <GalleryContent />
    </React.Suspense>
  )
}
