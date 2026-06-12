"use client"

import * as React from "react"
import { IconMinus, IconPlus, IconMaximize } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface ZoomControlsProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  onFit: () => void
}

export function ZoomControls({ zoom, onZoomChange, onFit }: ZoomControlsProps) {
  const percentage = Math.round(zoom * 100)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZoomChange(Number(e.target.value) / 100)
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-lg z-20">
      <Button
        size="icon"
        variant="ghost"
        className="size-6 rounded-full"
        onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
      >
        <IconMinus className="size-3" />
      </Button>

      <input
        type="range"
        min={10}
        max={300}
        step={1}
        value={percentage}
        onChange={handleSliderChange}
        className="w-24 h-1 accent-primary cursor-pointer"
      />

      <Button
        size="icon"
        variant="ghost"
        className="size-6 rounded-full"
        onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
      >
        <IconPlus className="size-3" />
      </Button>

      <span className="text-[10px] font-mono w-8 text-center text-muted-foreground">
        {percentage}%
      </span>

      <Button
        size="icon"
        variant="ghost"
        className="size-6 rounded-full"
        onClick={onFit}
        title="Fit to viewport"
      >
        <IconMaximize className="size-3" />
      </Button>
    </div>
  )
}
