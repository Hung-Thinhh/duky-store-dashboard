"use client"

import * as React from "react"
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceDesktop,
  IconDeviceTablet,
  IconDeviceMobile,
  IconLoader2,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react"

// ─── Types ────────────────────────────────────────────────────────────────

type ViewportMode = "desktop" | "tablet" | "mobile"

interface CropData {
  x: number; y: number; width: number; height: number
}

interface SlideLayer {
  type: "image" | "text" | "button"
  name?: string; zIndex: number; locked?: boolean
  top?: string; left?: string; width?: string; height?: string
  objectFit?: "cover" | "contain"; objectPosition?: string; display?: string
  mediaId?: string; src?: string; srcMobile?: string; alt?: string
  float?: { duration: number; delay: number; displacement: number; direction: string }
  crop?: CropData
  content?: string; fontSize?: number; fontWeight?: number; color?: string
  fontFamily?: "montserrat" | "playfair"
  textAlign?: "left" | "center" | "right"
  textShadow?: string; letterSpacing?: number; lineHeight?: number
  label?: string; link?: string; variant?: "primary" | "secondary"
  buttonColor?: string; textColor?: string
  entranceAnimation?: { type: string; duration: number; delay: number }
}

interface SlideData {
  id: string
  layers: {
    desktop: SlideLayer[]
    tablet: SlideLayer[]
    mobile: SlideLayer[]
  }
  text: { badge: string; title: string; tagline: string; buttons: any[] }
}

// ─── Constants ────────────────────────────────────────────────────────────

const STORAGE_KEY = "hero-slider-preview"

// ─── CSS Keyframes (injected once) ────────────────────────────────────────

const ANIMATION_CSS = `
@keyframes hero-entrance-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hero-entrance-slide-left {
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes hero-entrance-slide-right {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes hero-entrance-slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hero-entrance-slide-down {
  from { opacity: 0; transform: translateY(-40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hero-float-down {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(var(--float-d, 8px)); }
}
@keyframes hero-float-up {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(var(--float-d, -8px)); }
}
@keyframes hero-float-right {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(var(--float-d, 8px)); }
}
@keyframes hero-float-left {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(var(--float-d, -8px)); }
}
`

const ENTRANCE_KEYFRAMES: Record<string, string> = {
  "fade": "hero-entrance-fade",
  "slide-left": "hero-entrance-slide-left",
  "slide-right": "hero-entrance-slide-right",
  "slide-up": "hero-entrance-slide-up",
  "slide-down": "hero-entrance-slide-down",
}

const FLOAT_KEYFRAMES: Record<string, string> = {
  "down": "hero-float-down",
  "up": "hero-float-up",
  "right": "hero-float-right",
  "left": "hero-float-left",
}

const VIEWPORT_SIZES: Record<ViewportMode, { width: number; height: number }> = {
  desktop: { width: 1920, height: 900 },
  tablet: { width: 768, height: 954 },
  mobile: { width: 390, height: 664 },
}

function parsePercent(v: string | number | undefined, fallback: number): number {
  if (v === undefined || v === null) return fallback
  if (typeof v === "number") return v
  const num = parseFloat(v)
  return isNaN(num) ? fallback : num
}

// ─── Layer Renderer ───────────────────────────────────────────────────────

