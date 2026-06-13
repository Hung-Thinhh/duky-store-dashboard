"use client"

import * as React from "react"
import { IconPhoto, IconDeviceMobile } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { SlideData, SlideLayer, ViewportMode } from "@/app/(dashboard)/hero-slider/types"

// ─── Types ────────────────────────────────────────────────────────────────

interface PropertiesPanelProps {
  slide: SlideData
  selectedLayerIndex: number | null
  viewport: ViewportMode
  onUpdateLayer: (layerIndex: number, updater: (l: SlideLayer) => SlideLayer) => void
  onPickMedia: (layerIndex: number, type: "layer" | "mobile") => void
  onStartGradientEdit?: () => void
}

// ─── Image Properties ─────────────────────────────────────────────────────

function ImageProperties({
  layer,
  onUpdate,
  onPickMedia,
}: {
  layer: SlideLayer
  onUpdate: (updater: (l: SlideLayer) => SlideLayer) => void
  onPickMedia: (type: "layer" | "mobile") => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Ảnh</Label>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onPickMedia("layer")} className="rounded-lg flex-1">
            <IconPhoto className="size-3 mr-1" />
            {layer.src ? "Đổi ảnh" : "Chọn ảnh"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPickMedia("mobile")} className="rounded-lg">
            <IconDeviceMobile className="size-3" />
          </Button>
        </div>
        {layer.src && (
          <img src={layer.src} alt="" className="w-full h-20 object-cover rounded-lg border" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Object Fit</Label>
          <Select value={layer.objectFit ?? ""} onValueChange={(v) => onUpdate((l) => ({ ...l, objectFit: v as "cover" | "contain" }))}>
            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="contain">Contain</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Object Position</Label>
          <Input value={layer.objectPosition ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, objectPosition: e.target.value || undefined }))} placeholder="center" className="h-8 text-xs rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Gradient Editor Helper ──────────────────────────────────────────────

