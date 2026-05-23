"use client"

import * as React from "react"
import { IconCheck, IconPhoto, IconUpload } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Media } from "@/lib/api/schemas/media.schema"
import { mediaService } from "@/lib/api/services/media.service"
import { generateSeoFilename, slugify } from "@/lib/utils/slugify"
import { SeoMetadataForm, type SeoMetadataPayload } from "./seo-metadata-form"

type MediaUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: (media: Media | Media[]) => void | Promise<void>
}

type SelectedUpload = {
  id: string
  file: File
  previewUrl: string
  metadata: SeoMetadataPayload
}

const DEFAULT_METADATA_TEXT = "Duky Store"

function getReadableSize(size: number) {
  const kb = size / 1024
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(2)} MB`
}

function getStoredExtension(file: File) {
  return file.type === "image/svg+xml" ? ".svg" : ".webp"
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "")
}

function looksUglyFileName(fileName: string) {
  const base = slugify(stripExtension(fileName))
  if (!base) return true
  if (base === "media" || base === "image" || base === "img" || base === "photo") return true
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(base)) return true
  if (/^[a-f0-9]{16,}$/i.test(base)) return true
  if (/^\d{8,}$/.test(base)) return true
  return false
}

function buildDefaultMetadata(file: File): SeoMetadataPayload {
  const extension = getStoredExtension(file)
  const originalBase = slugify(stripExtension(file.name))
  const needsBrandPrefix = looksUglyFileName(file.name) || !originalBase.startsWith("duky-store")
  const fileNameSource = needsBrandPrefix
    ? `duky-store ${originalBase || DEFAULT_METADATA_TEXT}`
    : originalBase

  return {
    altText: DEFAULT_METADATA_TEXT,
    title: DEFAULT_METADATA_TEXT,
    fileName: generateSeoFilename(fileNameSource, extension),
  }
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: MediaUploadDialogProps) {
  const [uploads, setUploads] = React.useState<SelectedUpload[]>([])
  const [activeUploadId, setActiveUploadId] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const uploadsRef = React.useRef<SelectedUpload[]>([])

  React.useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  React.useEffect(() => {
    return () => {
      uploadsRef.current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl))
    }
  }, [])

  const activeUpload = React.useMemo(
    () => uploads.find((upload) => upload.id === activeUploadId) ?? uploads[0] ?? null,
    [activeUploadId, uploads],
  )

  const reset = React.useCallback(() => {
    uploadsRef.current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl))
    uploadsRef.current = []
    setUploads([])
    setActiveUploadId(null)
    setError(null)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSaving) return
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const nextUploads = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      metadata: buildDefaultMetadata(file),
    }))

    reset()
    uploadsRef.current = nextUploads
    setUploads(nextUploads)
    setActiveUploadId(nextUploads[0]?.id ?? null)
    setError(null)
    event.target.value = ""
  }

  const handleChooseAnother = () => {
    reset()
  }

  const updateActiveMetadata = async (metadata: SeoMetadataPayload) => {
    if (!activeUpload) return
    setUploads((current) =>
      current.map((upload) =>
        upload.id === activeUpload.id ? { ...upload, metadata } : upload,
      ),
    )
  }

  const updateActiveDraft = React.useCallback(
    (metadata: SeoMetadataPayload) => {
      if (!activeUploadId) return

      setUploads((current) =>
        current.map((upload) => {
          if (upload.id !== activeUploadId) return upload
          if (
            upload.metadata.altText === metadata.altText &&
            upload.metadata.title === metadata.title &&
            upload.metadata.fileName === metadata.fileName
          ) {
            return upload
          }

          return { ...upload, metadata }
        }),
      )
    },
    [activeUploadId],
  )

  const handleSaveAll = async () => {
    if (!uploads.length) return

    try {
      setIsSaving(true)
      setError(null)

      const uploaded: Media[] = []
      for (const upload of uploads) {
        uploaded.push(await mediaService.uploadMedia(upload.file, upload.metadata))
      }

      await onUploaded(uploaded)
      reset()
      onOpenChange(false)
    } catch (uploadError) {
      console.error("Failed to upload media with metadata", uploadError)
      setError("Tải ảnh thất bại. Kiểm tra ảnh hoặc thông tin rồi thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-lg p-0">
        <DialogHeader className="border-b border-stone-200 px-6 py-4">
          <DialogTitle>Tải ảnh vào thư viện</DialogTitle>
          <DialogDescription>
            Chọn một hoặc nhiều ảnh. Metadata có thể bỏ trống, hệ thống sẽ tự điền Duky Store.
          </DialogDescription>
        </DialogHeader>

        {!uploads.length ? (
          <div className="p-8">
            <div className="mx-auto flex min-h-72 max-w-2xl flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
              <IconUpload className="size-10 text-stone-400" />
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Chọn ảnh để tải lên
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Có thể chọn nhiều ảnh cùng lúc. Tên file xấu sẽ được chuẩn hóa kèm duky-store.
              </p>
              <Label htmlFor="media-library-upload" className="mt-5 cursor-pointer">
                <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-medium text-white hover:bg-orange-700">
                  <IconPhoto className="size-4" />
                  Chọn ảnh
                </span>
              </Label>
              <input
                id="media-library-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(300px,1fr)_minmax(340px,430px)]">
            <div className="space-y-4">
              {activeUpload ? (
                <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeUpload.previewUrl}
                    alt={activeUpload.metadata.altText || "Xem trước ảnh tải lên"}
                    className="max-h-[50vh] w-full object-contain p-3"
                  />
                </div>
              ) : null}

              <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
                {uploads.map((upload, index) => {
                  const isActive = upload.id === activeUpload?.id

                  return (
                    <button
                      key={upload.id}
                      type="button"
                      className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${
                        isActive
                          ? "border-orange-500 bg-orange-50"
                          : "border-stone-200 hover:border-orange-200 hover:bg-stone-50"
                      }`}
                      onClick={() => setActiveUploadId(upload.id)}
                    >
                      <span className="relative flex size-14 shrink-0 overflow-hidden rounded-md bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={upload.previewUrl} alt="" className="h-full w-full object-cover" />
                        {isActive ? (
                          <span className="absolute right-1 top-1 rounded-full bg-orange-600 p-0.5 text-white">
                            <IconCheck className="size-3" />
                          </span>
                        ) : null}
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-medium text-stone-800">
                          {index + 1}. {upload.file.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-stone-500">
                          {getReadableSize(upload.file.size)} - {upload.file.type || "image"}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-xs text-stone-500">
                          {upload.metadata.fileName}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg"
                disabled={isSaving}
                onClick={handleChooseAnother}
              >
                Chọn lại ảnh
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-stone-900">Thông tin SEO cho ảnh</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Đang sửa {uploads.findIndex((upload) => upload.id === activeUpload?.id) + 1}/{uploads.length}. Bỏ trống sẽ dùng Duky Store.
                </p>
              </div>

              {activeUpload ? (
                <SeoMetadataForm
                  key={activeUpload.id}
                  originalExtension={getStoredExtension(activeUpload.file)}
                  initialAltText={activeUpload.metadata.altText}
                  initialTitle={activeUpload.metadata.title}
                  initialFileName={activeUpload.metadata.fileName}
                  onSave={updateActiveMetadata}
                  isSaving={isSaving}
                  allowDefaultMetadata
                  defaultMetadataText={DEFAULT_METADATA_TEXT}
                  submitLabel="Lưu thông tin ảnh này"
                  onDraftChange={updateActiveDraft}
                />
              ) : null}

              {error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : null}

              <Button
                type="button"
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700"
                disabled={isSaving || !uploads.length}
                onClick={handleSaveAll}
              >
                {isSaving ? "Đang tải ảnh..." : `Tải lên ${uploads.length} ảnh`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
