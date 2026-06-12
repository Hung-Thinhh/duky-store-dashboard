"use client"

import * as React from "react"
import { IconPhoto } from "@tabler/icons-react"
import { CropOverlay } from "./CropOverlay"
import type { SlideLayer } from "@/app/(dashboard)/hero-slider/types"

// ─── Types ────────────────────────────────────────────────────────────────

interface LayerNodeProps {
  layer: SlideLayer
  canvasRect: DOMRect | null
  isSelected: boolean
  cropMode?: boolean
  cropRect?: { x: number; y: number; width: number; height: number }
  onCropRectChange?: (rect: { x: number; y: number; width: number; height: number }) => void
  layerRect?: { width: number; height: number }
  onSelect: () => void
  onPositionChange: (left: number, top: number) => void
  onSizeChange: (width: number, height: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function parsePercent(v: string | undefined, fallback: number): number {
  if (!v) return fallback
  const num = parseFloat(v)
  return isNaN(num) ? fallback : num
}

// ─── LayerNode Component ──────────────────────────────────────────────────

export function LayerNode({
  layer,
  canvasRect,
  isSelected,
  cropMode,
  cropRect,
  onCropRectChange,
  layerRect,
  onSelect,
  onPositionChange,
  onSizeChange,
  onDragStart,
  onDragEnd,
}: LayerNodeProps) {
  const dragState = React.useRef<{
    startX: number
    startY: number
    startLeft: number
    startTop: number
    startWidth: number
    startHeight: number
    direction: "move"
  } | null>(null)

  // Ref to always have latest onDragEnd (avoids stale closure in mouseup)
  const onDragEndRef = React.useRef(onDragEnd)
  onDragEndRef.current = onDragEnd

  const left = parsePercent(layer.left, 0)
  const top = parsePercent(layer.top, 0)
  const width = parsePercent(layer.width, 50)
  const height = parsePercent(layer.height, 50)

  // ─── Move handler ────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect()

    // Don't allow drag if locked
    if (layer.locked) return

    // Only start drag if this layer is already selected
    if (!isSelected) return

    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: left,
      startTop: top,
      startWidth: width,
      startHeight: height,
      direction: "move",
    }
    onDragStart?.()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current || !canvasRect) return
      if (dragState.current.direction !== "move") return

      const dx = moveEvent.clientX - dragState.current.startX
      const dy = moveEvent.clientY - dragState.current.startY
      const dxPercent = (dx / canvasRect.width) * 100
      const dyPercent = (dy / canvasRect.height) * 100

      onPositionChange(
        Math.round(dragState.current.startLeft + dxPercent),
        Math.round(dragState.current.startTop + dyPercent),
      )
    }

    const handleMouseUp = () => {
      dragState.current = null
      onDragEndRef.current?.()
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      className={`absolute transition-shadow ${
        layer.locked ? "cursor-default opacity-70" : "cursor-move"
      } ${
        isSelected
          ? "ring-2 ring-primary ring-offset-1 shadow-lg"
          : "hover:ring-1 hover:ring-primary/50"
      }`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: layer.zIndex,
        display: layer.display === "none" ? "none" : "block",
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Layer content — render by type */}
      {layer.type === "image" && layer.src && (() => {
        // Crop mode: clip image to crop rect
        if (cropMode && cropRect) {
          const insetRight = 100 - cropRect.x - cropRect.width
          const insetBottom = 100 - cropRect.y - cropRect.height
          return (
            <img
              src={layer.src}
              alt={layer.alt}
              className="w-full h-full pointer-events-none"
              style={{
                objectFit: layer.objectFit || "contain",
                objectPosition: layer.objectPosition || "center",
                clipPath: `inset(${cropRect.y}% ${insetRight}% ${insetBottom}% ${cropRect.x}%)`,
              }}
              draggable={false}
            />
          )
        }

        // Saved crop: use overflow:hidden container
        if (layer.crop) {
          const crop = layer.crop
          const scaleX = 100 / crop.width
          const scaleY = 100 / crop.height
          return (
            <div className="relative w-full h-full overflow-hidden pointer-events-none">
              <img
                src={layer.src}
                alt={layer.alt}
                className="absolute"
                style={{
                  left: `${-crop.x * scaleX}%`,
                  top: `${-crop.y * scaleY}%`,
                  width: `${scaleX * 100}%`,
                  height: `${scaleY * 100}%`,
                }}
                draggable={false}
              />
            </div>
          )
        }

        // No crop: render normally
        return (
          <img
            src={layer.src}
            alt={layer.alt}
            className="w-full h-full pointer-events-none"
            style={{
              objectFit: layer.objectFit || "contain",
              objectPosition: layer.objectPosition || "center",
            }}
            draggable={false}
          />
        )
      })()}

      {layer.type === "image" && !layer.src && (
        <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded border-dashed border-2 border-muted-foreground/30">
          <div className="text-center">
            <IconPhoto className="size-6 mx-auto text-muted-foreground/50" />
            <p className="text-[10px] text-muted-foreground mt-1">Chọn ảnh</p>
          </div>
        </div>
      )}

      {layer.type === "text" && (
        <div
          className="w-full h-full flex items-center pointer-events-none"
          style={{
            justifyContent: layer.textAlign === "center" ? "center" : layer.textAlign === "right" ? "flex-end" : "flex-start",
          }}
        >
          <p
            style={{
              fontSize: `${layer.fontSize ?? 24}px`,
              fontWeight: layer.fontWeight ?? 400,
              color: layer.color ?? "#101114",
              fontFamily:
                layer.fontFamily === "playfair"
                  ? "var(--font-playfair)"
                  : "var(--font-montserrat)",
              textAlign: layer.textAlign ?? "left",
              lineHeight: layer.lineHeight ?? 1.3,
              letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
              textShadow: layer.textShadow || undefined,
              margin: 0,
            }}
          >
            {layer.content || "Nhập văn bản"}
          </p>
        </div>
      )}

      {layer.type === "button" && (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <span
            className="inline-block font-semibold rounded-full"
            style={{
              background: layer.buttonColor ?? "#101114",
              color: layer.textColor ?? "#ffffff",
              fontFamily:
                layer.fontFamily === "playfair"
                  ? "var(--font-playfair)"
                  : "var(--font-montserrat)",
              padding: "10px 28px",
              fontSize: "14px",
              border: layer.variant === "secondary" ? "2px solid #101114" : "none",
            }}
          >
            {layer.label || "Xem thêm"}
          </span>
        </div>
      )}

      {/* Crop overlay — shown when in crop mode */}
      {cropMode && cropRect && onCropRectChange && layerRect && (
        <CropOverlay
          cropRect={cropRect}
          onCropChange={onCropRectChange}
          layerRect={layerRect}
        />
      )}
    </div>
  )
}
