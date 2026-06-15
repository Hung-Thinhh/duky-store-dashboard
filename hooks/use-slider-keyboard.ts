"use client"

import * as React from "react"

// ─── Types ────────────────────────────────────────────────────────────────

interface UseSliderKeyboardOptions {
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onDeleteLayer: () => void
  onDuplicateLayer: () => void
  onNudgeLayer: (dx: number, dy: number) => void
  onEscape: () => void
  onCopy?: () => void
  onPaste?: () => void
  enabled?: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useSliderKeyboard({
  onUndo,
  onRedo,
  onSave,
  onDeleteLayer,
  onDuplicateLayer,
  onNudgeLayer,
  onEscape,
  onCopy,
  onPaste,
  enabled = true,
}: UseSliderKeyboardOptions) {
  React.useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      const isInput = tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable

      // Escape always works
      if (e.key === "Escape") {
        e.preventDefault()
        onEscape()
        return
      }

      // Ctrl/Cmd + key shortcuts (work even in inputs)
      const isMod = e.ctrlKey || e.metaKey

      if (isMod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        onUndo()
        return
      }

      if (isMod && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault()
        onRedo()
        return
      }

      if (isMod && e.key === "y") {
        e.preventDefault()
        onRedo()
        return
      }

      if (isMod && e.key === "s") {
        e.preventDefault()
        onSave()
        return
      }

      if (isMod && e.key === "d") {
        e.preventDefault()
        onDuplicateLayer()
        return
      }

      if (isMod && e.key.toLowerCase() === "c") {
        if (isInput) return
        e.preventDefault()
        onCopy?.()
        return
      }

      if (isMod && e.key.toLowerCase() === "v") {
        if (isInput) return
        e.preventDefault()
        onPaste?.()
        return
      }

      // Skip remaining shortcuts when focus is in an input
      if (isInput) return

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        onDeleteLayer()
        return
      }

      // Arrow keys — nudge
      const nudgeAmount = e.shiftKey ? 10 : 1
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onNudgeLayer(-nudgeAmount, 0)
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        onNudgeLayer(nudgeAmount, 0)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        onNudgeLayer(0, -nudgeAmount)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        onNudgeLayer(0, nudgeAmount)
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [enabled, onUndo, onRedo, onSave, onDeleteLayer, onDuplicateLayer, onNudgeLayer, onEscape, onCopy, onPaste])
}
