"use client"

import * as React from "react"

// ─── Types ────────────────────────────────────────────────────────────────

type ResizeDirection = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

interface CropOverlayProps {
  cropRect: { x: number; y: number; width: number; height: number }
  onCropChange: (rect: { x: number; y: number; width: number; height: number }) => void
  layerRect: { width: number; height: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function toPercentX(px: number, layerWidth: number): number {
  return layerWidth > 0 ? (px / layerWidth) * 100 : 0
}

function toPercentY(px: number, layerHeight: number): number {
  return layerHeight > 0 ? (px / layerHeight) * 100 : 0
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

// ─── Corner Handle (circle) ───────────────────────────────────────────────

function CornerHandle({
  direction,
  onResizeStart,
}: {
  direction: "nw" | "ne" | "se" | "sw"
  onResizeStart: (dir: ResizeDirection, e: React.MouseEvent) => void
}) {
  const positionMap: Record<string, React.CSSProperties> = {
    nw: { top: -5, left: -5, cursor: "nw-resize" },
    ne: { top: -5, right: -5, cursor: "ne-resize" },
    se: { bottom: -5, right: -5, cursor: "se-resize" },
    sw: { bottom: -5, left: -5, cursor: "sw-resize" },
  }

  return (
    <div
      className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full z-50 shadow-md hover:bg-primary/20"
      style={positionMap[direction]}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onResizeStart(direction, e)
      }}
    />
  )
}

// ─── Edge Handle (bar) ────────────────────────────────────────────────────

function EdgeHandle({
  direction,
  onResizeStart,
}: {
  direction: "n" | "e" | "s" | "w"
  onResizeStart: (dir: ResizeDirection, e: React.MouseEvent) => void
}) {
  const positionMap: Record<string, React.CSSProperties> = {
    n: {
      top: -3,
      left: "50%",
      transform: "translateX(-50%)",
      cursor: "n-resize",
      width: 32,
      height: 6,
    },
    s: {
      bottom: -3,
      left: "50%",
      transform: "translateX(-50%)",
      cursor: "s-resize",
      width: 32,
      height: 6,
    },
    e: {
      top: "50%",
      right: -3,
      transform: "translateY(-50%)",
      cursor: "e-resize",
      width: 6,
      height: 32,
    },
    w: {
      top: "50%",
      left: -3,
      transform: "translateY(-50%)",
      cursor: "w-resize",
      width: 6,
      height: 32,
    },
  }

  return (
    <div
      className="absolute bg-white border border-primary rounded-sm z-50 shadow-sm hover:bg-primary/20"
      style={positionMap[direction]}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onResizeStart(direction, e)
      }}
    />
  )
}

// ─── CropOverlay Component ────────────────────────────────────────────────

export function CropOverlay({ cropRect, onCropChange, layerRect }: CropOverlayProps) {
  const dragState = React.useRef<{
    startX: number
    startY: number
    startRect: { x: number; y: number; width: number; height: number }
    mode: ResizeDirection
  } | null>(null)

  // ─── Resize handler ──────────────────────────────────────────────────

  const handleResizeStart = (dir: ResizeDirection, e: React.MouseEvent) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
      mode: dir,
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current) return

      const dx = toPercentX(moveEvent.clientX - dragState.current.startX, layerRect.width)
      const dy = toPercentY(moveEvent.clientY - dragState.current.startY, layerRect.height)
      const dir = dragState.current.mode
      const sr = dragState.current.startRect

      let newX = sr.x
      let newY = sr.y
      let newW = sr.width
      let newH = sr.height

      // East — width thay đổi
      if (dir === "e" || dir === "ne" || dir === "se") {
        newW = Math.max(5, Math.min(100 - sr.x, sr.width + dx))
      }
      // West — width thay đổi, left bù lại
      if (dir === "w" || dir === "nw" || dir === "sw") {
        const maxDx = sr.width - 5
        const clampedDx = Math.max(-sr.x, Math.min(maxDx, dx))
        newX = sr.x + clampedDx
        newW = sr.width - clampedDx
      }
      // South — height thay đổi
      if (dir === "s" || dir === "se" || dir === "sw") {
        newH = Math.max(5, Math.min(100 - sr.y, sr.height + dy))
      }
      // North — height thay đổi, top bù lại
      if (dir === "n" || dir === "nw" || dir === "ne") {
        const maxDy = sr.height - 5
        const clampedDy = Math.max(-sr.y, Math.min(maxDy, dy))
        newY = sr.y + clampedDy
        newH = sr.height - clampedDy
      }

      onCropChange({
        x: round1(newX),
        y: round1(newY),
        width: round1(newW),
        height: round1(newH),
      })
    }

    const handleMouseUp = () => {
      dragState.current = null
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {/* Crop area — border + grid + handles (frame is FIXED, no move) */}
      <div
        className="absolute border-2 border-white pointer-events-auto"
        style={{
          top: `${cropRect.y}%`,
          left: `${cropRect.x}%`,
          width: `${cropRect.width}%`,
          height: `${cropRect.height}%`,
        }}
      >
        {/* Grid lines (rule of thirds) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
        </div>

        {/* Corner handles (circles) */}
        <CornerHandle direction="nw" onResizeStart={handleResizeStart} />
        <CornerHandle direction="ne" onResizeStart={handleResizeStart} />
        <CornerHandle direction="se" onResizeStart={handleResizeStart} />
        <CornerHandle direction="sw" onResizeStart={handleResizeStart} />

        {/* Edge handles (bars) */}
        <EdgeHandle direction="n" onResizeStart={handleResizeStart} />
        <EdgeHandle direction="e" onResizeStart={handleResizeStart} />
        <EdgeHandle direction="s" onResizeStart={handleResizeStart} />
        <EdgeHandle direction="w" onResizeStart={handleResizeStart} />

        {/* Size label */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white text-[9px] rounded whitespace-nowrap pointer-events-none">
          {Math.round(cropRect.width)}% × {Math.round(cropRect.height)}%
        </div>
      </div>
    </div>
  )
}
