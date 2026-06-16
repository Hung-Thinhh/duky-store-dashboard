"use client"

import * as React from "react"
import {
  IconArrowBack,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCopy,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconDeviceTablet,
  IconLoader2,
  IconEye,
  IconPhoto,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconTypography,
  IconClick,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { SlideLayer, LayerType, ViewportMode } from "@/app/(dashboard)/hero-slider/types"
import { ZoomControls } from "./ZoomControls"

// ─── Types ────────────────────────────────────────────────────────────────

type ToolbarMode = "default" | "layer"

interface TopToolbarProps {
  title?: string
  onTitleChange?: (v: string) => void
  onBack: () => void
  mode: ToolbarMode
  viewport: ViewportMode
  onViewportChange: (v: ViewportMode) => void

  layer?: SlideLayer | null
  onUpdateLayer?: (updater: (l: SlideLayer) => SlideLayer) => void
  onPickMedia?: (type: "layer" | "mobile") => void
  onRemoveLayer?: () => void


  onSave: () => void
  onReload: () => void
  isSaving: boolean
  isDirty?: boolean
  onOpenProperties?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onPreview?: () => void
  onDuplicateLayer?: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onFit: () => void
}

// ─── Helper ───────────────────────────────────────────────────────────────

function ToolbarInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-[10px] text-muted-foreground shrink-0 w-6">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-7 text-xs rounded-md w-14 ${className ?? ""}`}
      />
    </div>
  )
}

// ─── Type Selector ────────────────────────────────────────────────────────