function GradientEditor({
  layer,
  onChange,
  onStartGradientEdit,
}: {
  layer: SlideLayer
  onChange: (updater: (l: SlideLayer) => SlideLayer) => void
  onStartGradientEdit?: () => void
}) {
  const useGradient = layer.useGradient ?? false
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

  const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(", ")
  const previewBackground =
    type === "radial"
      ? `radial-gradient(circle, ${stopsStr})`
      : `linear-gradient(90deg, ${stopsStr})`

  const toggleGradient = (val: boolean) => {
    onChange((l) => ({
      ...l,
      useGradient: val,
      gradientType: "linear",
      gradientAngle: l.gradientAngle ?? 135,
      gradientStops: l.gradientStops ?? [
        { id: `stop-0-${Date.now()}`, color: "#101114", position: 0 },
        { id: `stop-1-${Date.now()}`, color: "#70737a", position: 100 },
      ],
    }))
  }

  const updateStop = (id: string, field: "color" | "position", value: any) => {
    onChange((l) => {
      const currentStops = (l.gradientStops ?? rawStops).map((s, idx) => ({
        id: s.id ?? `stop-${idx}`,
        color: s.color,
        position: s.position,
      }))
      const idx = currentStops.findIndex((s) => s.id === id)
      if (idx !== -1) {
        currentStops[idx] = {
          ...currentStops[idx],
          [field]: field === "position" ? Number(value) : value,
        }
        currentStops.sort((a, b) => a.position - b.position)
      }
      return { ...l, gradientStops: currentStops }
    })
  }

  const addStop = () => {
    onChange((l) => {
      const currentStops = (l.gradientStops ?? rawStops).map((s, idx) => ({
        id: s.id ?? `stop-${idx}-${Date.now()}`,
        color: s.color,
        position: s.position,
      }))
      currentStops.sort((a, b) => a.position - b.position)

      const len = currentStops.length
      if (len >= 1) {
        const lastStop = currentStops[len - 1]
        const secondLastPos = len >= 2 ? currentStops[len - 2].position : 0
        lastStop.position = Math.round(secondLastPos + (100 - secondLastPos) / 2)
      }
      currentStops.push({
        id: `stop-new-${Date.now()}`,
        color: "#70737a",
        position: 100,
      })

      currentStops.sort((a, b) => a.position - b.position)
      return { ...l, gradientStops: currentStops }
    })
  }

  const removeStop = (id: string) => {
    onChange((l) => {
      const currentStops = (l.gradientStops ?? rawStops).map((s, idx) => ({
        id: s.id ?? `stop-${idx}`,
        color: s.color,
        position: s.position,
      }))
      if (currentStops.length <= 2) return l
      const idx = currentStops.findIndex((s) => s.id === id)
      if (idx !== -1) {
        currentStops.splice(idx, 1)
      }
      return { ...l, gradientStops: currentStops }
    })
  }

  return (
    <div
      className="space-y-3 border-t pt-3 mt-3"
      onClickCapture={onStartGradientEdit}
      onFocusCapture={onStartGradientEdit}
    >
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Kiểu màu</Label>
        <div className="flex bg-muted p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => toggleGradient(false)}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              !useGradient ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đơn sắc
          </button>
          <button
            type="button"
            onClick={() => toggleGradient(true)}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              useGradient ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gradient
          </button>
        </div>
      </div>

      {useGradient && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Góc quay ({angle}°)</Label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => onChange((l) => ({ ...l, gradientAngle: Number(e.target.value) }))}
                className="flex-1 h-1 accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Thanh màu xem trước</Label>
            <div
              className="h-5 w-full rounded-lg border shadow-inner"
              style={{ background: previewBackground }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Điểm màu (Stops)</Label>
              <Button size="icon" variant="ghost" className="size-5 rounded-md hover:bg-muted" onClick={addStop}>
                <span className="text-sm font-bold">+</span>
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {stops.map((stop) => (
                <div key={stop.id} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                    className="size-5 rounded cursor-pointer border shrink-0"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(e) => updateStop(stop.id, "position", e.target.value)}
                      className="flex-1 h-1 accent-primary cursor-pointer"
                    />
                    <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">{stop.position}%</span>
                  </div>
                  {stops.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5 text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                      onClick={() => removeStop(stop.id)}
                    >
                      <span className="text-[10px] font-bold">−</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Text Properties ──────────────────────────────────────────────────────

function TextProperties({
  layer,
  onUpdate,
  onStartGradientEdit,
}: {
  layer: SlideLayer
  onUpdate: (updater: (l: SlideLayer) => SlideLayer) => void
  onStartGradientEdit?: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">Nội dung</Label>
        <Textarea
          value={layer.content ?? ""}
          onChange={(e) => onUpdate((l) => ({ ...l, content: e.target.value }))}
          placeholder="Nhập văn bản..."
          className="min-h-[80px] text-xs rounded-lg"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Phông chữ</Label>
        <Select value={layer.fontFamily ?? "montserrat"} onValueChange={(v) => onUpdate((l) => ({ ...l, fontFamily: v as "montserrat" | "playfair" }))}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="montserrat">Montserrat (Không chân)</SelectItem>
            <SelectItem value="playfair">Playfair Display (Có chân)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Font Size (px)</Label>
          <Input
            type="number"
            value={layer.fontSize ?? 24}
            onChange={(e) => onUpdate((l) => ({ ...l, fontSize: Number(e.target.value) }))}
            className="h-8 text-xs rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Font Weight</Label>
          <Select value={String(layer.fontWeight ?? 400)} onValueChange={(v) => onUpdate((l) => ({ ...l, fontWeight: Number(v) }))}>
            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="300">Light (300)</SelectItem>
              <SelectItem value="400">Regular (400)</SelectItem>
              <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semi Bold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {!layer.useGradient && (
          <div className="space-y-1">
            <Label className="text-xs">Màu chữ</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={layer.color ?? "#101114"} onChange={(e) => onUpdate((l) => ({ ...l, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
              <Input value={layer.color ?? "#101114"} onChange={(e) => onUpdate((l) => ({ ...l, color: e.target.value }))} className="h-8 text-xs rounded-lg font-mono" />
            </div>
          </div>
        )}
        <div className={`space-y-1 ${layer.useGradient ? "col-span-2" : ""}`}>
          <Label className="text-xs">Căn lề</Label>
          <Select value={layer.textAlign ?? "left"} onValueChange={(v) => onUpdate((l) => ({ ...l, textAlign: v as "left" | "center" | "right" }))}>
            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="left">Trái</SelectItem>
              <SelectItem value="center">Giữa</SelectItem>
              <SelectItem value="right">Phải</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <GradientEditor layer={layer} onChange={onUpdate} onStartGradientEdit={onStartGradientEdit} />

      {/* Text Effects */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Letter Spacing (px)</Label>
          <Input type="number" step="0.5" value={layer.letterSpacing ?? 0} onChange={(e) => onUpdate((l) => ({ ...l, letterSpacing: Number(e.target.value) }))} className="h-8 text-xs rounded-lg" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Line Height</Label>
          <Input type="number" step="0.1" value={layer.lineHeight ?? 1.3} onChange={(e) => onUpdate((l) => ({ ...l, lineHeight: Number(e.target.value) }))} className="h-8 text-xs rounded-lg" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Text Shadow</Label>
        <Select value={layer.textShadow || "none"} onValueChange={(v) => onUpdate((l) => ({ ...l, textShadow: v === "none" ? undefined : v }))}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="1px 1px 2px rgba(0,0,0,0.3)">Subtle</SelectItem>
            <SelectItem value="2px 2px 4px rgba(0,0,0,0.5)">Medium</SelectItem>
            <SelectItem value="0 0 10px rgba(0,0,0,0.5)">Blur</SelectItem>
            <SelectItem value="1px 1px 0 rgba(0,0,0,0.8)">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Button Properties ────────────────────────────────────────────────────

function ButtonProperties({
  layer,
  onUpdate,
  onStartGradientEdit,
}: {
  layer: SlideLayer
  onUpdate: (updater: (l: SlideLayer) => SlideLayer) => void
  onStartGradientEdit?: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">Nhãn nút</Label>
        <Input value={layer.label ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, label: e.target.value }))} placeholder="Xem thêm" className="h-8 text-xs rounded-lg" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Link</Label>
        <Input value={layer.link ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, link: e.target.value }))} placeholder="/san-pham" className="h-8 text-xs rounded-lg" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Kiểu nút</Label>
        <Select value={layer.variant ?? "primary"} onValueChange={(v) => onUpdate((l) => ({ ...l, variant: v as "primary" | "secondary" }))}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="primary">Primary (đen)</SelectItem>
            <SelectItem value="secondary">Secondary (viền)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Phông chữ</Label>
        <Select value={layer.fontFamily ?? "montserrat"} onValueChange={(v) => onUpdate((l) => ({ ...l, fontFamily: v as "montserrat" | "playfair" }))}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="montserrat">Montserrat (Không chân)</SelectItem>
            <SelectItem value="playfair">Playfair Display (Có chân)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {!layer.useGradient && (
          <div className="space-y-1">
            <Label className="text-xs">Màu nền</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={layer.buttonColor ?? "#101114"} onChange={(e) => onUpdate((l) => ({ ...l, buttonColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
              <Input value={layer.buttonColor ?? "#101114"} onChange={(e) => onUpdate((l) => ({ ...l, buttonColor: e.target.value }))} className="h-8 text-xs rounded-lg font-mono" />
            </div>
          </div>
        )}
        <div className={`space-y-1 ${layer.useGradient ? "col-span-2" : ""}`}>
          <Label className="text-xs">Màu chữ</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={layer.textColor ?? "#ffffff"} onChange={(e) => onUpdate((l) => ({ ...l, textColor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border" />
            <Input value={layer.textColor ?? "#ffffff"} onChange={(e) => onUpdate((l) => ({ ...l, textColor: e.target.value }))} className="h-8 text-xs rounded-lg font-mono" />
          </div>
        </div>
      </div>

      <GradientEditor layer={layer} onChange={onUpdate} onStartGradientEdit={onStartGradientEdit} />
    </div>
  )
}

// ─── Layout Properties ────────────────────────────────────────────────────

function LayoutProperties({
  layer,
  onUpdate,
}: {
  layer: SlideLayer
  onUpdate: (updater: (l: SlideLayer) => SlideLayer) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Vị trí (%)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Left</Label>
            <Input value={layer.left ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, left: e.target.value || undefined }))} placeholder="auto" className="h-8 text-xs rounded-lg" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Top</Label>
            <Input value={layer.top ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, top: e.target.value || undefined }))} placeholder="auto" className="h-8 text-xs rounded-lg" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Kích thước (%)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Width</Label>
            <Input value={layer.width ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, width: e.target.value || undefined }))} placeholder="auto" className="h-8 text-xs rounded-lg" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Height</Label>
            <Input value={layer.height ?? ""} onChange={(e) => onUpdate((l) => ({ ...l, height: e.target.value || undefined }))} placeholder="auto" className="h-8 text-xs rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Z-Index</Label>
          <Input type="number" value={layer.zIndex} onChange={(e) => onUpdate((l) => ({ ...l, zIndex: Number(e.target.value) }))} className="h-8 text-xs rounded-lg" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hiển thị</Label>
          <Select value={layer.display ?? "block"} onValueChange={(v) => onUpdate((l) => ({ ...l, display: v }))}>
            <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="block">Hiện</SelectItem>
              <SelectItem value="none">Ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── Main Properties Panel ─────────────────────────────────────────────────

export function PropertiesPanel({
  slide,
  selectedLayerIndex,
  viewport,
  onUpdateLayer,
  onPickMedia,
  onStartGradientEdit,
}: PropertiesPanelProps) {
  const currentLayers = slide.layers[viewport] ?? []
  const selectedLayer = selectedLayerIndex !== null ? currentLayers[selectedLayerIndex] : null
  const updateSelectedLayer = (updater: (l: SlideLayer) => SlideLayer) => {
    if (selectedLayerIndex !== null) onUpdateLayer(selectedLayerIndex, updater)
  }

  if (!selectedLayer) return null

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {selectedLayer.name || selectedLayer.type}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content" className="gap-3">
          <TabsList className="rounded-lg w-full h-8">
            <TabsTrigger value="content" className="text-[10px] rounded-lg flex-1">Content</TabsTrigger>
            <TabsTrigger value="layout" className="text-[10px] rounded-lg flex-1">Layout</TabsTrigger>
            <TabsTrigger value="animation" className="text-[10px] rounded-lg flex-1">Animation</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-3 mt-2">
            {selectedLayer.type === "image" && (
              <ImageProperties
                layer={selectedLayer}
                onUpdate={updateSelectedLayer}
                onPickMedia={(type) => onPickMedia(selectedLayerIndex!, type)}
              />
            )}
            {selectedLayer.type === "text" && (
              <TextProperties layer={selectedLayer} onUpdate={updateSelectedLayer} onStartGradientEdit={onStartGradientEdit} />
            )}
            {selectedLayer.type === "button" && (
              <ButtonProperties layer={selectedLayer} onUpdate={updateSelectedLayer} onStartGradientEdit={onStartGradientEdit} />
            )}
          </TabsContent>

          <TabsContent value="layout" className="mt-2">
            <LayoutProperties layer={selectedLayer} onUpdate={updateSelectedLayer} />
          </TabsContent>

          <TabsContent value="animation" className="mt-2">
            <div className="space-y-5">
              {/* ── Section 1: Entrance Animation (when slide appears) ── */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Chuyển slide</Label>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Kiểu</Label>
                  <Select
                    value={selectedLayer.entranceAnimation?.type ?? "none"}
                    onValueChange={(v) =>
                      updateSelectedLayer((l) => ({
                        ...l,
                        entranceAnimation: v === "none"
                          ? undefined
                          : { type: v as any, duration: l.entranceAnimation?.duration ?? 500, delay: l.entranceAnimation?.delay ?? 0 },
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Không</SelectItem>
                      <SelectItem value="fade">Hiện dần</SelectItem>
                      <SelectItem value="slide-left">Lướt từ trái qua</SelectItem>
                      <SelectItem value="slide-right">Lướt từ phải qua</SelectItem>
                      <SelectItem value="slide-up">Lướt từ dưới lên</SelectItem>
                      <SelectItem value="slide-down">Lướt từ trên xuống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedLayer.entranceAnimation && selectedLayer.entranceAnimation.type !== "none" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Thời lượng (ms)</Label>
                      <Input type="number" step="50" value={selectedLayer.entranceAnimation.duration} onChange={(e) => updateSelectedLayer((l) => ({ ...l, entranceAnimation: { ...l.entranceAnimation!, duration: Number(e.target.value) } }))} className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Trì hoãn (ms)</Label>
                      <Input type="number" step="50" value={selectedLayer.entranceAnimation.delay} onChange={(e) => updateSelectedLayer((l) => ({ ...l, entranceAnimation: { ...l.entranceAnimation!, delay: Number(e.target.value) } }))} className="h-8 text-xs rounded-lg" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 2: Continuous Animation (while slide is active) ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Chuyển động liên tục</Label>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedLayer((l) => {
                        if (l.float) {
                          const { float, ...rest } = l
                          return rest
                        }
                        return { ...l, float: { duration: 4, delay: 0, displacement: 8, direction: "down" } }
                      })
                    }
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${
                      selectedLayer.float ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block size-3.5 rounded-full bg-white transition-transform ${
                        selectedLayer.float ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {selectedLayer.float && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Kiểu</Label>
                      <div className="flex rounded-md border overflow-hidden">
                        {([
                          { value: "down" as const, label: "↓ Xuống" },
                          { value: "up" as const, label: "↑ Lên" },
                          { value: "right" as const, label: "→ Phải" },
                          { value: "left" as const, label: "← Trái" },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateSelectedLayer((l) => ({ ...l, float: { ...l.float!, direction: opt.value } }))}
                            className={`flex-1 py-1.5 text-[10px] transition-colors ${
                              (selectedLayer.float?.direction ?? "down") === opt.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Thời lượng (s)</Label>
                        <Input type="number" step="0.1" value={selectedLayer.float.duration} onChange={(e) => updateSelectedLayer((l) => ({ ...l, float: { ...l.float!, duration: Number(e.target.value) } }))} className="h-8 text-xs rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Trì hoãn (s)</Label>
                        <Input type="number" step="0.1" value={selectedLayer.float.delay} onChange={(e) => updateSelectedLayer((l) => ({ ...l, float: { ...l.float!, delay: Number(e.target.value) } }))} className="h-8 text-xs rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Biên độ (px)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={30}
                          step={1}
                          value={selectedLayer.float.displacement || 8}
                          onChange={(e) => updateSelectedLayer((l) => ({ ...l, float: { ...l.float!, displacement: Number(e.target.value) } }))}
                          className="flex-1 h-1 accent-primary cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{selectedLayer.float.displacement || 8}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
