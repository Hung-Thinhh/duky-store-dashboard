"use client"

import * as React from "react"
import { IconPhoto, IconUpload } from "@tabler/icons-react"

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
import { SeoMetadataForm, type SeoMetadataPayload } from "./seo-metadata-form"

type MediaUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: (media: Media) => void | Promise<void>
}

function getReadableSize(size: number) {
  const kb = size / 1024
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(2)} MB`
}

function getStoredExtension(file: File) {
  return file.type === "image/svg+xml" ? ".svg" : ".webp"
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: MediaUploadDialogProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const previewUrlRef = React.useRef("")

  React.useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const replacePreview = (nextFile: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const nextPreviewUrl = nextFile ? URL.createObjectURL(nextFile) : ""
    previewUrlRef.current = nextPreviewUrl
    setPreviewUrl(nextPreviewUrl)
  }

  const reset = () => {
    setFile(null)
    replacePreview(null)
    setError(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSaving) return
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    replacePreview(nextFile)
    setError(null)
    event.target.value = ""
  }

  const handleChooseAnother = () => {
    setFile(null)
    replacePreview(null)
    setError(null)
  }

  const handleSave = async (metadata: SeoMetadataPayload) => {
    if (!file) return

    try {
      setIsSaving(true)
      setError(null)
      const uploaded = await mediaService.uploadMedia(file, metadata)
      await onUploaded(uploaded)
      reset()
      onOpenChange(false)
    } catch (uploadError) {
      console.error("Failed to upload media with metadata", uploadError)
      setError("Tải ảnh thất bại. Kiểm tra ảnh hoặc thông tin SEO rồi thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-lg p-0">
        <DialogHeader className="border-b border-stone-200 px-6 py-4">
          <DialogTitle>Tải ảnh vào thư viện</DialogTitle>
          <DialogDescription>
            Chọn ảnh, hoàn tất metadata SEO rồi lưu vào thư viện.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div className="p-8">
            <div className="mx-auto flex min-h-72 max-w-2xl flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
              <IconUpload className="size-10 text-stone-400" />
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                Chọn một ảnh để tải lên
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Metadata sẽ được nhập trước khi ảnh được lưu.
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
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(280px,1fr)_minmax(320px,420px)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Xem trước ảnh tải lên"
                  className="max-h-[58vh] w-full object-contain p-3"
                />
              </div>
              <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-600">
                <p className="truncate font-medium text-stone-800">{file.name}</p>
                <p className="mt-1">{getReadableSize(file.size)} - {file.type || "image"}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg"
                disabled={isSaving}
                onClick={handleChooseAnother}
              >
                Chọn ảnh khác
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-stone-900">Thông tin SEO cho ảnh</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Alt text là bắt buộc. Tên file SEO sẽ được dùng ngay khi lưu ảnh.
                </p>
              </div>
              <SeoMetadataForm
                key={`${file.name}-${file.lastModified}`}
                originalExtension={getStoredExtension(file)}
                onSave={handleSave}
                isSaving={isSaving}
                error={error}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
