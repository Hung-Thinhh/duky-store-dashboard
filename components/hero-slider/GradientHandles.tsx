"use client"

import * as React from "react"
import type { SlideLayer } from "@/app/(dashboard)/hero-slider/types"

// Ray-box intersection to stretch the line perfectly across the bounding box
function getBoxIntersection(cx: number, cy: number, dx: number, dy: number): { x: number; y: number } {
  let tMin = Infinity
  let intersect = { x: cx + dx, y: cy + dy }

  if (dx > 0) {
    const t = (1 - cx) / dx
    if (t < tMin) {
      tMin = t
      intersect = { x: 1, y: cy + t * dy }
    }
  } else if (dx < 0) {
    const t = -cx / dx
    if (t < tMin) {
      tMin = t
      intersect = { x: 0, y: cy + t * dy }
    }
  }

  if (dy > 0) {
    const t = (1 - cy) / dy
    if (t < tMin) {
      tMin = t
      intersect = { x: cx + t * dx, y: 1 }
    }
  } else if (dy < 0) {
    const t = -cy / dy
    if (t < tMin) {
      tMin = t
      intersect = { x: cx + t * dx, y: 0 }
    }
  }

  return intersect
}

interface GradientHandlesProps {
  layer: SlideLayer
  onUpdateDirect: (updater: (l: SlideLayer) => SlideLayer) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function GradientHandles({
  layer,
  onUpdateDirect,
  onDragStart,
  onDragEnd,
}: GradientHandlesProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(null)

  const type = layer.gradientType ?? "linear"
  const angle = layer.gradientAngle ?? 135
  const rawStops = layer.gradientStops ?? [
    { color: "#101114", position: 0 },
    { color: "#70737a", position: 100 },
  ]

  const stops = rawStops.map((s, idx) => ({
    id: s.id ?? `stop-${idx}`,
    color: s.color,
    position: s.position,
  }))
  stops.sort((a, b) => a.position - b.position)

  // Calculate direction vector from angle (CSS convention)
  const angleRad = (angle * Math.PI) / 180
  const dx = Math.sin(angleRad)
  const dy = -Math.cos(angleRad)

  // Compute intersections of the line passing through center (0.5, 0.5)
  // End point: intersection in direction of v
  const endPt = getBoxIntersection(0.5, 0.5, dx, dy)
  // Start point: intersection in direction of -v
  const startPt = getBoxIntersection(0.5, 0.5, -dx, -dy)

  const lineDx = endPt.x - startPt.x
  const lineDy = endPt.y - startPt.y
  const lineLengthSq = lineDx * lineDx + lineDy * lineDy

  // Start drag for handle A (start point) or B (end point) to rotate/adjust angle
  const handleDirectionDragStart = (e: React.MouseEvent, isEnd: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    onDragStart?.()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      // Normalized coordinates (0 to 1) of mouse
      const mouseX = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width))
      const mouseY = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height))

      // Compute vector from the opposite handle to mouse
      let vx = 0
      let vy = 0
      if (isEnd) {
        // Dragging endPt relative to startPt
        vx = mouseX - startPt.x
        vy = mouseY - startPt.y
      } else {
        // Dragging startPt relative to endPt (flip direction)
        vx = endPt.x - mouseX
        vy = endPt.y - mouseY
      }

      // Convert back to CSS angle
      let newAngle = Math.round((Math.atan2(vy, vx) * 180) / Math.PI + 90)
      newAngle = (newAngle + 360) % 360

      onUpdateDirect((l) => ({
        ...l,
        gradientAngle: newAngle,
      }))
    }

    const handleMouseUp = () => {
      onDragEnd?.()
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Drag a stop diamond along the line
  const handleStopDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedStopId(id)
    onDragStart?.()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current || lineLengthSq === 0) return
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = (moveEvent.clientX - rect.left) / rect.width
      const mouseY = (moveEvent.clientY - rect.top) / rect.height

      // Project mouse position onto the line segment startPt -> endPt
      const mx = mouseX - startPt.x
      const my = mouseY - startPt.y
      const dot = mx * lineDx + my * lineDy
      const t = Math.max(0, Math.min(1, dot / lineLengthSq))

      onUpdateDirect((l) => {
        const currentStops = (l.gradientStops ?? rawStops).map((s, idx) => ({
          id: s.id ?? `stop-${idx}`,
          color: s.color,
          position: s.position,
        }))
        const idx = currentStops.findIndex((s) => s.id === id)
        if (idx !== -1) {
          currentStops[idx] = {
            ...currentStops[idx],
            position: Math.round(t * 100),
          }
          currentStops.sort((a, b) => a.position - b.position)
        }
        return {
          ...l,
          gradientStops: currentStops,
        }
      })
    }

    const handleMouseUp = () => {
      onDragEnd?.()
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none pointer-events-none"
      style={{
        zIndex: 50,
      }}
    >
      {/* SVG overlay containing the line and connection segments */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {/* Shadow Line */}
        <line
          x1={`${startPt.x * 100}%`}
          y1={`${startPt.y * 100}%`}
          x2={`${endPt.x * 100}%`}
          y2={`${endPt.y * 100}%`}
          stroke="rgba(0, 0, 0, 0.25)"
          strokeWidth="3"
        />
        {/* Main Line */}
        <line
          x1={`${startPt.x * 100}%`}
          y1={`${startPt.y * 100}%`}
          x2={`${endPt.x * 100}%`}
          y2={`${endPt.y * 100}%`}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>

      {/* Start Handle (0%) */}
      <div
        className="absolute size-4 rounded-full border border-gray-400 bg-white shadow-md -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        style={{
          left: `${startPt.x * 100}%`,
          top: `${startPt.y * 100}%`,
        }}
        onMouseDown={(e) => handleDirectionDragStart(e, false)}
      >
        <div className="size-1.5 rounded-full bg-gray-500" />
      </div>

      {/* End Handle (100%) */}
      <div
        className="absolute size-4 rounded-full border border-gray-400 bg-white shadow-md -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        style={{
          left: `${endPt.x * 100}%`,
          top: `${endPt.y * 100}%`,
        }}
        onMouseDown={(e) => handleDirectionDragStart(e, true)}
      >
        <div className="size-1.5 rounded-full bg-gray-500" />
      </div>

      {/* Stops (Diamond Handles) */}
      {stops.map((stop) => {
        const t = stop.position / 100
        const x = startPt.x + t * lineDx
        const y = startPt.y + t * lineDy
        const isSelected = selectedStopId === stop.id

        return (
          <div
            key={stop.id}
            className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
            }}
          >
            <div
              className={`size-3.5 rotate-45 border shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                isSelected
                  ? "border-primary bg-primary ring-2 ring-primary/30"
                  : "border-gray-400 bg-white hover:border-primary"
              }`}
              style={{
                backgroundColor: stop.color,
              }}
              onMouseDown={(e) => handleStopDragStart(e, stop.id)}
            />
            {/* Tooltip showing position */}
            <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] px-1.5 py-0.5 rounded shadow border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono font-bold">
              {stop.position}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
