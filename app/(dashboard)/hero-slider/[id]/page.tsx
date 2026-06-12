"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { homepageService } from "@/lib/api/services/homepage.service"
import { type HomepageSection } from "@/lib/api/schemas/homepage.schema"
import { ContentStatus, HomepageSectionType } from "@/lib/api/schemas/enums"
import { type Media } from "@/lib/api/schemas/media.schema"
import { useSlideLayerHistory } from "@/hooks/use-slide-layer-history"
import { useSliderKeyboard } from "@/hooks/use-slider-keyboard"
import { TopToolbar } from "@/components/hero-slider/TopToolbar"
import { LeftSidebar } from "@/components/hero-slider/LeftSidebar"
import { SliderCanvas } from "@/components/hero-slider/SliderCanvas"
import { PropertiesPanel } from "@/components/hero-slider/PropertiesPanel"
import type { SlideData, SlideLayer, LayerType, ViewportMode } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────

const defaultSlide = (index: number): SlideData => ({
  id: `slide-${Date.now()}-${index}`,
  layers: { desktop: [], tablet: [], mobile: [] },
  text: {
    badge: "",
    title: "",
    tagline: "",
    buttons: [],
  },
})

const defaultLayer = (type: LayerType, zIndex = 0): SlideLayer => {
  const base: SlideLayer = {
    type,
    name: type === "image" ? "Ảnh mới" : type === "text" ? "Văn bản" : "Nút bấm",
    zIndex,
  }

  if (type === "image") {
    return {
      ...base,
      src: "",
      alt: "",
      objectFit: "contain",
      float: { duration: 4, delay: 0, displacement: 0, direction: "down" },
    }
  }

  if (type === "text") {
    return {
      ...base,
      content: "Nhập văn bản",
      fontSize: 24,
      fontWeight: 400,
      color: "#101114",
      textAlign: "left",
    }
  }

  // button
  return {
    ...base,
    label: "Xem thêm",
    link: "/",
    variant: "primary",
    buttonColor: "#101114",
    textColor: "#ffffff",
  }
}

// ─── Migration helpers ──────────────────────────────────────────────────

function flattenLayerForViewport(l: any, vp: string): SlideLayer {
  const layout = l.layout?.[vp] ?? {}
  return {
    type: l.type,
    name: l.name,
    zIndex: l.zIndex ?? 0,
    locked: l.locked,
    top: layout.top,
    left: layout.left,
    width: layout.width,
    height: layout.height,
    objectFit: layout.objectFit ?? l.objectFit,
    objectPosition: layout.objectPosition,
    display: layout.display,
    mediaId: l.mediaId,
    src: l.src,
    srcMobile: l.srcMobile,
    alt: l.alt,
    float: l.float,
    crop: l.crop?.[vp],
    content: l.content,
    fontSize: layout.fontSize ?? l.fontSize,
    fontWeight: l.fontWeight,
    color: l.color,
    fontFamily: l.fontFamily,
    textAlign: l.textAlign,
    textShadow: l.textShadow,
    letterSpacing: l.letterSpacing,
    lineHeight: l.lineHeight,
    label: l.label,
    link: l.link,
    variant: l.variant,
    buttonColor: l.buttonColor,
    textColor: l.textColor,
    entranceAnimation: l.entranceAnimation,
  }
}

