"use client"

import * as React from "react"
import { IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { generateSeoFilename } from "@/lib/utils/slugify"

export interface SeoMetadataPayload {
  altText: string
  title: string
  fileName: string
}

interface SeoMetadataFormProps {
  originalExtension: string
  initialAltText?: string
  initialTitle?: string
  initialFileName?: string
  onSave: (data: SeoMetadataPayload) => Promise<void>
  isSaving: boolean
  error?: string | null
  allowDefaultMetadata?: boolean
  defaultMetadataText?: string
  submitLabel?: string
  onDraftChange?: (data: SeoMetadataPayload) => void
}

export function SeoMetadataForm({
  originalExtension,
  initialAltText = "",
  initialTitle = "",
  initialFileName = "",
  onSave,
  isSaving,
  error,
  allowDefaultMetadata = false,
  defaultMetadataText = "Duky Store",
  submitLabel = "Lưu thông tin SEO",
  onDraftChange,
}: SeoMetadataFormProps) {
  const [altText, setAltText] = React.useState(initialAltText)
  const [title, setTitle] = React.useState(initialTitle)
  const [seoFilename, setSeoFilename] = React.useState(initialFileName)
  const [isManuallyEdited, setIsManuallyEdited] = React.useState(Boolean(initialFileName))
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvePayload = React.useCallback((): SeoMetadataPayload => {
    const fallbackText = defaultMetadataText.trim() || "Duky Store"
    const resolvedAltText = altText.trim() || fallbackText
    const resolvedTitle = title.trim() || fallbackText
    const fileName = seoFilename || generateSeoFilename(resolvedAltText, originalExtension)

    return {
      altText: resolvedAltText,
      title: resolvedTitle,
      fileName,
    }
  }, [altText, defaultMetadataText, originalExtension, seoFilename, title])

  React.useEffect(() => {
    if (isManuallyEdited) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const source = altText.trim() || title.trim()
      setSeoFilename(source ? generateSeoFilename(source, originalExtension) : "")
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [altText, title, originalExtension, isManuallyEdited])

  React.useEffect(() => {
    onDraftChange?.(resolvePayload())
  }, [onDraftChange, resolvePayload])

  const handleFilenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSeoFilename(value)
    setIsManuallyEdited(value !== "")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!allowDefaultMetadata && !altText.trim()) {
      setValidationError("Alt text là bắt buộc cho SEO")
      return
    }

    setValidationError(null)
    await onSave(resolvePayload())
  }

  const previewFilename = seoFilename || `media${originalExtension}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seo-alt-text">
          Mô tả nội dung ảnh {allowDefaultMetadata ? null : <span className="text-red-500">*</span>}
        </Label>
        <Textarea
          id="seo-alt-text"
          value={altText}
          onChange={(event) => {
            setAltText(event.target.value)
            if (validationError) setValidationError(null)
          }}
          placeholder="Mô tả ngắn gọn nội dung ảnh"
          maxLength={125}
          className="min-h-16"
        />
        <div className="flex items-center justify-between">
          {validationError ? (
            <p className="text-xs text-red-500">{validationError}</p>
          ) : allowDefaultMetadata ? (
            <p className="text-xs text-stone-500">Bỏ trống sẽ tự điền {defaultMetadataText}.</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-stone-400">{altText.length}/125</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seo-title">Tiêu đề (tùy chọn)</Label>
        <Input
          id="seo-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tiêu đề SEO cho ảnh"
          maxLength={200}
        />
        <div className="flex justify-end">
          <span className="text-xs text-stone-400">{title.length}/200</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seo-filename">Tên file SEO</Label>
        <Input
          id="seo-filename"
          value={seoFilename}
          onChange={handleFilenameChange}
          placeholder={`media${originalExtension}`}
        />
        <p className="text-xs text-stone-500">
          Preview: <span className="font-mono text-stone-700">{previewFilename}</span>
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}

      <Button type="submit" className="w-full rounded-xl" disabled={isSaving}>
        {isSaving ? (
          <>
            <IconLoader2 className="mr-2 size-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