function PreviewLayer({ layer, isActive }: { layer: SlideLayer; isActive: boolean }) {
  const left = parsePercent(layer.left, 0)
  const top = parsePercent(layer.top, 0)
  const width = parsePercent(layer.width, 50)
  const height = parsePercent(layer.height, 50)

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    zIndex: layer.zIndex,
    display: layer.display === "none" ? "none" : "block",
  }

  // Entrance animation (plays once when slide becomes active)
  const entranceType = layer.entranceAnimation?.type
  const hasEntrance = entranceType && entranceType !== "none" && layer.entranceAnimation
  const entranceStyle: React.CSSProperties = hasEntrance
    ? {
        animation: `${ENTRANCE_KEYFRAMES[entranceType!]} ${layer.entranceAnimation!.duration}ms ease-out ${layer.entranceAnimation!.delay}ms both`,
      }
    : {}

  // Float animation (continuous while slide is active)
  const hasFloat = isActive && layer.float
  const floatDir = layer.float?.direction ?? "down"
  const floatKeyframe = FLOAT_KEYFRAMES[floatDir] ?? FLOAT_KEYFRAMES["down"]
  const floatSign = (floatDir === "up" || floatDir === "left") ? "-" : ""
  const floatStyle: React.CSSProperties = hasFloat
    ? {
        animation: `${floatKeyframe} ${layer.float!.duration}s ease-in-out ${layer.float!.delay}s infinite`,
        ["--float-d" as any]: `${floatSign}${layer.float!.displacement || 8}px`,
      }
    : {}

  // Render image layer
  if (layer.type === "image" && layer.src) {
    const crop = layer.crop
    const content = crop ? (
      <div style={{ overflow: "hidden", width: "100%", height: "100%" }}>
        <img
          src={layer.src}
          alt={layer.alt ?? ""}
          style={{
            position: "absolute",
            left: `${-crop.x * (100 / crop.width)}%`,
            top: `${-crop.y * (100 / crop.height)}%`,
            width: `${(100 / crop.width) * 100}%`,
            height: `${(100 / crop.height) * 100}%`,
          }}
          draggable={false}
        />
      </div>
    ) : (
      <img
        src={layer.src}
        alt={layer.alt ?? ""}
        style={{
          width: "100%",
          height: "100%",
          objectFit: layer.objectFit || "contain",
          objectPosition: layer.objectPosition || "center",
        }}
        draggable={false}
      />
    )

    return (
      <div style={{ ...positionStyle, ...entranceStyle }}>
        <div style={{ ...floatStyle, width: "100%", height: "100%" }}>{content}</div>
      </div>
    )
  }

  // Render text layer
  if (layer.type === "text") {
    return (
      <div
        style={{
          ...positionStyle,
          ...entranceStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: layer.textAlign === "center" ? "center" : layer.textAlign === "right" ? "flex-end" : "flex-start",
        }}
      >
        <div style={floatStyle}>
          <p
            style={{
              fontSize: `${layer.fontSize ?? 24}px`,
              fontWeight: layer.fontWeight ?? 400,
              color: layer.color ?? "#101114",
              fontFamily:
                layer.fontFamily === "playfair"
                  ? "var(--font-playfair)"
                  : "var(--font-montserrat)",
              textAlign: layer.textAlign ?? "left",
              lineHeight: layer.lineHeight ?? 1.3,
              letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
              textShadow: layer.textShadow || undefined,
              margin: 0,
            }}
          >
            {layer.content || ""}
          </p>
        </div>
      </div>
    )
  }

  // Render button layer
  if (layer.type === "button") {
    return (
      <div style={{ ...positionStyle, ...entranceStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={floatStyle}>
          <span
            style={{
              display: "inline-block",
              fontWeight: 600,
              borderRadius: 9999,
              background: layer.buttonColor ?? "#101114",
              color: layer.textColor ?? "#ffffff",
              fontFamily:
                layer.fontFamily === "playfair"
                  ? "var(--font-playfair)"
                  : "var(--font-montserrat)",
              padding: "10px 28px",
              fontSize: "14px",
              border: layer.variant === "secondary" ? "2px solid #101114" : "none",
            }}
          >
            {layer.label || "Xem thêm"}
          </span>
        </div>
      </div>
    )
  }

  return null
}

// ─── Slide Renderer ───────────────────────────────────────────────────────

function PreviewSlide({
  slide,
  viewport,
  isActive,
}: {
  slide: SlideData
  viewport: ViewportMode
  isActive: boolean
}) {
  // Increment counter when slide becomes active → forces layer remount → replays entrance animations
  const [animCycle, setAnimCycle] = React.useState(0)
  const wasActiveRef = React.useRef(isActive)

  React.useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setAnimCycle((c) => c + 1)
    }
    wasActiveRef.current = isActive
  }, [isActive])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: isActive ? 1 : 0,
        transition: "opacity 600ms ease",
        zIndex: isActive ? 1 : 0,
        background: "#ffffff",
      }}
    >
      {[...slide.layers[viewport]]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer, i) => (
          <PreviewLayer
            key={`${i}-${isActive ? animCycle : "idle"}`}
            layer={layer}
            isActive={isActive}
          />
        ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function HeroSliderPreviewPage() {
  const [slides, setSlides] = React.useState<SlideData[]>([])
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop")
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showControls, setShowControls] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showViewportPicker, setShowViewportPicker] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const controlsTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const size = VIEWPORT_SIZES[viewport]

  const [windowSize, setWindowSize] = React.useState({ width: 1920, height: 1080 })

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const padding = 60
  const scaleX = (windowSize.width - padding) / size.width
  const scaleY = (windowSize.height - padding) / size.height
  const scaleFactor = Math.min(scaleX, scaleY)

  // Load slides from sessionStorage on first load
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed)
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Autoplay
  React.useEffect(() => {
    if (!isPlaying || slides.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, slides.length])

  // Auto-hide controls after inactivity
  const resetControlsTimer = React.useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  React.useEffect(() => {
    resetControlsTimer()
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [resetControlsTimer])

  // Track fullscreen state
  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const goTo = React.useCallback((index: number) => {
    setCurrentIndex(index)
    resetControlsTimer()
  }, [resetControlsTimer])

  const goNext = React.useCallback(() => goTo((currentIndex + 1) % slides.length), [currentIndex, slides.length, goTo])
  const goPrev = React.useCallback(() => goTo((currentIndex - 1 + slides.length) % slides.length), [currentIndex, slides.length, goTo])

  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
      if (e.key === " ") { e.preventDefault(); setIsPlaying((p) => !p) }
      if (e.key === "f" || e.key === "F") toggleFullscreen()
      resetControlsTimer()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev, toggleFullscreen, resetControlsTimer])

  // Mouse movement shows controls
  const handleMouseMove = React.useCallback(() => {
    resetControlsTimer()
  }, [resetControlsTimer])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#1e1e1e" }}>
        <IconLoader2 className="size-8 animate-spin text-white/40" />
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#1e1e1e" }}>
        <p className="text-white/40">Không có dữ liệu preview</p>
      </div>
    )
  }

  const viewportOptions: { mode: ViewportMode; icon: React.ReactNode; label: string }[] = [
    { mode: "desktop", icon: <IconDeviceDesktop className="size-3.5 text-white" />, label: "Desktop" },
    { mode: "tablet", icon: <IconDeviceTablet className="size-3.5 text-white" />, label: "Tablet" },
    { mode: "mobile", icon: <IconDeviceMobile className="size-3.5 text-white" />, label: "Mobile" },
  ]

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ background: "#1e1e1e" }}
      onMouseMove={handleMouseMove}
    >
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />

      {/* Slide Frame — Aspect-Ratio fit scale */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#121212]">
        <div
          className="relative overflow-hidden bg-white shadow-2xl transition-all duration-200 font-montserrat"
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            transform: `scale(${scaleFactor})`,
            transformOrigin: "center center",
            borderRadius: "8px",
            flexShrink: 0,
          }}
        >
          {slides.map((slide, index) => (
            <PreviewSlide
              key={slide.id}
              slide={slide}
              viewport={viewport}
              isActive={index === currentIndex}
            />
          ))}
        </div>
      </div>

      {/* Left Arrow — large, side of frame */}
      {slides.length > 1 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-12 rounded-full transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <IconChevronLeft className="size-6 text-white" />
        </button>
      )}

      {/* Right Arrow — large, side of frame */}
      {slides.length > 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-12 rounded-full transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <IconChevronRight className="size-6 text-white" />
        </button>
      )}

      {/* Bottom Bar — floating */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Play/Pause */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center size-7 rounded-full hover:bg-white/10 transition-colors"
          >
            {isPlaying ? (
              <IconPlayerPause className="size-3.5 text-white" />
            ) : (
              <IconPlayerPlay className="size-3.5 text-white" />
            )}
          </button>
        )}

        {/* Slide Dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className="transition-all duration-200 rounded-full"
                style={{
                  width: index === currentIndex ? 20 : 8,
                  height: 8,
                  background: index === currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-4 bg-white/20" />

        {/* Counter */}
        <span className="text-xs text-white/70 font-mono tabular-nums min-w-[32px] text-center">
          {currentIndex + 1}/{slides.length}
        </span>

        {/* Separator */}
        <div className="w-px h-4 bg-white/20" />

        {/* Viewport Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowViewportPicker((p) => !p)}
            className="flex items-center justify-center size-7 rounded-full bg-white/15 hover:bg-white/30 transition-colors"
            title="Viewport"
          >
            {viewportOptions.find((v) => v.mode === viewport)?.icon}
          </button>
          {showViewportPicker && (
            <div
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 p-1 rounded-lg"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
            >
              {viewportOptions.map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => { setViewport(opt.mode); setShowViewportPicker(false) }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap ${
                    viewport === opt.mode ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center justify-center size-7 rounded-full hover:bg-white/10 transition-colors"
          title={isFullscreen ? "Thoát fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <IconMinimize className="size-3.5 text-white/70" />
          ) : (
            <IconMaximize className="size-3.5 text-white/70" />
          )}
        </button>
      </div>
    </div>
  )
}