function TypeSelector({
  currentType,
  onTypeChange,
}: {
  currentType: LayerType
  onTypeChange: (type: LayerType) => void
}) {
  const types: { type: LayerType; icon: React.ReactNode; label: string }[] = [
    { type: "image", icon: <IconPhoto className="size-3.5" />, label: "Ảnh" },
    { type: "text", icon: <IconTypography className="size-3.5" />, label: "Text" },
    { type: "button", icon: <IconClick className="size-3.5" />, label: "Nút" },
  ]

  return (
    <div className="flex items-center rounded-md border overflow-hidden">
      {types.map((t) => (
        <button
          key={t.type}
          type="button"
          onClick={() => onTypeChange(t.type)}
          className={`flex items-center gap-1 px-2 py-1.5 text-[10px] transition-colors ${
            currentType === t.type
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────

export function TopToolbar({
  title,
  onTitleChange,
  onBack,
  mode,
  viewport,
  onViewportChange,
  layer,
  onUpdateLayer,
  onPickMedia,
  onRemoveLayer,

  onSave,
  onReload,
  isSaving,
  isDirty,
  onOpenProperties,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPreview,
  onDuplicateLayer,
  zoom,
  onZoomChange,
  onFit,
}: TopToolbarProps) {
  const updateLayout = (key: string, value: string) => {
    if (!onUpdateLayer) return
    onUpdateLayer((l) => ({
      ...l,
      [key]: value || undefined,
    }))
  }

  return (
    <div className="h-12 border-b bg-card flex items-center px-3 gap-2 shrink-0 overflow-x-auto relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onBack}
        className="h-8 w-8 rounded-lg border-red-200 bg-red-50/50 hover:bg-red-100 hover:border-red-300 dark:border-red-950/20 dark:bg-red-950/20 dark:hover:bg-red-950/40 shrink-0"
        title="Quay lại"
      >
        <IconArrowBack className="size-4 text-red-600 dark:text-red-400" />
      </Button>

      {onTitleChange ? (
        <>
          <div className="flex items-center shrink-0">
            <Input
              value={title || ""}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-7 text-xs font-semibold px-2 py-1 bg-transparent hover:bg-muted/50 focus:bg-background border-none focus:ring-1 focus:ring-ring w-40 rounded-md transition-colors"
              placeholder="Tên slider"
            />
          </div>
          <Separator orientation="vertical" className="h-5 shrink-0" />
        </>
      ) : (
        <Separator orientation="vertical" className="h-5 shrink-0" />
      )}

      {mode === "default" && (
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex">
          <ZoomControls
            zoom={zoom}
            onZoomChange={onZoomChange}
            onFit={onFit}
            className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-xl px-2 py-0.5"
          />
        </div>
      )}

      {/* Default mode: viewport + actions */}
      {mode === "default" && (
        <>
          <div className="flex items-center rounded-md border overflow-hidden">
            {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewportChange(v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                  viewport === v
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {v === "desktop" && <IconDeviceDesktop className="size-3.5" />}
                {v === "tablet" && <IconDeviceTablet className="size-3.5" />}
                {v === "mobile" && <IconDeviceMobile className="size-3.5" />}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-5" />

          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <IconArrowBackUp className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <IconArrowForwardUp className="size-3.5" />
          </Button>

          <div className="flex-1" />

          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} className="h-7 rounded-md text-xs">
              <IconEye className="size-3 mr-1" />
              Preview
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onReload} className="h-7 rounded-md text-xs">
            <IconRefresh className="size-3 mr-1" />
            Tải lại
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving} className="h-7 rounded-md text-xs relative">
            {isSaving ? (
              <IconLoader2 className="size-3 mr-1 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-3 mr-1" />
            )}
            Lưu
            {isDirty && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-orange-500" />
            )}
          </Button>
        </>
      )}

      {/* Layer mode: type selector + type-specific controls */}
      {mode === "layer" && layer && onUpdateLayer && (
        <>
          {/* Type selector */}
          <TypeSelector
            currentType={layer.type}
            onTypeChange={(type) =>
              onUpdateLayer((l) => {
                // Fields to keep regardless of type
                const base = {
                  type,
                  name: l.name || (type === "image" ? "Ảnh" : type === "text" ? "Văn bản" : "Nút bấm"),
                  zIndex: l.zIndex,
                  top: l.top,
                  left: l.left,
                  width: l.width,
                  height: l.height,
                  display: l.display,
                }

                // Clean up fields from old type, set defaults for new type
                if (type === "image") {
                  return {
                    ...base,
                    src: l.src || "",
                    srcMobile: l.srcMobile,
                    alt: l.alt || "",
                    objectFit: l.objectFit || "contain",
                    float: l.float || { duration: 4, delay: 0, displacement: 0, direction: "down" },
                  }
                }

                if (type === "text") {
                  return {
                    ...base,
                    content: l.content || "Nhập văn bản",
                    fontSize: l.fontSize || 24,
                    fontWeight: l.fontWeight || 400,
                    color: l.color || "#101114",
                    textAlign: l.textAlign || "left",
                  }
                }

                // button
                return {
                  ...base,
                  label: l.label || "Xem thêm",
                  link: l.link || "/",
                  variant: l.variant || "primary",
                  buttonColor: l.buttonColor || "#101114",
                  textColor: l.textColor || "#ffffff",
                }
              })
            }
          />

          <Separator orientation="vertical" className="h-5" />

          {/* Image-specific controls */}
          {layer.type === "image" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPickMedia?.("layer")}
                className="h-7 rounded-md text-xs shrink-0"
              >
                <IconPhoto className="size-3 mr-1" />
                {layer.src ? "Đổi ảnh" : "Chọn ảnh"}
              </Button>
              <Separator orientation="vertical" className="h-5" />
            </>
          )}

          {/* Text-specific controls */}
          {layer.type === "text" && (
            <>
              <Input
                value={layer.content ?? ""}
                onChange={(e) =>
                  onUpdateLayer((l) => ({ ...l, content: e.target.value }))
                }
                placeholder="Nhập văn bản"
                className="h-7 text-xs rounded-md w-40"
              />
              <Input
                type="number"
                value={layer.fontSize ?? 24}
                onChange={(e) =>
                  onUpdateLayer((l) => ({
                    ...l,
                    fontSize: Number(e.target.value),
                  }))
                }
                className="h-7 text-xs rounded-md w-14"
                title="Font size"
              />
              <input
                type="color"
                value={layer.color ?? "#101114"}
                onChange={(e) =>
                  onUpdateLayer((l) => ({ ...l, color: e.target.value }))
                }
                className="w-7 h-7 rounded cursor-pointer border"
                title="Text color"
              />
              <Select
                value={layer.textAlign ?? "left"}
                onValueChange={(v) =>
                  onUpdateLayer((l) => ({ ...l, textAlign: v as "left" | "center" | "right" }))
                }
              >
                <SelectTrigger className="h-7 w-16 text-[10px] rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="left">Trái</SelectItem>
                  <SelectItem value="center">Giữa</SelectItem>
                  <SelectItem value="right">Phải</SelectItem>
                </SelectContent>
              </Select>
              <Separator orientation="vertical" className="h-5" />
            </>
          )}

          {/* Button-specific controls */}
          {layer.type === "button" && (
            <>
              <Input
                value={layer.label ?? ""}
                onChange={(e) =>
                  onUpdateLayer((l) => ({ ...l, label: e.target.value }))
                }
                placeholder="Nhãn nút"
                className="h-7 text-xs rounded-md w-28"
              />
              <Select
                value={layer.variant ?? "primary"}
                onValueChange={(v) =>
                  onUpdateLayer((l) => ({ ...l, variant: v as "primary" | "secondary" }))
                }
              >
                <SelectTrigger className="h-7 w-20 text-[10px] rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="color"
                value={layer.buttonColor ?? "#101114"}
                onChange={(e) =>
                  onUpdateLayer((l) => ({ ...l, buttonColor: e.target.value }))
                }
                className="w-7 h-7 rounded cursor-pointer border"
                title="Button color"
              />
              <Separator orientation="vertical" className="h-5" />
            </>
          )}

          {/* Common controls: Position + Size */}
          <ToolbarInput label="L" value={layer.left ?? ""} onChange={(v) => updateLayout("left", v)} placeholder="0" />
          <ToolbarInput label="T" value={layer.top ?? ""} onChange={(v) => updateLayout("top", v)} placeholder="0" />
          <Separator orientation="vertical" className="h-5" />
          <ToolbarInput label="W" value={layer.width ?? ""} onChange={(v) => updateLayout("width", v)} placeholder="50" />
          <ToolbarInput label="H" value={layer.height ?? ""} onChange={(v) => updateLayout("height", v)} placeholder="50" />
          <Separator orientation="vertical" className="h-5" />
          <ToolbarInput label="Z" value={String(layer.zIndex)} onChange={(v) => onUpdateLayer((l) => ({ ...l, zIndex: Number(v) }))} className="w-10" />

          <div className="flex-1" />

          {/* Settings */}
          {onOpenProperties && (
            <Button size="icon" variant="ghost" className="size-7" onClick={onOpenProperties} title="Settings" aria-label="Settings">
              <IconSettings className="size-3.5" />
            </Button>
          )}

          {/* Duplicate */}
          {onDuplicateLayer && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDuplicateLayer}
              className="h-7 rounded-md text-xs"
              title="Sao chép layer (Ctrl+D)"
            >
              <IconCopy className="size-3 mr-1" />
              Sao chép
            </Button>
          )}

          {/* Delete */}
          <Button
            size="sm"
            variant="outline"
            onClick={onRemoveLayer}
            className="h-7 rounded-md text-xs text-destructive hover:text-destructive"
          >
            <IconTrash className="size-3" />
          </Button>
        </>
      )}
    </div>
  )
}
