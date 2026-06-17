"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconLoader2,
  IconPhoto,
  IconX,
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { homepageService } from "@/lib/api/services/homepage.service"
import { type HomepageSection } from "@/lib/api/schemas/homepage.schema"
import { ContentStatus, HomepageSectionType } from "@/lib/api/schemas/enums"
import { type Media } from "@/lib/api/schemas/media.schema"
import {
  CATALOG_SLOTS,
  type CatalogBannerSlots,
  type CatalogSlotData,
  type CatalogSlotKey,
  type ViewportMode,
  defaultCatalogSlots,
} from "../../types"

// ─── Main Component ───────────────────────────────────────────────────────

export default function CatalogBannerEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [section, setSection] = React.useState<HomepageSection | null>(null)
  const [initialTitle, setInitialTitle] = React.useState("")
  const [slots, setSlots] = React.useState<CatalogBannerSlots>(defaultCatalogSlots())
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDirty, setIsDirty] = React.useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = React.useState<{
    slotKey: CatalogSlotKey
  } | null>(null)

  const savedSnapshotRef = React.useRef<string>("")
  const isCreatingRef = React.useRef(false)

  // ─── Load ─────────────────────────────────────────────────────────────

  const loadSection = React.useCallback(async () => {
    try {
      setIsLoading(true)

      if (id === "new") {
        if (isCreatingRef.current) return
        isCreatingRef.current = true
        const created = await homepageService.createSection({
          type: HomepageSectionType.CUSTOM,
          title: "Banner Catalog",
          status: ContentStatus.DRAFT,
          sortOrder: 1,
          metadata: { slots: defaultCatalogSlots() },
        })
        setSection(created)
        setInitialTitle(created.title || "Banner Catalog")
        const initialSlots = defaultCatalogSlots()
        setSlots(initialSlots)
        savedSnapshotRef.current = JSON.stringify(initialSlots)
        router.replace(`/hero-slider/catalog/${created.id}`, { scroll: false })
        return
      }

      const sectionData = await homepageService.getSection(id)

      if (sectionData) {
        setSection(sectionData)
        setInitialTitle(sectionData.title || "")
        const metadata = sectionData.metadata as Record<string, any> | null
        if (metadata?.slots) {
          const loaded = { ...defaultCatalogSlots(), ...metadata.slots }
          setSlots(loaded)
          savedSnapshotRef.current = JSON.stringify(loaded)
        } else {
          const initial = defaultCatalogSlots()
          setSlots(initial)
          savedSnapshotRef.current = JSON.stringify(initial)
        }
      }
    } catch {
      const initial = defaultCatalogSlots()
      setSlots(initial)
      savedSnapshotRef.current = JSON.stringify(initial)
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    loadSection()
  }, [loadSection])

  // ─── Dirty tracking ──────────────────────────────────────────────────

  React.useEffect(() => {
    const isSlotsDirty = JSON.stringify(slots) !== savedSnapshotRef.current && savedSnapshotRef.current !== ""
    const isTitleDirty = (section?.title || "") !== initialTitle
    setIsDirty(isSlotsDirty || isTitleDirty)
  }, [slots, section?.title, initialTitle])

  React.useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
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

  // ─── Update slot ─────────────────────────────────────────────────────

  const updateSlot = (slotKey: CatalogSlotKey, patch: Partial<CatalogSlotData>) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        [viewport]: {
          ...prev[slotKey][viewport],
          ...patch,
        },
      },
    }))
  }

  // ─── Media picker ────────────────────────────────────────────────────

  const openMediaPicker = (slotKey: CatalogSlotKey) => {
    setMediaPickerTarget({ slotKey })
    setMediaPickerOpen(true)
  }

  const handleMediaSelect = (media: Media) => {
    if (!mediaPickerTarget) return
    updateSlot(mediaPickerTarget.slotKey, {
      image: media.secureUrl || media.url,
    })
  }

  // ─── Save ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!section) return
    try {
      setIsSaving(true)
      const payload = {
        title: section.title || "Banner Catalog",
        status: section.status || ContentStatus.DRAFT,
        sortOrder: section.sortOrder ?? 1,
        metadata: { slots },
      }
      await homepageService.updateSection(section.id, payload)
      savedSnapshotRef.current = JSON.stringify(slots)
      setInitialTitle(payload.title)
      setIsDirty(false)
      alert("Đã lưu banner catalog!")
    } catch {
      alert("Lưu thất bại.")
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Top Toolbar */}
      <div className="h-12 border-b bg-card flex items-center px-3 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?")) return
            router.push("/hero-slider?tab=catalog")
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors mr-1"
        >
          <IconArrowLeft className="size-3.5" />
          Quay lại
        </button>

        {/* Editable Title */}
        <div className="flex items-center ml-1 shrink-0">
          <Input
            value={section?.title || ""}
            onChange={(e) => setSection((prev) => prev ? { ...prev, title: e.target.value } : null)}
            className="h-7 text-xs font-semibold px-2 py-1 bg-transparent hover:bg-muted/50 focus:bg-background border-none focus:ring-1 focus:ring-ring w-40 rounded-md transition-colors"
            placeholder="Tên banner"
          />
        </div>

        <Separator orientation="vertical" className="h-5 shrink-0" />

        <div className="flex-1" />

        {/* Viewport tabs */}
        <div className="flex items-center rounded-md border overflow-hidden">
          {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewport(v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                viewport === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {v === "desktop" && <IconDeviceDesktop className="size-3.5" />}
              {v === "tablet" && <IconDeviceTablet className="size-3.5" />}
              {v === "mobile" && <IconDeviceMobile className="size-3.5" />}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 rounded-md text-xs relative">
          {isSaving ? <IconLoader2 className="size-3 mr-1 animate-spin" /> : null}
          Lưu
          {isDirty && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-orange-500" />}
        </Button>
      </div>

      {/* Content — 9 slot cards */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Banner Catalog</h2>
            <p className="text-sm text-muted-foreground">
              Quản lý banner cho các trang danh mục. Đang chỉnh sửa viewport: <Badge variant="secondary" className="text-[10px]">{viewport}</Badge>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATALOG_SLOTS.map((slot) => {
              const slotData = slots[slot.key][viewport]
              return (
                <Card key={slot.key} className="rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{slot.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Image picker */}
                    <div className="flex gap-3">
                      <div
                        className="w-32 h-20 rounded-lg border-2 border-dashed border-muted-foreground/20 overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                        onClick={() => openMediaPicker(slot.key)}
                      >
                        {slotData.image ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={slotData.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <IconPhoto className="size-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <IconPhoto className="size-6 mx-auto text-muted-foreground/30" />
                            <span className="text-[9px] text-muted-foreground">Chọn ảnh</span>
                          </div>
                        )}
                      </div>
                      {slotData.image && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-destructive shrink-0"
                          onClick={() => updateSlot(slot.key, { image: undefined })}
                        >
                          <IconX className="size-3" />
                        </Button>
                      )}
                    </div>

                    {/* Text fields */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Badge</Label>
                        <Input
                          value={slotData.badge ?? ""}
                          onChange={(e) => updateSlot(slot.key, { badge: e.target.value })}
                          placeholder="MEN'S COLLECTION"
                          className="h-7 text-xs rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Title line 1</Label>
                          <Input
                            value={slotData.titleLine1 ?? ""}
                            onChange={(e) => updateSlot(slot.key, { titleLine1: e.target.value })}
                            placeholder="BOOT NAM"
                            className="h-7 text-xs rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Title line 2</Label>
                          <Input
                            value={slotData.titleLine2 ?? ""}
                            onChange={(e) => updateSlot(slot.key, { titleLine2: e.target.value })}
                            placeholder="CAO CẤP"
                            className="h-7 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Description</Label>
                        <Textarea
                          value={slotData.description ?? ""}
                          onChange={(e) => updateSlot(slot.key, { description: e.target.value })}
                          placeholder="Mô tả ngắn..."
                          className="min-h-[50px] text-xs rounded-lg"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        title="Chọn ảnh cho banner"
      />
    </div>
  )
}