function migrateOldSlide(old: any): SlideData {
  if (!old.layers) return old as SlideData

  // Per-viewport format (new): { desktop: [], tablet: [], mobile: [] }
  if (old.layers.desktop) {
    return old as SlideData
  }

  // Not an array and not per-viewport — skip migration
  if (!Array.isArray(old.layers)) return old as SlideData

  const needsMigration = old.layers.some(
    (l: any) => "role" in l && !("type" in l),
  )

  let sharedLayers: any[]

  if (needsMigration) {
    const migratedLayers: any[] = old.layers.map((l: any, i: number) => ({
      type: "image" as const,
      name: l.role || `Layer ${i + 1}`,
      zIndex: l.zIndex ?? i,
      src: l.src || "",
      mediaId: l.mediaId || "",
      srcMobile: l.srcMobile,
      alt: l.alt || "",
      objectFit: l.layout?.desktop?.objectFit || "contain",
      layout: l.layout,
      float: l.float,
    }))

    const textLayers: any[] = []
    let z = migratedLayers.length

    if (old.text?.badge) {
      textLayers.push({
        type: "text", name: "Badge", zIndex: z++, content: old.text.badge,
        fontSize: 14, fontWeight: 500, color: old.text.style?.badgeColor ?? "#70737a", textAlign: "left",
        layout: { desktop: { top: "100px", left: "100px" }, tablet: {}, mobile: {} },
      })
    }
    if (old.text?.title) {
      textLayers.push({
        type: "text", name: "Tiêu đề", zIndex: z++, content: old.text.title,
        fontSize: 48, fontWeight: 700, color: old.text.style?.titleColor ?? "#101114", textAlign: "left",
        layout: { desktop: { top: "130px", left: "100px" }, tablet: {}, mobile: {} },
      })
    }
    if (old.text?.tagline) {
      textLayers.push({
        type: "text", name: "Mô tả", zIndex: z++, content: old.text.tagline,
        fontSize: 16, fontWeight: 400, color: old.text.style?.taglineColor ?? "#5f646d", textAlign: "left",
        layout: { desktop: { top: "200px", left: "100px" }, tablet: {}, mobile: {} },
      })
    }
    if (old.text?.buttons) {
      for (const btn of old.text.buttons) {
        textLayers.push({
          type: "button", name: btn.label || "Nút", zIndex: z++,
          label: btn.label, link: btn.link, variant: btn.variant,
          buttonColor: btn.variant === "primary" ? "#101114" : "transparent",
          textColor: btn.variant === "primary" ? "#ffffff" : "#101114",
          layout: { desktop: { top: `${250 + textLayers.length * 50}px`, left: "100px" }, tablet: {}, mobile: {} },
        })
      }
    }

    sharedLayers = [...migratedLayers, ...textLayers]
  } else {
    sharedLayers = old.layers
  }

  // Flatten shared layers into per-viewport layers
  return {
    ...old,
    layers: {
      desktop: sharedLayers.map((l: any) => flattenLayerForViewport(l, "desktop")),
      tablet: sharedLayers.map((l: any) => flattenLayerForViewport(l, "tablet")),
      mobile: sharedLayers.map((l: any) => flattenLayerForViewport(l, "mobile")),
    },
  }
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function HeroSliderEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [section, setSection] = React.useState<HomepageSection | null>(null)
  const [slides, setSlides] = React.useState<SlideData[]>([])
  const [selectedSlideIndex, setSelectedSlideIndex] = React.useState(0)
  const [selectedLayerIndex, setSelectedLayerIndex] = React.useState<
    number | null
  >(null)
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = React.useState<{
    slideIndex: number
    layerIndex: number
    type: "layer" | "mobile"
  } | null>(null)
  const [propertiesOpen, setPropertiesOpen] = React.useState(false)
  const [cropMode, setCropMode] = React.useState(false)
  const [cropRect, setCropRect] = React.useState({ x: 10, y: 10, width: 80, height: 80 })

  const selectedSlide = slides[selectedSlideIndex] ?? null
  const selectedSlideId = selectedSlide?.id ?? ""
  const currentLayers = selectedSlide?.layers[viewport] ?? []
  const selectedLayer =
    selectedSlide && selectedLayerIndex !== null
      ? currentLayers[selectedLayerIndex]
      : null

  // Refs to avoid stale closures in callbacks
  const isCreatingRef = React.useRef(false)
  const selectedSlideRef = React.useRef(selectedSlide)
  selectedSlideRef.current = selectedSlide
  const selectedSlideIdRef = React.useRef(selectedSlideId)
  selectedSlideIdRef.current = selectedSlideId
  const selectedSlideIndexRef = React.useRef(selectedSlideIndex)
  selectedSlideIndexRef.current = selectedSlideIndex
  const selectedLayerIndexRef = React.useRef(selectedLayerIndex)
  selectedLayerIndexRef.current = selectedLayerIndex
  const viewportRef = React.useRef(viewport)
  viewportRef.current = viewport

  // Determine toolbar mode
  const toolbarMode: "default" | "layer" =
    selectedLayerIndex !== null ? "layer" : "default"

  // ─── Dirty tracking ──────────────────────────────────────────────────

  const savedSnapshotRef = React.useRef<string>("")
  const isDirty = JSON.stringify(slides) !== savedSnapshotRef.current && savedSnapshotRef.current !== ""

  React.useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // ─── Load ─────────────────────────────────────────────────────────────

  const loadSection = React.useCallback(async () => {
    try {
      setIsLoading(true)

      if (id === "new") {
        if (isCreatingRef.current) return
        isCreatingRef.current = true
        const created = await homepageService.createSection({
          type: HomepageSectionType.HERO,
          title: "Hero Slider",
          status: ContentStatus.DRAFT,
          sortOrder: 0,
          metadata: { slides: [defaultSlide(0)] },
        })
        setSection(created)
        setSlides([defaultSlide(0)])
        savedSnapshotRef.current = JSON.stringify([defaultSlide(0)])
        router.replace(`/hero-slider/${created.id}`, { scroll: false })
        return
      }

      const heroSection = await homepageService.getSection(id)

      if (heroSection) {
        setSection(heroSection)
        const metadata = heroSection.metadata as Record<string, any> | null
        if (
          metadata?.slides &&
          Array.isArray(metadata.slides) &&
          metadata.slides.length > 0
        ) {
          const loaded = metadata.slides.map(migrateOldSlide)
          setSlides(loaded)
          savedSnapshotRef.current = JSON.stringify(loaded)
        } else {
          console.log("[Load] No slides in metadata, using default")
          setSlides([defaultSlide(0)])
          savedSnapshotRef.current = JSON.stringify([defaultSlide(0)])
        }
      } else {
        console.log("[Load] heroSection is null, using default")
        setSection(null)
        setSlides([defaultSlide(0)])
        savedSnapshotRef.current = JSON.stringify([defaultSlide(0)])
      }
    } catch {
      setSlides([defaultSlide(0)])
      savedSnapshotRef.current = JSON.stringify([defaultSlide(0)])
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    loadSection()
  }, [loadSection])

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    // Validation
    const errors: string[] = []
    if (slides.length > 15) {
      errors.push("Tối đa 15 slides.")
    }
    slides.forEach((slide, i) => {
      ;(["desktop", "tablet", "mobile"] as ViewportMode[]).forEach((vp) => {
        slide.layers[vp].forEach((layer, j) => {
          if (layer.type === "image" && !layer.src) {
            errors.push(`Slide ${i + 1} [${vp}], Layer "${layer.name || `Layer ${j + 1}`}": Chưa có ảnh.`)
          }
          if (layer.type === "button" && !layer.link) {
            errors.push(`Slide ${i + 1} [${vp}], Layer "${layer.name || `Layer ${j + 1}`}": Nút bấm chưa có link.`)
          }
        })
      })
    })
    if (errors.length > 0) {
      alert("Lỗi validation:\n\n" + errors.join("\n"))
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        type: HomepageSectionType.HERO,
        title: section?.title || "Hero Slider",
        status: section?.status || ContentStatus.PUBLISHED,
        sortOrder: section?.sortOrder ?? 0,
        metadata: { slides },
      }

      if (section?.id) {
        const result = await homepageService.updateSection(section.id, payload)
      }
      savedSnapshotRef.current = JSON.stringify(slides)
      alert("Đã lưu hero slider!")
    } catch {
      alert("Lưu thất bại.")
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Slide Operations ─────────────────────────────────────────────────

  const addSlide = () => {
    setSlides((prev) => [...prev, defaultSlide(prev.length)])
    setSelectedSlideIndex(slides.length)
    setSelectedLayerIndex(null)
  }

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return
    const slideId = slides[index]?.id
    setSlides((prev) => prev.filter((_, i) => i !== index))
    if (slideId) layerHistory.removeHistory(slideId)
    if (selectedSlideIndex >= slides.length - 1) {
      setSelectedSlideIndex(Math.max(0, slides.length - 2))
    }
    setSelectedLayerIndex(null)
  }

  const reorderSlides = (oldIndex: number, newIndex: number) => {
    setSlides((prev) => {
      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
    setSelectedSlideIndex(newIndex)
  }

  const updateSlide = (
    index: number,
    updater: (s: SlideData) => SlideData,
  ) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? updater(s) : s)))
  }

  // ─── Layer History (per-slide undo/redo) ─────────────────────────────

  const layerHistory = useSlideLayerHistory(slides, updateSlide)

  // ─── Layer Operations ─────────────────────────────────────────────────

  const addLayer = (type: LayerType) => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (!slide || !slideId) return
    const oldLayers = slide.layers[vp]
    const newLayer = defaultLayer(type, oldLayers.length)
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: [...s.layers[vp], newLayer] },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, [...oldLayers, newLayer])
  }

  const removeLayer = (index: number) => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (!slide || !slideId) return
    const oldLayers = slide.layers[vp]
    const newLayers = oldLayers.filter((_, i) => i !== index)
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)
    setSelectedLayerIndex(null)
  }

  const toggleLayerLock = (index: number) => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (!slide || !slideId) return
    const oldLayers = slide.layers[vp]
    const newLayers = oldLayers.map((l, i) => (i === index ? { ...l, locked: !l.locked } : l))
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)
  }

  const reorderLayers = (oldIndex: number, newIndex: number) => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (!slide || !slideId) return
    const oldLayers = slide.layers[vp]
    const moved = [...oldLayers]
    const [removed] = moved.splice(oldIndex, 1)
    moved.splice(newIndex, 0, removed)
    const newLayers = moved.map((l, i) => ({ ...l, zIndex: i }))
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)
  }

  const updateLayer = (
    layerIndex: number,
    updater: (l: SlideLayer) => SlideLayer,
  ) => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (!slide || !slideId) return
    const oldLayers = slide.layers[vp]
    const newLayers = oldLayers.map((l, i) => (i === layerIndex ? updater(l) : l))
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)
  }

  // Direct layer update — NO history push (used during drag/resize)
  const updateLayerDirect = (
    layerIndex: number,
    updater: (l: SlideLayer) => SlideLayer,
  ) => {
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: s.layers[vp].map((l, i) => (i === layerIndex ? updater(l) : l)) },
    }))
  }

  const updateLayerPosition = (
    layerIndex: number,
    left: number,
    top: number,
  ) => {
    updateLayerDirect(layerIndex, (l) => ({
      ...l,
      left: `${left}%`,
      top: `${top}%`,
    }))
  }

  const updateLayerSize = (
    layerIndex: number,
    width: number,
    height: number,
  ) => {
    updateLayerDirect(layerIndex, (l) => ({
      ...l,
      width: `${width}%`,
      height: `${height}%`,
    }))
  }

  // Drag batch callbacks
  const handleDragStart = () => {
    const slide = selectedSlideRef.current
    const vp = viewportRef.current
    if (!slide) return
    layerHistory.saveDragSnapshot(slide.id, vp, slide.layers[vp])
  }

  const handleDragEnd = () => {
    const slide = selectedSlideRef.current
    const vp = viewportRef.current
    if (!slide) return
    layerHistory.pushDragEnd(slide.id, vp, slide.layers[vp])
  }

  // ─── Media Picker ─────────────────────────────────────────────────────

  const openMediaPicker = (layerIndex: number, type: "layer" | "mobile") => {
    setMediaPickerTarget({
      slideIndex: selectedSlideIndex,
      layerIndex,
      type,
    })
    setMediaPickerOpen(true)
  }

  const handleMediaSelect = (media: Media) => {
    if (!mediaPickerTarget) return
    const { layerIndex, type } = mediaPickerTarget

    updateLayer(layerIndex, (l) =>
      type === "mobile"
        ? { ...l, srcMobile: media.secureUrl || media.url }
        : {
            ...l,
            mediaId: media.id,
            src: media.secureUrl || media.url,
            alt: media.altText || l.alt,
          },
    )
  }

  // ─── Crop ──────────────────────────────────────────────────────────────

  const handleCropStart = () => {
    const existingCrop = selectedLayer?.crop
    if (existingCrop) {
      setCropRect({ x: existingCrop.x, y: existingCrop.y, width: existingCrop.width, height: existingCrop.height })
    } else {
      setCropRect({ x: 10, y: 10, width: 80, height: 80 })
    }
    setCropMode(true)
  }

  const handleCropApply = () => {
    if (selectedLayerIndex === null) return
    updateLayer(selectedLayerIndex, (l) => ({ ...l, crop: { ...cropRect } }))
    setCropMode(false)
  }

  const handleCropCancel = () => {
    setCropMode(false)
  }

  const handleCropReset = () => {
    if (selectedLayerIndex === null) return
    updateLayer(selectedLayerIndex, (l) => ({ ...l, crop: undefined }))
    setCropMode(false)
  }

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────

  const handleDeleteLayer = React.useCallback(() => {
    if (selectedLayerIndex !== null) removeLayer(selectedLayerIndex)
  }, [selectedLayerIndex, removeLayer])

  const handleDuplicateLayer = React.useCallback(() => {
    const layerIdx = selectedLayerIndexRef.current
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (layerIdx === null || !slide || !slideId) return
    const layerToDup = slide.layers[vp][layerIdx]
    if (!layerToDup) return
    const dup = {
      ...JSON.parse(JSON.stringify(layerToDup)),
      name: `${layerToDup.name || layerToDup.type} (copy)`,
      zIndex: slide.layers[vp].length,
    }
    const oldLayers = slide.layers[vp]
    const newLayers = [...oldLayers, dup]
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)
  }, [updateSlide, layerHistory])

  const handleNudgeLayer = React.useCallback(
    (dx: number, dy: number) => {
      const layerIdx = selectedLayerIndexRef.current
      const slide = selectedSlideRef.current
      const vp = viewportRef.current
      if (layerIdx === null || !slide) return
      const layer = slide.layers[vp][layerIdx]
      const currentLeft = parseFloat(layer?.left ?? "0")
      const currentTop = parseFloat(layer?.top ?? "0")
      updateLayerPosition(layerIdx, currentLeft + dx, currentTop + dy)
    },
    [updateLayerPosition],
  )

  const handleEscape = React.useCallback(() => {
    if (cropMode) {
      setCropMode(false)
    } else if (selectedLayerIndex !== null) {
      setSelectedLayerIndex(null)
    }
  }, [cropMode, selectedLayerIndex])

  const handleUndo = React.useCallback(() => {
    const slideId = selectedSlideIdRef.current
    if (slideId) layerHistory.undo(slideId)
  }, [layerHistory])

  const handleRedo = React.useCallback(() => {
    const slideId = selectedSlideIdRef.current
    if (slideId) layerHistory.redo(slideId)
  }, [layerHistory])

  useSliderKeyboard({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSave,
    onDeleteLayer: handleDeleteLayer,
    onDuplicateLayer: handleDuplicateLayer,
    onNudgeLayer: handleNudgeLayer,
    onEscape: handleEscape,
    enabled: !isLoading,
  })

  // ─── Render ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Top Toolbar — context-sensitive */}
      <div className="h-12 border-b bg-card flex items-center px-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?")) return
            router.push("/hero-slider")
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors mr-1"
        >
          <IconArrowLeft className="size-3.5" />
          Quay lại
        </button>
      </div>
      <TopToolbar
        mode={toolbarMode}
        viewport={viewport}
        onViewportChange={setViewport}
        layer={selectedLayer}
        onUpdateLayer={
          selectedLayerIndex !== null
            ? (updater) => updateLayer(selectedLayerIndex, updater)
            : undefined
        }
        onPickMedia={
          selectedLayerIndex !== null
            ? (type) => openMediaPicker(selectedLayerIndex, type)
            : undefined
        }
        onRemoveLayer={
          selectedLayerIndex !== null
            ? () => removeLayer(selectedLayerIndex)
            : undefined
        }
        onCrop={
          selectedLayerIndex !== null && selectedLayer?.src
            ? handleCropStart
            : undefined
        }
        cropMode={cropMode}
        onCropApply={handleCropApply}
        onCropCancel={handleCropCancel}
        onCropReset={selectedLayer?.crop ? handleCropReset : undefined}
        onSave={handleSave}
        onReload={() => {
          if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Bạn có muốn tải lại không?")) return
          loadSection()
        }}
        isSaving={isSaving}
        isDirty={isDirty}
        onOpenProperties={selectedLayerIndex !== null
          ? () => setPropertiesOpen((prev) => !prev)
          : undefined}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={layerHistory.canUndo(selectedSlideIdRef.current)}
        canRedo={layerHistory.canRedo(selectedSlideIdRef.current)}
        onPreview={() => {
          sessionStorage.setItem("hero-slider-preview", JSON.stringify(slides))
          const win = window.open("", "hero-slider-preview")
          if (win && win.location.pathname === "/hero-slider/preview") {
            win.location.reload()
            win.focus()
          } else {
            window.open("/hero-slider/preview", "hero-slider-preview")
          }
        }}
      />

      {/* Main area: Left Sidebar + Canvas */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar — Slides + Layers tabs */}
        <LeftSidebar
          slides={slides}
          selectedSlideIndex={selectedSlideIndex}
          selectedLayerIndex={selectedLayerIndex}
          viewport={viewport}
          onSelectSlide={(i) => {
            setSelectedSlideIndex(i)
            setSelectedLayerIndex(null)
          }}
          onSelectLayer={setSelectedLayerIndex}
          onReorderSlides={reorderSlides}
          onAddSlide={addSlide}
          onRemoveSlide={removeSlide}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onReorderLayers={reorderLayers}
          onUpdateLayer={updateLayer}
          onToggleLayerLock={toggleLayerLock}
        />

        {/* Canvas area */}
        <div className="flex-1 min-w-0 relative">
          {selectedSlide && (
            <SliderCanvas
              slide={selectedSlide}
              viewport={viewport}
              selectedLayerIndex={selectedLayerIndex}
              onSelectLayer={setSelectedLayerIndex}
              onUpdateLayerPosition={updateLayerPosition}
              onUpdateLayerSize={updateLayerSize}
              cropMode={cropMode}
              cropRect={cropRect}
              onCropRectChange={setCropRect}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>

        {/* Properties Panel — show when toggled and a layer is selected */}
        {propertiesOpen && selectedLayerIndex !== null && (
          <div className="w-[280px] border-l bg-card overflow-y-auto shrink-0 p-3">
            <PropertiesPanel
              slide={selectedSlide}
              selectedLayerIndex={selectedLayerIndex}
              viewport={viewport}
              onUpdateLayer={updateLayer}
              onPickMedia={openMediaPicker}
            />
          </div>
        )}
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        title="Chọn ảnh cho layer"
      />
    </div>
  )
}
