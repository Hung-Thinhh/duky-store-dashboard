"use client"

import * as React from "react"
import { LayerNode } from "./LayerNode"
import { SelectionHandles } from "./SelectionHandles"
import { ZoomControls } from "./ZoomControls"
import type { SlideData, ViewportMode } from "@/app/(dashboard)/hero-slider/types"

// ─── Canonical canvas dimensions ──────────────────────────────────────────

const CANVAS_SIZES: Record<ViewportMode, { width: number; height: number }> = {
  desktop: { width: 1920, height: 900 },
  tablet:  { width: 768,  height: 954 },
  mobile:  { width: 390,  height: 664 },
}

function parsePercent(v: string | undefined, fallback: number): number {
  if (!v) return fallback
  const num = parseFloat(v)
  return isNaN(num) ? fallback : num
}

// ─── Props ────────────────────────────────────────────────────────────────

interface SliderCanvasProps {
  slide: SlideData
  viewport: ViewportMode
  selectedLayerIndex: number | null
  onSelectLayer: (index: number | null) => void
  onUpdateLayerPosition: (layerIndex: number, left: number, top: number) => void
  onUpdateLayerSize: (layerIndex: number, width: number, height: number) => void
  cropMode?: boolean
  cropRect?: { x: number; y: number; width: number; height: number }
  onCropRectChange?: (rect: { x: number; y: number; width: number; height: number }) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────

export function SliderCanvas({
  slide,
  viewport,
  selectedLayerIndex,
  onSelectLayer,
  onUpdateLayerPosition,
  onUpdateLayerSize,
  cropMode,
  cropRect,
  onCropRectChange,
  onDragStart,
  onDragEnd,
}: SliderCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(800)
  const [containerHeight, setContainerHeight] = React.useState(600)
  const [zoomScale, setZoomScale] = React.useState(1)
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 })
  const panState = React.useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)

  // Ref for onDragEnd to avoid stale closure in resize mouseup
  const onDragEndRef = React.useRef(onDragEnd)
  onDragEndRef.current = onDragEnd

  const canonical = CANVAS_SIZES[viewport]
  const baseScale = Math.min(containerWidth / canonical.width, containerHeight / canonical.height)
  const scaleFactor = baseScale * zoomScale
  const scaledWidth = canonical.width * scaleFactor
  const scaledHeight = canonical.height * scaleFactor
  const currentLayers = slide.layers[viewport] ?? []

  // Center the canvas when it's smaller than container
  const offsetX = Math.max(0, (containerWidth - scaledWidth) / 2) + panOffset.x
  const offsetY = Math.max(0, (containerHeight - scaledHeight) / 2) + panOffset.y

  // Track container size
  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
        setContainerHeight(containerRef.current.clientHeight)
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Reset zoom and pan when viewport changes
  React.useEffect(() => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
  }, [viewport])

  // Ctrl + wheel zoom — native listener with passive: false
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopPropagation()
      setZoomScale((prev) => {
        const delta = -e.deltaY * 0.002
        return Math.min(3, Math.max(0.1, prev + delta))
      })
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  // Pan: middle mouse button or Space + left mouse
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button for pan
    if (e.button === 1) {
      e.preventDefault()
      panState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!panState.current) return
        const dx = moveEvent.clientX - panState.current.startX
        const dy = moveEvent.clientY - panState.current.startY
        setPanOffset({
          x: panState.current.startPanX + dx,
          y: panState.current.startPanY + dy,
        })
      }

      const handleMouseUp = () => {
        panState.current = null
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
      }

      document.body.style.cursor = "grabbing"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return
    }

    // Left click on empty canvas → deselect
    if (e.button === 0) {
      onSelectLayer(null)
    }
  }

  // Fit canvas to viewport
  const handleFit = () => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Canvas rect for drag calculations
  const canvasRect = React.useMemo(() => {
    return {
      width: scaledWidth,
      height: scaledHeight,
      top: 0,
      left: 0,
      right: scaledWidth,
      bottom: scaledHeight,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect
  }, [scaledWidth, scaledHeight])

  // Resize handler for SelectionHandles
  const resizeDragState = React.useRef<{
    startX: number
    startY: number
    startLeft: number
    startTop: number
    startWidth: number
    startHeight: number
    direction: string
  } | null>(null)

  const handleResizeStart = React.useCallback(
    (dir: string, e: React.MouseEvent) => {
      if (selectedLayerIndex === null) return
      const sel = currentLayers[selectedLayerIndex]
      if (!sel) return

      resizeDragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: parsePercent(sel.left, 0),
        startTop: parsePercent(sel.top, 0),
        startWidth: parsePercent(sel.width, 50),
        startHeight: parsePercent(sel.height, 50),
        direction: dir,
      }
      onDragStart?.()

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeDragState.current || !canvasRect) return

        const dx =
          ((moveEvent.clientX - resizeDragState.current.startX) /
            canvasRect.width) *
          100
        const dy =
          ((moveEvent.clientY - resizeDragState.current.startY) /
            canvasRect.height) *
          100
        const d = resizeDragState.current.direction

        let newW = resizeDragState.current.startWidth
        let newH = resizeDragState.current.startHeight
        let newL = resizeDragState.current.startLeft
        let newT = resizeDragState.current.startTop

        if (d === "e" || d === "ne" || d === "se") {
          newW = Math.max(5, resizeDragState.current.startWidth + dx)
        }
        if (d === "w" || d === "nw" || d === "sw") {
          const clampedDx = Math.max(
            -resizeDragState.current.startLeft,
            Math.min(resizeDragState.current.startWidth - 5, dx),
          )
          newL = resizeDragState.current.startLeft + clampedDx
          newW = resizeDragState.current.startWidth - clampedDx
        }
        if (d === "s" || d === "se" || d === "sw") {
          newH = Math.max(5, resizeDragState.current.startHeight + dy)
        }
        if (d === "n" || d === "nw" || d === "ne") {
          const clampedDy = Math.max(
            -resizeDragState.current.startTop,
            Math.min(resizeDragState.current.startHeight - 5, dy),
          )
          newT = resizeDragState.current.startTop + clampedDy
          newH = resizeDragState.current.startHeight - clampedDy
        }

        onUpdateLayerSize(selectedLayerIndex, Math.round(newW), Math.round(newH))
        onUpdateLayerPosition(selectedLayerIndex, Math.round(newL), Math.round(newT))
      }

      const handleMouseUp = () => {
        resizeDragState.current = null
        onDragEndRef.current?.()
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [selectedLayerIndex, currentLayers, canvasRect, onUpdateLayerSize, onUpdateLayerPosition],
  )

  return (
    <div className="relative w-full h-full">
      {/* Scrollable canvas area */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto bg-muted/30"
        onMouseDown={handleCanvasMouseDown}
      >
      {/* Canvas */}
      <div
        className="absolute origin-top-left overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] font-montserrat"
        style={{
          width: `${canonical.width}px`,
          height: `${canonical.height}px`,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleFactor})`,
        }}
      >
        {/* Layers — all content (image, text, button) rendered as layers */}
        {[...currentLayers]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((layer, sortedIndex) => {
            const originalIndex = currentLayers.indexOf(layer)
            const layerW = parsePercent(layer.width, 50)
            const layerH = parsePercent(layer.height, 50)
            const layerRect = {
              width: scaledWidth * (layerW / 100),
              height: scaledHeight * (layerH / 100),
            }
            return (
              <LayerNode
                key={`${slide.id}-${originalIndex}`}
                layer={layer}
                canvasRect={canvasRect}
                isSelected={selectedLayerIndex === originalIndex}
                cropMode={cropMode && selectedLayerIndex === originalIndex && layer.type === "image"}
                cropRect={cropRect}
                onCropRectChange={onCropRectChange}
                layerRect={layerRect}
                onSelect={() => onSelectLayer(originalIndex)}
                onPositionChange={(left, top) =>
                  onUpdateLayerPosition(originalIndex, left, top)
                }
                onSizeChange={(width, height) =>
                  onUpdateLayerSize(originalIndex, width, height)
                }
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            )
          })}

        {/* Alignment guides — edge, center, and inter-layer alignment */}
        {selectedLayerIndex !== null &&
          (() => {
            const sel = currentLayers[selectedLayerIndex]
            if (!sel) return null
            const left = parseFloat(sel.left ?? "999")
            const top = parseFloat(sel.top ?? "999")
            const w = parseFloat(sel.width ?? "0")
            const h = parseFloat(sel.height ?? "0")
            const centerX = left + w / 2
            const centerY = top + h / 2
            const right = left + w
            const bottom = top + h

            const SNAP_THRESHOLD = 1
            const guides: Array<{ key: string; style: React.CSSProperties }> = []

            // Canvas edge snaps
            if (Math.round(left) === 0) {
              guides.push({ key: "edge-left", style: { position: "absolute", top: 0, left: 0, height: "100%", width: 2, background: "#22c55e", zIndex: 50, pointerEvents: "none" } })
            }
            if (Math.round(top) === 0) {
              guides.push({ key: "edge-top", style: { position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: "#22c55e", zIndex: 50, pointerEvents: "none" } })
            }
            if (Math.round(right) === 100) {
              guides.push({ key: "edge-right", style: { position: "absolute", top: 0, right: 0, height: "100%", width: 2, background: "#22c55e", zIndex: 50, pointerEvents: "none" } })
            }
            if (Math.round(bottom) === 100) {
              guides.push({ key: "edge-bottom", style: { position: "absolute", bottom: 0, left: 0, width: "100%", height: 2, background: "#22c55e", zIndex: 50, pointerEvents: "none" } })
            }

            // Canvas center snaps (50%)
            if (Math.abs(centerX - 50) < SNAP_THRESHOLD) {
              guides.push({ key: "center-v", style: { position: "absolute", top: 0, left: "50%", height: "100%", width: 1, background: "#3b82f6", zIndex: 50, pointerEvents: "none", transform: "translateX(-50%)" } })
            }
            if (Math.abs(centerY - 50) < SNAP_THRESHOLD) {
              guides.push({ key: "center-h", style: { position: "absolute", top: "50%", left: 0, width: "100%", height: 1, background: "#3b82f6", zIndex: 50, pointerEvents: "none", transform: "translateY(-50%)" } })
            }

            // Inter-layer alignment
            currentLayers.forEach((other, otherIdx) => {
              if (otherIdx === selectedLayerIndex) return
              const oLeft = parseFloat(other.left ?? "999")
              const oTop = parseFloat(other.top ?? "999")
              const oW = parseFloat(other.width ?? "0")
              const oH = parseFloat(other.height ?? "0")
              const oCenterX = oLeft + oW / 2
              const oCenterY = oTop + oH / 2
              const oRight = oLeft + oW
              const oBottom = oTop + oH

              // Left-to-left
              if (Math.abs(left - oLeft) < SNAP_THRESHOLD) {
                guides.push({ key: `ll-${otherIdx}`, style: { position: "absolute", top: 0, left: `${oLeft}%`, height: "100%", width: 1, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Right-to-right
              if (Math.abs(right - oRight) < SNAP_THRESHOLD) {
                guides.push({ key: `rr-${otherIdx}`, style: { position: "absolute", top: 0, left: `${oRight}%`, height: "100%", width: 1, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Center-to-center X
              if (Math.abs(centerX - oCenterX) < SNAP_THRESHOLD) {
                guides.push({ key: `ccx-${otherIdx}`, style: { position: "absolute", top: 0, left: `${oCenterX}%`, height: "100%", width: 1, background: "#a855f7", zIndex: 50, pointerEvents: "none", opacity: 0.6 } })
              }
              // Top-to-top
              if (Math.abs(top - oTop) < SNAP_THRESHOLD) {
                guides.push({ key: `tt-${otherIdx}`, style: { position: "absolute", top: `${oTop}%`, left: 0, width: "100%", height: 1, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Bottom-to-bottom
              if (Math.abs(bottom - oBottom) < SNAP_THRESHOLD) {
                guides.push({ key: `bb-${otherIdx}`, style: { position: "absolute", top: `${oBottom}%`, left: 0, width: "100%", height: 1, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Center-to-center Y
              if (Math.abs(centerY - oCenterY) < SNAP_THRESHOLD) {
                guides.push({ key: `ccy-${otherIdx}`, style: { position: "absolute", top: `${oCenterY}%`, left: 0, width: "100%", height: 1, background: "#a855f7", zIndex: 50, pointerEvents: "none", opacity: 0.6 } })
              }
            })

            return guides.map((g) => <div key={g.key} style={g.style} />)
          })()}
        {/* Selection handles — always on top (zIndex: 9999) */}
        {selectedLayerIndex !== null &&
          !cropMode &&
          (() => {
            const sel = currentLayers[selectedLayerIndex]
            if (!sel) return null
            return (
              <SelectionHandles
                left={parsePercent(sel.left, 0)}
                top={parsePercent(sel.top, 0)}
                width={parsePercent(sel.width, 50)}
                height={parsePercent(sel.height, 50)}
                layerType={sel.type}
                layerName={sel.name}
                canvasRect={canvasRect}
                onResizeStart={handleResizeStart}
              />
            )
          })()}
      </div>
      </div>

      {/* Zoom Controls — outside scrollable area, stays fixed on screen */}
      <ZoomControls
        zoom={zoomScale}
        onZoomChange={setZoomScale}
        onFit={handleFit}
      />
    </div>
  )
}
