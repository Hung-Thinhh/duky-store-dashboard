"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconLoader2,
  IconLayoutSidebar,
  IconPhoto,
  IconTypography,
  IconClick,
  IconKeyboard,
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { homepageService } from "@/lib/api/services/homepage.service"
import { type HomepageSection } from "@/lib/api/schemas/homepage.schema"
import { ContentStatus, HomepageSectionType } from "@/lib/api/schemas/enums"
import { type Media } from "@/lib/api/schemas/media.schema"
import { useSlideLayerHistory } from "@/hooks/use-slide-layer-history"
import { useSliderKeyboard } from "@/hooks/use-slider-keyboard"
import { TopToolbar } from "@/components/hero-slider/TopToolbar"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { BottomPanel } from "@/components/hero-slider/BottomPanel"
import { FloatingLayersPanel } from "@/components/hero-slider/FloatingLayersPanel"
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
    name:
      type === "image" ? "Ảnh mới" : type === "text" ? "Văn bản" : "Nút bấm",
    zIndex,
  }

  if (type === "image") {
    return {
      ...base,
      src: "",
      alt: "",
      objectFit: "contain",
    }
  }

  if (type === "text") {
    return {
      ...base,
      width: "50%",
      height: "16%",
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
    width: "8%",
    height: "8%",
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
    useGradient: l.useGradient,
    gradientType: l.gradientType,
    gradientAngle: l.gradientAngle,
    gradientStops: l.gradientStops,
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
    (l: any) => "role" in l && !("type" in l)
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
        type: "text",
        name: "Badge",
        zIndex: z++,
        content: old.text.badge,
        fontSize: 14,
        fontWeight: 500,
        color: old.text.style?.badgeColor ?? "#70737a",
        textAlign: "left",
        layout: {
          desktop: { top: "100px", left: "100px" },
          tablet: {},
          mobile: {},
        },
      })
    }
    if (old.text?.title) {
      textLayers.push({
        type: "text",
        name: "Tiêu đề",
        zIndex: z++,
        content: old.text.title,
        fontSize: 48,
        fontWeight: 700,
        color: old.text.style?.titleColor ?? "#101114",
        textAlign: "left",
        layout: {
          desktop: { top: "130px", left: "100px" },
          tablet: {},
          mobile: {},
        },
      })
    }
    if (old.text?.tagline) {
      textLayers.push({
        type: "text",
        name: "Mô tả",
        zIndex: z++,
        content: old.text.tagline,
        fontSize: 16,
        fontWeight: 400,
        color: old.text.style?.taglineColor ?? "#5f646d",
        textAlign: "left",
        layout: {
          desktop: { top: "200px", left: "100px" },
          tablet: {},
          mobile: {},
        },
      })
    }
    if (old.text?.buttons) {
      for (const btn of old.text.buttons) {
        textLayers.push({
          type: "button",
          name: btn.label || "Nút",
          zIndex: z++,
          label: btn.label,
          link: btn.link,
          variant: btn.variant,
          buttonColor: btn.variant === "primary" ? "#101114" : "transparent",
          textColor: btn.variant === "primary" ? "#ffffff" : "#101114",
          layout: {
            desktop: {
              top: `${250 + textLayers.length * 50}px`,
              left: "100px",
            },
            tablet: {},
            mobile: {},
          },
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
      desktop: sharedLayers.map((l: any) =>
        flattenLayerForViewport(l, "desktop")
      ),
      tablet: sharedLayers.map((l: any) =>
        flattenLayerForViewport(l, "tablet")
      ),
      mobile: sharedLayers.map((l: any) =>
        flattenLayerForViewport(l, "mobile")
      ),
    },
  }
}

const CANVAS_SIZES: Record<ViewportMode, { width: number; height: number }> = {
  desktop: { width: 1920, height: 900 },
  tablet: { width: 768, height: 954 },
  mobile: { width: 390, height: 664 },
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function HeroSliderEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { setOpen } = useSidebar()
  const [section, setSection] = React.useState<HomepageSection | null>(null)
  const [slides, setSlides] = React.useState<SlideData[]>([])
  const [selectedSlideIndex, setSelectedSlideIndex] = React.useState(0)
  const [selectedLayerIndices, setSelectedLayerIndices] = React.useState<
    number[]
  >([])
  const [clipboard, setClipboard] = React.useState<SlideLayer[]>([])

  const selectedLayerIndex =
    selectedLayerIndices.length > 0 ? selectedLayerIndices[0] : null
  const setSelectedLayerIndex = React.useCallback(
    (val: number | null | ((prev: number | null) => number | null)) => {
      setSelectedLayerIndices((prev) => {
        const currentVal = prev.length > 0 ? prev[0] : null
        const nextVal = typeof val === "function" ? val(currentVal) : val
        return nextVal === null ? [] : [nextVal]
      })
    },
    []
  )
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = React.useState<{
    slideIndex: number
    layerIndex: number
    type: "layer" | "mobile"
  } | null>(null)
  const [propertiesOpen, setPropertiesOpen] = React.useState(false)
  const [layersPanelOpen, setLayersPanelOpen] = React.useState(false)
  const [zoomScale, setZoomScale] = React.useState(1)
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 })
  const [activeGradientEditIndex, setActiveGradientEditIndex] = React.useState<
    number | null
  >(null)

  React.useEffect(() => {
    setActiveGradientEditIndex(null)
  }, [selectedLayerIndex])

  const handleFit = React.useCallback(() => {
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  // Auto-collapse admin sidebar on mount
  React.useEffect(() => {
    setOpen(false)
  }, [setOpen])

  // Reset zoom and pan when viewport changes
  React.useEffect(() => {
    handleFit()
  }, [viewport, handleFit])

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
  const selectedLayerIndicesRef = React.useRef(selectedLayerIndices)
  selectedLayerIndicesRef.current = selectedLayerIndices
  const viewportRef = React.useRef(viewport)
  viewportRef.current = viewport

  // Determine toolbar mode
  const toolbarMode: "default" | "layer" =
    selectedLayerIndex !== null ? "layer" : "default"

  // ─── Dirty tracking ──────────────────────────────────────────────────

  const savedSnapshotRef = React.useRef<{
    title: string
    slides: SlideData[]
  } | null>(null)
  const isDirty =
    savedSnapshotRef.current !== null &&
    ((section?.title || "") !== savedSnapshotRef.current.title ||
      JSON.stringify(slides) !==
        JSON.stringify(savedSnapshotRef.current.slides))

  React.useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // Heartbeat presence pinging
  React.useEffect(() => {
    if (!id || id === "new") return

    homepageService.sendHeartbeat(id).catch(console.error)

    const interval = setInterval(() => {
      homepageService.sendHeartbeat(id).catch(console.error)
    }, 5000)

    return () => clearInterval(interval)
  }, [id])

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
        savedSnapshotRef.current = {
          title: created.title || "Hero Slider",
          slides: [defaultSlide(0)],
        }
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
          savedSnapshotRef.current = {
            title: heroSection.title || "Hero Slider",
            slides: loaded,
          }
        } else {
          console.log("[Load] No slides in metadata, using default")
          setSlides([defaultSlide(0)])
          savedSnapshotRef.current = {
            title: heroSection.title || "Hero Slider",
            slides: [defaultSlide(0)],
          }
        }
      } else {
        console.log("[Load] heroSection is null, using default")
        setSection(null)
        setSlides([defaultSlide(0)])
        savedSnapshotRef.current = {
          title: "Hero Slider",
          slides: [defaultSlide(0)],
        }
      }
    } catch {
      setSlides([defaultSlide(0)])
      savedSnapshotRef.current = {
        title: "Hero Slider",
        slides: [defaultSlide(0)],
      }
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
            errors.push(
              `Slide ${i + 1} [${vp}], Layer "${layer.name || `Layer ${j + 1}`}": Chưa có ảnh.`
            )
          }
          if (layer.type === "button" && !layer.link) {
            errors.push(
              `Slide ${i + 1} [${vp}], Layer "${layer.name || `Layer ${j + 1}`}": Nút bấm chưa có link.`
            )
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
      savedSnapshotRef.current = { title: payload.title, slides }
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

  const updateSlide = (index: number, updater: (s: SlideData) => SlideData) => {
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
    setSelectedLayerIndex(oldLayers.length)
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
    const newLayers = oldLayers.map((l, i) =>
      i === index ? { ...l, locked: !l.locked } : l
    )
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
    updater: (l: SlideLayer) => SlideLayer
  ) => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    if (!slide || !slideId) return
    const oldLayers = slide.layers[vp]
    const newLayers = oldLayers.map((l, i) =>
      i === layerIndex ? updater(l) : l
    )
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)
  }

  // Direct layer update — NO history push (used during drag/resize)
  const updateLayerDirect = (
    layerIndex: number,
    updater: (l: SlideLayer) => SlideLayer
  ) => {
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: {
        ...s.layers,
        [vp]: s.layers[vp].map((l, i) => (i === layerIndex ? updater(l) : l)),
      },
    }))
  }

  const dragStartPositionsRef = React.useRef<{
    [index: number]: { left: number; top: number }
  }>({})

  const updateLayerPosition = (
    layerIndex: number,
    left: number,
    top: number,
    singleOnly?: boolean
  ) => {
    const slide = selectedSlideRef.current
    const vp = viewportRef.current
    if (!slide) return

    const draggedLayer = slide.layers[vp][layerIndex]
    if (!draggedLayer) return

    const indices = selectedLayerIndicesRef.current
    if (indices.includes(layerIndex) && !singleOnly) {
      const startPosDragged = dragStartPositionsRef.current[layerIndex]
      const startLeftDragged = startPosDragged
        ? startPosDragged.left
        : parseFloat(draggedLayer.left || "0")
      const startTopDragged = startPosDragged
        ? startPosDragged.top
        : parseFloat(draggedLayer.top || "0")

      const dx = left - startLeftDragged
      const dy = top - startTopDragged

      const slideIdx = selectedSlideIndexRef.current
      updateSlide(slideIdx, (s) => ({
        ...s,
        layers: {
          ...s.layers,
          [vp]: s.layers[vp].map((l, i) => {
            if (indices.includes(i) && !l.locked) {
              const startPos = dragStartPositionsRef.current[i]
              const startLeft = startPos
                ? startPos.left
                : parseFloat(l.left || "0")
              const startTop = startPos
                ? startPos.top
                : parseFloat(l.top || "0")
              return {
                ...l,
                left: `${Math.round(startLeft + dx)}%`,
                top: `${Math.round(startTop + dy)}%`,
              }
            }
            return l
          }),
        },
      }))
    } else {
      updateLayerDirect(layerIndex, (l) => ({
        ...l,
        left: `${left}%`,
        top: `${top}%`,
      }))
    }
  }

  const updateLayerSize = (
    layerIndex: number,
    width: number,
    height: number
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

    const indices = selectedLayerIndicesRef.current
    const startPositions: { [index: number]: { left: number; top: number } } =
      {}
    indices.forEach((idx) => {
      const layer = slide.layers[vp][idx]
      if (layer) {
        startPositions[idx] = {
          left: parseFloat(layer.left || "0"),
          top: parseFloat(layer.top || "0"),
        }
      }
    })
    dragStartPositionsRef.current = startPositions
  }

  const handleDragEnd = () => {
    const slide = selectedSlideRef.current
    const vp = viewportRef.current
    if (!slide) return
    layerHistory.pushDragEnd(slide.id, vp, slide.layers[vp])
    dragStartPositionsRef.current = {}
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

    if (type === "mobile") {
      updateLayer(layerIndex, (l) => ({
        ...l,
        srcMobile: media.secureUrl || media.url,
      }))
      return
    }

    const src = media.secureUrl || media.url
    const alt = media.altText || ""

    const applyLayerImage = (imgW?: number, imgH?: number) => {
      updateLayer(layerIndex, (l) => {
        let sizeProps = {}
        if (imgW && imgH) {
          const canvasSize = CANVAS_SIZES[viewportRef.current]

          // Raw percentages based on natural image size
          let wPercent = (imgW / canvasSize.width) * 100
          let hPercent = (imgH / canvasSize.height) * 100

          // Clamp: if image is larger than canvas in either dimension,
          // scale down proportionally so the longest side fits exactly 100%.
          if (wPercent > 100 || hPercent > 100) {
            const scaleFactor = Math.min(100 / wPercent, 100 / hPercent)
            wPercent = wPercent * scaleFactor
            hPercent = hPercent * scaleFactor
          }

          wPercent = Math.round(wPercent)
          hPercent = Math.round(hPercent)

          // Center the layer inside the canvas
          const leftPercent = Math.round((100 - wPercent) / 2)
          const topPercent = Math.round((100 - hPercent) / 2)

          sizeProps = {
            width: `${wPercent}%`,
            height: `${hPercent}%`,
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
          }
        }
        return {
          ...l,
          mediaId: media.id,
          src,
          alt: alt || l.alt,
          objectFit: "cover",
          ...sizeProps,
        }
      })
    }

    if (media.width && media.height) {
      applyLayerImage(media.width, media.height)
    } else {
      const img = new Image()
      img.src = src
      img.onload = () => {
        applyLayerImage(img.naturalWidth, img.naturalHeight)
      }
      img.onerror = () => {
        applyLayerImage()
      }
    }
  }

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────

  const removeSelectedLayers = React.useCallback(() => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    const indices = selectedLayerIndicesRef.current
    if (!slide || !slideId || indices.length === 0) return

    const oldLayers = slide.layers[vp]
    const newLayers = oldLayers.filter((_, i) => !indices.includes(i))
    const reorderedLayers = newLayers.map((l, i) => ({ ...l, zIndex: i }))

    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: reorderedLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, reorderedLayers)
    setSelectedLayerIndices([])
  }, [updateSlide, layerHistory])

  const handleDeleteLayer = React.useCallback(() => {
    removeSelectedLayers()
  }, [removeSelectedLayers])

  const handleDuplicateLayer = React.useCallback(() => {
    const slide = selectedSlideRef.current
    const slideId = selectedSlideIdRef.current
    const slideIdx = selectedSlideIndexRef.current
    const vp = viewportRef.current
    const indices = selectedLayerIndicesRef.current
    if (!slide || !slideId || indices.length === 0) return

    const oldLayers = slide.layers[vp]
    const dups = indices
      .map((idx) => oldLayers[idx])
      .filter(Boolean)
      .map((layerToDup, index) => {
        const currentLeft = parseFloat(layerToDup.left || "0")
        const currentTop = parseFloat(layerToDup.top || "0")
        return {
          ...JSON.parse(JSON.stringify(layerToDup)),
          left: `${Math.min(100, Math.max(0, currentLeft + 4))}%`,
          top: `${Math.min(100, Math.max(0, currentTop + 4))}%`,
          name: `${layerToDup.name || layerToDup.type} (copy)`,
          zIndex: oldLayers.length + index,
        }
      })

    const newLayers = [...oldLayers, ...dups]
    updateSlide(slideIdx, (s) => ({
      ...s,
      layers: { ...s.layers, [vp]: newLayers },
    }))
    layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)

    const newIndices = dups.map((_, i) => oldLayers.length + i)
    setSelectedLayerIndices(newIndices)
  }, [updateSlide, layerHistory])

  const handleCopy = React.useCallback(() => {
    const slide = selectedSlideRef.current
    const vp = viewportRef.current
    const indices = selectedLayerIndicesRef.current

    if (slide && indices.length > 0) {
      const layersToCopy = indices
        .map((idx) => slide.layers[vp][idx])
        .filter(Boolean)

      setClipboard(layersToCopy)
      try {
        localStorage.setItem(
          "hero-slider-layer-clipboard",
          JSON.stringify(layersToCopy)
        )
        localStorage.setItem("hero-slider-last-copy-type", "layer")
      } catch (err) {
        console.error("Failed to save layers to localStorage", err)
      }
    } else if (slide) {
      try {
        localStorage.setItem(
          "hero-slider-slide-clipboard",
          JSON.stringify(slide)
        )
        localStorage.setItem("hero-slider-last-copy-type", "slide")
      } catch (err) {
        console.error("Failed to save slide to localStorage", err)
      }
    }
  }, [])

  const handlePaste = React.useCallback(() => {
    try {
      const lastCopyType = localStorage.getItem("hero-slider-last-copy-type")

      if (lastCopyType === "layer") {
        const savedLayersStr = localStorage.getItem(
          "hero-slider-layer-clipboard"
        )
        if (!savedLayersStr) return
        const parsedLayers = JSON.parse(savedLayersStr) as SlideLayer[]
        if (parsedLayers.length === 0) return

        const slide = selectedSlideRef.current
        const slideId = selectedSlideIdRef.current
        const slideIdx = selectedSlideIndexRef.current
        const vp = viewportRef.current
        if (!slide || !slideId) return

        const oldLayers = slide.layers[vp]
        const pastedLayers = parsedLayers.map((layer, index) => {
          const currentLeft = parseFloat(layer.left || "0")
          const currentTop = parseFloat(layer.top || "0")
          const newLeft = `${Math.min(100, Math.max(0, currentLeft + 4))}%`
          const newTop = `${Math.min(100, Math.max(0, currentTop + 4))}%`

          return {
            ...JSON.parse(JSON.stringify(layer)),
            left: newLeft,
            top: newTop,
            name: `${layer.name || layer.type} (copy)`,
            zIndex: oldLayers.length + index,
          }
        })

        const newLayers = [...oldLayers, ...pastedLayers]
        updateSlide(slideIdx, (s) => ({
          ...s,
          layers: { ...s.layers, [vp]: newLayers },
        }))
        layerHistory.pushSnapshot(slideId, vp, oldLayers, newLayers)

        const newIndices = pastedLayers.map((_, i) => oldLayers.length + i)
        setSelectedLayerIndices(newIndices)
      } else if (lastCopyType === "slide") {
        const savedSlideStr = localStorage.getItem(
          "hero-slider-slide-clipboard"
        )
        if (!savedSlideStr) return
        const slideToPaste = JSON.parse(savedSlideStr) as SlideData

        const newSlide: SlideData = {
          ...slideToPaste,
          id: `slide-${Date.now()}-${Math.random()}`,
        }

        setSlides((prev) => [...prev, newSlide])
        setSelectedSlideIndex(slides.length)
        setSelectedLayerIndex(null)
      }
    } catch (err) {
      console.error(
        "Failed to parse and paste from localStorage clipboard",
        err
      )
    }
  }, [updateSlide, layerHistory, slides.length])

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
    [updateLayerPosition]
  )

  const handleEscape = React.useCallback(() => {
    if (selectedLayerIndex !== null) {
      setSelectedLayerIndex(null)
    }
  }, [selectedLayerIndex])

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
    onCopy: handleCopy,
    onPaste: handlePaste,
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
      <TopToolbar
        title={section?.title || ""}
        onTitleChange={(newTitle) =>
          setSection((prev) => (prev ? { ...prev, title: newTitle } : null))
        }
        onBack={() => {
          if (
            isDirty &&
            !confirm("Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?")
          )
            return
          router.push("/hero-slider")
        }}
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
        onDuplicateLayer={
          selectedLayerIndex !== null ? handleDuplicateLayer : undefined
        }
        onSave={handleSave}
        onReload={() => {
          if (
            isDirty &&
            !confirm("Bạn có thay đổi chưa lưu. Bạn có muốn tải lại không?")
          )
            return
          loadSection()
        }}
        isSaving={isSaving}
        isDirty={isDirty}
        onOpenProperties={
          selectedLayerIndex !== null
            ? () => setPropertiesOpen((prev) => !prev)
            : undefined
        }
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={layerHistory.canUndo(selectedSlideIdRef.current)}
        canRedo={layerHistory.canRedo(selectedSlideIdRef.current)}
        onPreview={() => {
          sessionStorage.setItem("hero-slider-preview", JSON.stringify(slides))
          localStorage.setItem("hero-slider-preview", JSON.stringify(slides))
          const win = window.open("/hero-slider/preview", "hero-slider-preview")
          if (win) {
            win.focus()
          }
        }}
        zoom={zoomScale}
        onZoomChange={setZoomScale}
        onFit={handleFit}
      />

      {/* Main area: Left Sidebar + Canvas */}
      <div className="flex min-h-0 flex-1">
        {/* Left area: Canvas on top, BottomPanel at the bottom */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Canvas area */}
          <div className="relative min-w-0 flex-1">
            {selectedSlide && (
              <>
                <SliderCanvas
                  slide={selectedSlide}
                  viewport={viewport}
                  selectedLayerIndex={selectedLayerIndex}
                  onSelectLayer={setSelectedLayerIndex}
                  selectedLayerIndices={selectedLayerIndices}
                  onSelectLayers={setSelectedLayerIndices}
                  onUpdateLayerPosition={updateLayerPosition}
                  onUpdateLayerSize={updateLayerSize}
                  onUpdateLayerDirect={updateLayerDirect}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  zoomScale={zoomScale}
                  onZoomScaleChange={setZoomScale}
                  panOffset={panOffset}
                  onPanOffsetChange={setPanOffset}
                  showGradientHandles={
                    activeGradientEditIndex === selectedLayerIndex
                  }
                />
                {layersPanelOpen ? (
                  <FloatingLayersPanel
                    layers={currentLayers}
                    selectedLayerIndex={selectedLayerIndex}
                    onSelectLayer={setSelectedLayerIndex}
                    onAddLayer={addLayer}
                    onRemoveLayer={removeLayer}
                    onReorderLayers={reorderLayers}
                    onUpdateLayer={updateLayer}
                    onToggleLayerLock={toggleLayerLock}
                    onClose={() => setLayersPanelOpen(false)}
                  />
                ) : (
                  <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur-md hover:bg-background"
                      onClick={() => setLayersPanelOpen(true)}
                      title="Mở danh sách Layer"
                    >
                      <IconLayoutSidebar className="size-4 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur-md hover:bg-background"
                      onClick={() => addLayer("image")}
                      title="Thêm Layer Ảnh"
                    >
                      <IconPhoto className="size-4 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur-md hover:bg-background"
                      onClick={() => addLayer("text")}
                      title="Thêm Layer Chữ"
                    >
                      <IconTypography className="size-4 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur-md hover:bg-background"
                      onClick={() => addLayer("button")}
                      title="Thêm Layer Nút"
                    >
                      <IconClick className="size-4 text-foreground" />
                    </Button>
                    <div className="mx-1.5 my-0.5 h-px bg-border/60" />
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl border border-border bg-background/80 shadow-lg backdrop-blur-md hover:bg-background"
                      onClick={() => setShortcutsOpen(true)}
                      title="Danh sách phím tắt"
                    >
                      <IconKeyboard className="size-4 text-foreground" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Panel — Slides */}
          <BottomPanel
            slides={slides}
            selectedSlideIndex={selectedSlideIndex}
            viewport={viewport}
            onSelectSlide={(i) => {
              setSelectedSlideIndex(i)
              setSelectedLayerIndex(null)
            }}
            onReorderSlides={reorderSlides}
            onAddSlide={addSlide}
            onRemoveSlide={removeSlide}
          />
        </div>

        {/* Properties Panel — show when toggled and a layer is selected */}
        {propertiesOpen && selectedLayerIndex !== null && (
          <div className="w-[280px] shrink-0 overflow-y-auto border-l bg-card p-3">
            <PropertiesPanel
              slide={selectedSlide}
              selectedLayerIndex={selectedLayerIndex}
              viewport={viewport}
              onUpdateLayer={updateLayer}
              onPickMedia={openMediaPicker}
              onStartGradientEdit={() =>
                setActiveGradientEditIndex(selectedLayerIndex)
              }
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

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <IconKeyboard className="size-5 text-primary" />
              Phím tắt hệ thống
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Thao tác chung
              </h4>
              <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Z
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Hoàn tác (Undo)
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Shift
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Z
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Làm lại (Redo)
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    S
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Lưu thay đổi (Save)
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Thao tác trên Layer
              </h4>
              <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    D
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Nhân bản Layer (Duplicate)
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    C
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Sao chép Layer/Slide (Copy)
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    V
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Dán từ bộ nhớ đệm (Paste)
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Delete
                  </kbd>{" "}
                  /{" "}
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Back
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Xóa Layer được chọn
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Esc
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Bỏ chọn các Layer
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Căn chỉnh & Di chuyển
              </h4>
              <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    ↓
                  </kbd>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    ←
                  </kbd>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    →
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Dịch chuyển Layer 1%
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Shift
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Phím mũi tên
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Dịch chuyển nhanh Layer 10%
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Click
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Chọn thêm nhiều Layer
                </div>

                <div className="flex gap-1">
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Shift
                  </kbd>
                  +
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
                    Kéo chuột
                  </kbd>
                </div>
                <div className="flex items-center text-muted-foreground">
                  Khóa trục di chuyển ngang/dọc
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
