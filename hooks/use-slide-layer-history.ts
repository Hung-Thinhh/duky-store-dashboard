"use client"

import * as React from "react"
import type { SlideData, SlideLayer, ViewportMode } from "@/app/(dashboard)/hero-slider/types"

// ─── Types ────────────────────────────────────────────────────────────────

interface HistoryEntry {
  viewport: ViewportMode
  layers: SlideLayer[]
}

interface LayerHistory {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

export interface UseSlideLayerHistoryReturn {
  undo: (slideId: string) => void
  redo: (slideId: string) => void
  canUndo: (slideId: string) => boolean
  canRedo: (slideId: string) => boolean
  pushSnapshot: (slideId: string, viewport: ViewportMode, oldLayers: SlideLayer[], newLayers: SlideLayer[]) => void
  saveDragSnapshot: (slideId: string, viewport: ViewportMode, layers: SlideLayer[]) => void
  pushDragEnd: (slideId: string, viewport: ViewportMode, finalLayers: SlideLayer[]) => void
  removeHistory: (slideId: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

// ─── Helpers ──────────────────────────────────────────────────────────────

function areLayersEqual(a: SlideLayer[], b: SlideLayer[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useSlideLayerHistory(
  slides: SlideData[],
  updateSlide: (index: number, updater: (s: SlideData) => SlideData) => void,
): UseSlideLayerHistoryReturn {
  const historiesRef = React.useRef<Map<string, LayerHistory>>(new Map())
  const dragSnapshotRef = React.useRef<Map<string, HistoryEntry>>(new Map())

  // Refs to avoid stale closures
  const slidesRef = React.useRef(slides)
  slidesRef.current = slides
  const updateSlideRef = React.useRef(updateSlide)
  updateSlideRef.current = updateSlide

  const getHistory = React.useCallback((slideId: string): LayerHistory => {
    if (!historiesRef.current.has(slideId)) {
      historiesRef.current.set(slideId, { past: [], future: [] })
    }
    return historiesRef.current.get(slideId)!
  }, [])

  const canUndo = React.useCallback(
    (slideId: string) => {
      const h = historiesRef.current.get(slideId)
      return !!h && h.past.length > 0
    },
    [],
  )

  const canRedo = React.useCallback(
    (slideId: string) => {
      const h = historiesRef.current.get(slideId)
      return !!h && h.future.length > 0
    },
    [],
  )

  const pushSnapshot = React.useCallback(
    (slideId: string, viewport: ViewportMode, oldLayers: SlideLayer[], newLayers: SlideLayer[]) => {
      if (!slideId) return
      if (areLayersEqual(oldLayers, newLayers)) return

      const h = getHistory(slideId)
      const past = [...h.past, { viewport, layers: oldLayers }]
      if (past.length > MAX_HISTORY) past.shift()
      h.past = past
      h.future = []
    },
    [getHistory],
  )

  const saveDragSnapshot = React.useCallback(
    (slideId: string, viewport: ViewportMode, layers: SlideLayer[]) => {
      if (!slideId) return
      dragSnapshotRef.current.set(slideId, { viewport, layers: JSON.parse(JSON.stringify(layers)) })
    },
    [],
  )

  const pushDragEnd = React.useCallback(
    (slideId: string, viewport: ViewportMode, finalLayers: SlideLayer[]) => {
      if (!slideId) return
      const snapshot = dragSnapshotRef.current.get(slideId)
      dragSnapshotRef.current.delete(slideId)

      if (!snapshot) return
      if (areLayersEqual(snapshot.layers, finalLayers)) return

      const h = getHistory(slideId)
      const past = [...h.past, { viewport: snapshot.viewport, layers: snapshot.layers }]
      if (past.length > MAX_HISTORY) past.shift()
      h.past = past
      h.future = []
    },
    [getHistory],
  )

  const undo = React.useCallback(
    (slideId: string) => {
      const h = historiesRef.current.get(slideId)
      if (!h || h.past.length === 0) return

      const currentSlides = slidesRef.current
      const idx = currentSlides.findIndex((s) => s.id === slideId)
      if (idx === -1) return

      const currentSlide = currentSlides[idx]
      if (!currentSlide) return

      const entry = h.past[h.past.length - 1]
      h.past = h.past.slice(0, -1)

      // Save current state for redo
      h.future = [{ viewport: entry.viewport, layers: currentSlide.layers[entry.viewport] }, ...h.future]

      // Restore
      updateSlideRef.current(idx, (s) => ({
        ...s,
        layers: { ...s.layers, [entry.viewport]: entry.layers },
      }))
    },
    [],
  )

  const redo = React.useCallback(
    (slideId: string) => {
      const h = historiesRef.current.get(slideId)
      if (!h || h.future.length === 0) return

      const currentSlides = slidesRef.current
      const idx = currentSlides.findIndex((s) => s.id === slideId)
      if (idx === -1) return

      const currentSlide = currentSlides[idx]
      if (!currentSlide) return

      const entry = h.future[0]
      h.future = h.future.slice(1)

      // Save current state for undo
      const past = [...h.past, { viewport: entry.viewport, layers: currentSlide.layers[entry.viewport] }]
      if (past.length > MAX_HISTORY) past.shift()
      h.past = past

      // Restore
      updateSlideRef.current(idx, (s) => ({
        ...s,
        layers: { ...s.layers, [entry.viewport]: entry.layers },
      }))
    },
    [],
  )

  const removeHistory = React.useCallback((slideId: string) => {
    historiesRef.current.delete(slideId)
    dragSnapshotRef.current.delete(slideId)
  }, [])

  return { undo, redo, canUndo, canRedo, pushSnapshot, saveDragSnapshot, pushDragEnd, removeHistory }
}
