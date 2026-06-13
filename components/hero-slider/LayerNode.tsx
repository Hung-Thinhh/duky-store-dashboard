"use client"

import * as React from "react"
import { IconPhoto } from "@tabler/icons-react"
import type { SlideLayer } from "@/app/(dashboard)/hero-slider/types"

// ─── Types ────────────────────────────────────────────────────────────────

interface LayerNodeProps {
  layer: SlideLayer
  canvasRect: DOMRect | null
  isSelected: boolean
  layerRect?: { width: number; height: number }
  onSelect: (e: React.MouseEvent) => void
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

function getGradientCss(layer: SlideLayer): string | undefined {
  if (!layer.useGradient) return undefined
  const type = layer.gradientType ?? "linear"
  const angle = layer.gradientAngle ?? 135
  const stops = layer.gradientStops ?? [
    { color: "#101114", position: 0 },
    { color: "#70737a", position: 100 }
  ]
  const stopsStr = [...stops]
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(", ")

  if (type === "radial") {
    return `radial-gradient(circle, ${stopsStr})`
  }
  return `linear-gradient(${angle}deg, ${stopsStr})`
}

// ─── LayerNode Component ──────────────────────────────────────────────────

export function LayerNode({
  layer,
  canvasRect,
  isSelected,
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
    onSelect(e)

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
        onSelect(e)
      }}
    >
      {/* Layer content — render by type */}
      {layer.type === "image" && layer.src && (
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
      )}

      {layer.type === "image" && !layer.src && (
        <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded border-dashed border-2 border-muted-foreground/30">
          <div className="text-center">
            <IconPhoto className="size-6 mx-auto text-muted-foreground/50" />
            <p className="text-[10px] text-muted-foreground mt-1">Chọn ảnh</p>
          </div>
        </div>
      )}

      {layer.type === "text" && (() => {
        const gradientCss = getGradientCss(layer)
        const textStyle: React.CSSProperties = {
          fontSize: `${layer.fontSize ?? 24}px`,
          fontWeight: layer.fontWeight ?? 400,
          fontFamily:
            layer.fontFamily === "playfair"
              ? "var(--font-playfair)"
              : "var(--font-montserrat)",
          textAlign: layer.textAlign ?? "left",
          lineHeight: layer.lineHeight ?? 1.3,
          letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
          textShadow: layer.textShadow || undefined,
          margin: 0,
        }
        if (gradientCss) {
          textStyle.backgroundImage = gradientCss
          textStyle.backgroundClip = "text"
          textStyle.WebkitBackgroundClip = "text"
          textStyle.WebkitTextFillColor = "transparent"
        } else {
          textStyle.color = layer.color ?? "#101114"
        }
        return (
          <div
            className="w-full h-full flex items-center pointer-events-none"
            style={{
              justifyContent: layer.textAlign === "center" ? "center" : layer.textAlign === "right" ? "flex-end" : "flex-start",
            }}
          >
            <p style={textStyle} className={gradientCss ? "bg-clip-text" : undefined}>
              {layer.content || "Nhập văn bản"}
            </p>
          </div>
        )
      })()}

      {layer.type === "button" && (() => {
        const buttonGradientCss = getGradientCss(layer)
        const btnStyle: React.CSSProperties = {
          color: layer.textColor ?? "#ffffff",
          fontFamily:
            layer.fontFamily === "playfair"
              ? "var(--font-playfair)"
              : "var(--font-montserrat)",
          padding: "10px 28px",
          fontSize: "14px",
          border: layer.variant === "secondary" ? "2px solid #101114" : "none",
        }
        if (buttonGradientCss) {
          btnStyle.background = buttonGradientCss
        } else {
          btnStyle.background = layer.buttonColor ?? "#101114"
        }
        return (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <span
              className="inline-block font-semibold rounded-full"
              style={btnStyle}
            >
              {layer.label || "Xem thêm"}
            </span>
          </div>
        )
      })()}

    </div>
  )
}
