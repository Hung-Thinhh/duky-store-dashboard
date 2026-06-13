"use client"

import * as React from "react"

// ─── Types ────────────────────────────────────────────────────────────────

type ResizeDirection = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

interface SelectionHandlesProps {
  left: number
  top: number
  width: number
  height: number
  layerType: "image" | "text" | "button"
  layerName?: string
  canvasRect: DOMRect | null
  onResizeStart: (dir: ResizeDirection, e: React.MouseEvent) => void
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
    nw: { top: -10, left: -10, cursor: "nw-resize" },
    ne: { top: -10, right: -10, cursor: "ne-resize" },
    se: { bottom: -10, right: -10, cursor: "se-resize" },
    sw: { bottom: -10, left: -10, cursor: "sw-resize" },
  }

  return (
    <div
      className="absolute w-5 h-5 bg-white border-2 border-primary rounded-full z-50 hover:bg-primary/20 shadow-sm"
      style={{ ...positionMap[direction], pointerEvents: "auto" }}
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
      top: -4,
      left: "50%",
      transform: "translateX(-50%)",
      cursor: "n-resize",
      width: 40,
      height: 8,
    },
    s: {
      bottom: -4,
      left: "50%",
      transform: "translateX(-50%)",
      cursor: "s-resize",
      width: 40,
      height: 8,
    },
    e: {
      top: "50%",
      right: -4,
      transform: "translateY(-50%)",
      cursor: "e-resize",
      width: 8,
      height: 40,
    },
    w: {
      top: "50%",
      left: -4,
      transform: "translateY(-50%)",
      cursor: "w-resize",
      width: 8,
      height: 40,
    },
  }

  return (
    <div
      className="absolute bg-white border border-primary rounded-sm z-50 shadow-sm hover:bg-primary/20"
      style={{ ...positionMap[direction], pointerEvents: "auto" }}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onResizeStart(direction, e)
      }}
    />
  )
}

// ─── SelectionHandles Component ───────────────────────────────────────────

export function SelectionHandles({
  left,
  top,
  width,
  height,
  layerType,
  layerName,
  canvasRect,
  onResizeStart,
}: SelectionHandlesProps) {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 9999, pointerEvents: "none" }}
    >
      {/* Selection border + handles container */}
      <div
        className="absolute"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
      >
        {/* Selection border */}
        <div className="absolute inset-0 border-2 border-primary rounded-sm pointer-events-none" />

        {/* Corner handles */}
        <CornerHandle direction="nw" onResizeStart={onResizeStart} />
        <CornerHandle direction="ne" onResizeStart={onResizeStart} />
        <CornerHandle direction="se" onResizeStart={onResizeStart} />
        <CornerHandle direction="sw" onResizeStart={onResizeStart} />

        {/* Edge handles */}
        <EdgeHandle direction="n" onResizeStart={onResizeStart} />
        <EdgeHandle direction="e" onResizeStart={onResizeStart} />
        <EdgeHandle direction="s" onResizeStart={onResizeStart} />
        <EdgeHandle direction="w" onResizeStart={onResizeStart} />
      </div>

      {/* Type label — positioned above the selection */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          transform: "translateY(-100%)",
        }}
      >
        <span className="inline-block px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-medium rounded capitalize">
          {layerType === "image" ? "🖼️" : layerType === "text" ? "📝" : "🔘"}{" "}
          {layerName || layerType} · {Math.round(width)}%×{Math.round(height)}%
        </span>
      </div>
    </div>
  )
}
