"use client"

import * as React from "react"
import { LayerNode } from "./LayerNode"
import { SelectionHandles } from "./SelectionHandles"
import { ZoomControls } from "./ZoomControls"
import { GradientHandles } from "./GradientHandles"
import type { SlideData, SlideLayer, ViewportMode } from "@/app/(dashboard)/hero-slider/types"

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
  selectedLayerIndices?: number[]
  onSelectLayers?: (indices: number[]) => void
  onUpdateLayerPosition: (layerIndex: number, left: number, top: number) => void
  onUpdateLayerSize: (layerIndex: number, width: number, height: number) => void
  onUpdateLayerDirect?: (layerIndex: number, updater: (l: SlideLayer) => SlideLayer) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  zoomScale: number
  onZoomScaleChange: React.Dispatch<React.SetStateAction<number>>
  panOffset: { x: number; y: number }
  onPanOffsetChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  showGradientHandles?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────

export function SliderCanvas({
  slide,
  viewport,
  selectedLayerIndex,
  onSelectLayer,
  selectedLayerIndices,
  onSelectLayers,
  onUpdateLayerPosition,
  onUpdateLayerSize,
  onUpdateLayerDirect,
  onDragStart,
  onDragEnd,
  zoomScale,
  onZoomScaleChange,
  panOffset,
  onPanOffsetChange,
  showGradientHandles,
}: SliderCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(800)
  const [containerHeight, setContainerHeight] = React.useState(600)
  const [isDragging, setIsDragging] = React.useState(false)

  const activeIndices = selectedLayerIndices ?? (selectedLayerIndex !== null ? [selectedLayerIndex] : [])

  const handleSelectLayers = React.useCallback((indices: number[]) => {
    if (onSelectLayers) {
      onSelectLayers(indices)
    } else {
      onSelectLayer(indices.length > 0 ? indices[0] : null)
    }
  }, [onSelectLayers, onSelectLayer])
  const panState = React.useRef<{ startX: number; startY: number; startScrollLeft: number; startScrollTop: number } | null>(null)

  // Ref for onDragEnd to avoid stale closure in resize mouseup
  const onDragEndRef = React.useRef(onDragEnd)
  onDragEndRef.current = onDragEnd

  const canonical = CANVAS_SIZES[viewport]
  const baseScale = Math.min(containerWidth / canonical.width, containerHeight / canonical.height)
  const scaleFactor = baseScale * zoomScale
  const scaledWidth = canonical.width * scaleFactor
  const scaledHeight = canonical.height * scaleFactor
  const currentLayers = slide.layers[viewport] ?? []

  // Center scroll container when panOffset is reset to 0,0 (e.g. onFit or viewport change)
  React.useEffect(() => {
    if (panOffset.x === 0 && panOffset.y === 0 && containerRef.current) {
      const container = containerRef.current
      setTimeout(() => {
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
        container.scrollTop = (container.scrollHeight - container.clientHeight) / 2
      }, 0)
    }
  }, [panOffset, scaleFactor, viewport])

  // Center the canvas when it's smaller than container
  const offsetX = Math.max(0, (containerWidth - scaledWidth) / 2) + panOffset.x
  const offsetY = Math.max(0, (containerHeight - scaledHeight) / 2) + panOffset.y

  // Track container size
  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
        setContainerHeight(containerRef.current.offsetHeight)
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Reset zoom and pan when viewport changes - handled in parent page.tsx

  // Ctrl + wheel zoom — native listener with passive: false
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopPropagation()
      onZoomScaleChange((prev) => {
        const delta = -e.deltaY * 0.002
        return Math.min(3, Math.max(0.1, prev + delta))
      })
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [onZoomScaleChange])

  const [selectionBox, setSelectionBox] = React.useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  // Pan: middle mouse button or Space + left mouse
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button for pan
    if (e.button === 1) {
      e.preventDefault()
      if (!containerRef.current) return
      const container = containerRef.current
      panState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startScrollLeft: container.scrollLeft,
        startScrollTop: container.scrollTop,
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!panState.current) return
        const dx = moveEvent.clientX - panState.current.startX
        const dy = moveEvent.clientY - panState.current.startY
        container.scrollLeft = panState.current.startScrollLeft - dx
        container.scrollTop = panState.current.startScrollTop - dy
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

    // Left click on empty canvas → deselect or marquee select
    if (e.button === 0) {
      const target = e.target as HTMLElement
      if (target.closest("[data-drag-handle]") || target.closest(".cursor-move")) {
        return
      }

      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY

      setSelectionBox({
        startX,
        startY,
        currentX: startX,
        currentY: startY,
      })

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setSelectionBox((prev) =>
          prev
            ? {
                ...prev,
                currentX: moveEvent.clientX,
                currentY: moveEvent.clientY,
              }
            : null,
        )
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        const canvasEl = document.getElementById("slider-canvas-element")
        if (!canvasEl) {
          setSelectionBox(null)
          return
        }

        const canvasDomRect = canvasEl.getBoundingClientRect()
        const boxX = Math.min(startX, upEvent.clientX)
        const boxY = Math.min(startY, upEvent.clientY)
        const boxW = Math.abs(startX - upEvent.clientX)
        const boxH = Math.abs(startY - upEvent.clientY)

        if (boxW < 4 && boxH < 4) {
          handleSelectLayers([])
          setSelectionBox(null)
          return
        }

        const indices: number[] = []
        slide.layers[viewport].forEach((layer, i) => {
          const l = parsePercent(layer.left, 0)
          const t = parsePercent(layer.top, 0)
          const w = parsePercent(layer.width, 50)
          const h = parsePercent(layer.height, 50)

          const layerX = canvasDomRect.left + (l / 100) * canvasDomRect.width
          const layerY = canvasDomRect.top + (t / 100) * canvasDomRect.height
          const layerW = (w / 100) * canvasDomRect.width
          const layerH = (h / 100) * canvasDomRect.height

          if (
            layerX < boxX + boxW &&
            layerX + layerW > boxX &&
            layerY < boxY + boxH &&
            layerY + layerH > boxY
          ) {
            indices.push(i)
          }
        })

        if (upEvent.shiftKey || upEvent.ctrlKey || upEvent.metaKey) {
          const currentSelection = selectedLayerIndices ?? []
          const combined = [...currentSelection]
          indices.forEach((idx) => {
            if (!combined.includes(idx)) {
              combined.push(idx)
            } else {
              const indexToRemove = combined.indexOf(idx)
              combined.splice(indexToRemove, 1)
            }
          })
          handleSelectLayers(combined)
        } else {
          handleSelectLayers(indices)
        }

        setSelectionBox(null)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
  }

  // Fit canvas to viewport - handled in parent page.tsx

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
      setIsDragging(true)
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
        const isCorner = d === "nw" || d === "ne" || d === "se" || d === "sw"

        let newW = resizeDragState.current.startWidth
        let newH = resizeDragState.current.startHeight
        let newL = resizeDragState.current.startLeft
        let newT = resizeDragState.current.startTop

        if (isCorner) {
          const startW = resizeDragState.current.startWidth
          const startH = resizeDragState.current.startHeight
          const startL = resizeDragState.current.startLeft
          const startT = resizeDragState.current.startTop
          const aspectRatio = startH > 0 ? startW / startH : 1

          if (d === "se") {
            newW = Math.max(5, startW + dx)
            newH = newW / aspectRatio
          } else if (d === "sw") {
            const clampedDx = Math.max(-startL, Math.min(startW - 5, dx))
            newL = startL + clampedDx
            newW = startW - clampedDx
            newH = newW / aspectRatio
          } else if (d === "ne") {
            newW = Math.max(5, startW + dx)
            newH = newW / aspectRatio
            newT = startT + (startH - newH)
          } else if (d === "nw") {
            const clampedDx = Math.max(-startL, Math.min(startW - 5, dx))
            newL = startL + clampedDx
            newW = startW - clampedDx
            newH = newW / aspectRatio
            newT = startT + (startH - newH)
          }
        } else {
          if (d === "e") {
            newW = Math.max(5, resizeDragState.current.startWidth + dx)
          }
          if (d === "w") {
            const clampedDx = Math.max(
              -resizeDragState.current.startLeft,
              Math.min(resizeDragState.current.startWidth - 5, dx),
            )
            newL = resizeDragState.current.startLeft + clampedDx
            newW = resizeDragState.current.startWidth - clampedDx
          }
          if (d === "s") {
            newH = Math.max(5, resizeDragState.current.startHeight + dy)
          }
          if (d === "n") {
            const clampedDy = Math.max(
              -resizeDragState.current.startTop,
              Math.min(resizeDragState.current.startHeight - 5, dy),
            )
            newT = resizeDragState.current.startTop + clampedDy
            newH = resizeDragState.current.startHeight - clampedDy
          }
        }

        onUpdateLayerSize(selectedLayerIndex, Math.round(newW), Math.round(newH))
        onUpdateLayerPosition(selectedLayerIndex, Math.round(newL), Math.round(newT))
      }

      const handleMouseUp = () => {
        setIsDragging(false)
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
      {/* Visual selection marquee box */}
      {selectionBox && (
        <div
          className="fixed border border-primary/60 bg-primary/5 pointer-events-none z-[99999]"
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
            width: `${Math.abs(selectionBox.startX - selectionBox.currentX)}px`,
            height: `${Math.abs(selectionBox.startY - selectionBox.currentY)}px`,
          }}
        />
      )}

      {/* Scrollable canvas area */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto bg-muted/30"
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Spacer to define scroll bounds and center canvas when small */}
        <div
          className="flex min-w-full min-h-full p-16"
          style={{
            width: `${Math.max(containerWidth, scaledWidth + 128)}px`,
            height: `${Math.max(containerHeight, scaledHeight + 128)}px`,
          }}
        >
          {/* Canvas Wrapper */}
          <div
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              margin: "auto",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Canvas */}
            <div
              id="slider-canvas-element"
              className="absolute left-0 top-0 overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] font-montserrat"
              style={{
                width: `${canonical.width}px`,
                height: `${canonical.height}px`,
                transform: `scale(${scaleFactor})`,
                transformOrigin: "top left",
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
                isSelected={activeIndices.includes(originalIndex)}
                layerRect={layerRect}
                onSelect={(e) => {
                  if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    if (activeIndices.includes(originalIndex)) {
                      handleSelectLayers(activeIndices.filter((idx) => idx !== originalIndex))
                    } else {
                      handleSelectLayers([...activeIndices, originalIndex])
                    }
                  } else {
                    handleSelectLayers([originalIndex])
                  }
                }}
                onPositionChange={(left, top) =>
                  onUpdateLayerPosition(originalIndex, left, top)
                }
                onDragStart={() => {
                  setIsDragging(true)
                  onDragStart?.()
                }}
                onDragEnd={() => {
                  setIsDragging(false)
                  onDragEnd?.()
                }}
                onSizeChange={(width, height) =>
                  onUpdateLayerSize(originalIndex, width, height)
                }
              />
            )
          })}

        {/* Alignment guides — edge, center, and inter-layer alignment */}
        {isDragging &&
          selectedLayerIndex !== null &&
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
              guides.push({ key: "edge-left", style: { position: "absolute", top: 0, left: 0, height: "100%", width: 3, background: "#10b981", zIndex: 50, pointerEvents: "none" } })
            }
            if (Math.round(top) === 0) {
              guides.push({ key: "edge-top", style: { position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: "#10b981", zIndex: 50, pointerEvents: "none" } })
            }
            if (Math.round(right) === 100) {
              guides.push({ key: "edge-right", style: { position: "absolute", top: 0, right: 0, height: "100%", width: 3, background: "#10b981", zIndex: 50, pointerEvents: "none" } })
            }
            if (Math.round(bottom) === 100) {
              guides.push({ key: "edge-bottom", style: { position: "absolute", bottom: 0, left: 0, width: "100%", height: 3, background: "#10b981", zIndex: 50, pointerEvents: "none" } })
            }

            // Canvas center snaps (50%)
            if (Math.abs(centerX - 50) < SNAP_THRESHOLD) {
              guides.push({ key: "center-v", style: { position: "absolute", top: 0, left: "50%", height: "100%", width: 2, background: "#2563eb", zIndex: 50, pointerEvents: "none", transform: "translateX(-50%)" } })
            }
            if (Math.abs(centerY - 50) < SNAP_THRESHOLD) {
              guides.push({ key: "center-h", style: { position: "absolute", top: "50%", left: 0, width: "100%", height: 2, background: "#2563eb", zIndex: 50, pointerEvents: "none", transform: "translateY(-50%)" } })
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
                guides.push({ key: `ll-${otherIdx}`, style: { position: "absolute", top: 0, left: `${oLeft}%`, height: "100%", width: 2, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Right-to-right
              if (Math.abs(right - oRight) < SNAP_THRESHOLD) {
                guides.push({ key: `rr-${otherIdx}`, style: { position: "absolute", top: 0, left: `${oRight}%`, height: "100%", width: 2, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Center-to-center X
              if (Math.abs(centerX - oCenterX) < SNAP_THRESHOLD) {
                guides.push({ key: `ccx-${otherIdx}`, style: { position: "absolute", top: 0, left: `${oCenterX}%`, height: "100%", width: 2, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Top-to-top
              if (Math.abs(top - oTop) < SNAP_THRESHOLD) {
                guides.push({ key: `tt-${otherIdx}`, style: { position: "absolute", top: `${oTop}%`, left: 0, width: "100%", height: 2, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Bottom-to-bottom
              if (Math.abs(bottom - oBottom) < SNAP_THRESHOLD) {
                guides.push({ key: `bb-${otherIdx}`, style: { position: "absolute", top: `${oBottom}%`, left: 0, width: "100%", height: 2, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
              // Center-to-center Y
              if (Math.abs(centerY - oCenterY) < SNAP_THRESHOLD) {
                guides.push({ key: `ccy-${otherIdx}`, style: { position: "absolute", top: `${oCenterY}%`, left: 0, width: "100%", height: 2, background: "#a855f7", zIndex: 50, pointerEvents: "none" } })
              }
            })

            return guides.map((g) => <div key={g.key} style={g.style} />)
          })()}
        {/* Selection handles — always on top (zIndex: 9999) */}
        {selectedLayerIndex !== null &&
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

        {selectedLayerIndex !== null &&
          showGradientHandles &&
          onUpdateLayerDirect &&
          (() => {
            const sel = currentLayers[selectedLayerIndex]
            if (!sel || !sel.useGradient) return null
            const left = parsePercent(sel.left, 0)
            const top = parsePercent(sel.top, 0)
            const w = parsePercent(sel.width, 50)
            const h = parsePercent(sel.height, 50)
            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                  zIndex: 10000,
                }}
              >
                <GradientHandles
                  layer={sel}
                  onUpdateDirect={(updater) => onUpdateLayerDirect(selectedLayerIndex, updater)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </div>
            )
          })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
