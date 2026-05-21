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
}

export function SeoMetadataForm({
  originalExtension,
  initialAltText = "",
  initialTitle = "",
  initialFileName = "",
  onSave,
  isSaving,
  error,
}: SeoMetadataFormProps) {
  const [altText, setAltText] = React.useState(initialAltText)
  const [title, setTitle] = React.useState(initialTitle)
  const [seoFilename, setSeoFilename] = React.useState(initialFileName)
  const [isManuallyEdited, setIsManuallyEdited] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-generate slug from altText or title with debounce (Task 6.2)
  React.useEffect(() => {
    if (isManuallyEdited) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const source = altText.trim() || title.trim()
      if (source) {
        const generated = generateSeoFilename(source, originalExtension)
        setSeoFilename(generated)
      } else {
        setSeoFilename("")
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [altText, title, originalExtension, isManuallyEdited])

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSeoFilename(value)

    if (value === "") {
      // Reset manual edit when admin clears filename entirely
      setIsManuallyEdited(false)
    } else {
      setIsManuallyEdited(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!altText.trim()) {
      setValidationError("Alt text là bắt buộc cho SEO")
      return
    }

    setValidationError(null)

    const fileName = seoFilename || generateSeoFilename(altText.trim() || "media", originalExtension)

    await onSave({
      altText: altText.trim(),
      title: title.trim(),
      fileName,
    })
  }

  // Compute the preview filename
  const previewFilename = seoFilename || `media${originalExtension}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seo-alt-text">
          Mô tả nội dung ảnh <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="seo-alt-text"
          value={altText}
          onChange={(e) => {
            setAltText(e.target.value)
            if (validationError) setValidationError(null)
          }}
          placeholder="Mô tả ngắn gọn nội dung ảnh (ví dụ: Áo blazer nữ màu đen)"
          maxLength={125}
          className="min-h-16"
        />
        <div className="flex items-center justify-between">
          {validationError ? (
            <p className="text-xs text-red-500">{validationError}</p>
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
          onChange={(e) => setTitle(e.target.value)}
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

      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <IconLoader2 className="mr-2 size-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          "Lưu thông tin SEO"
        )}
      </Button>
    </form>
  )
}
