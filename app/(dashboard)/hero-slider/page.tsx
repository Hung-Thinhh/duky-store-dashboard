"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconCarouselHorizontal,
  IconCheck,
  IconEdit,
  IconLayoutGrid,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconSend,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { homepageService } from "@/lib/api/services/homepage.service"
import { type HomepageSection } from "@/lib/api/schemas/homepage.schema"
import { ContentStatus } from "@/lib/api/schemas/enums"

// ─── Status config ────────────────────────────────────────────────────────

const statusConfig: Record<string, { className: string; label: string }> = {
  [ContentStatus.PUBLISHED]: { className: "bg-emerald-100 text-emerald-700", label: "Hiển thị" },
  [ContentStatus.DRAFT]: { className: "bg-slate-100 text-slate-700", label: "Bản nháp" },
  [ContentStatus.HIDDEN]: { className: "bg-amber-100 text-amber-700", label: "Đã ẩn" },
  [ContentStatus.ARCHIVED]: { className: "bg-zinc-100 text-zinc-700", label: "Lưu trữ" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getSlideCount(section: HomepageSection): number {
  const metadata = section.metadata as Record<string, any> | null
  return Array.isArray(metadata?.slides) ? metadata.slides.length : 0
}

function getThumbnail(section: HomepageSection): string | null {
  const metadata = section.metadata as Record<string, any> | null
  if (!Array.isArray(metadata?.slides) || metadata.slides.length === 0) return null
  const firstSlide = metadata.slides[0]
  if (!firstSlide?.layers) return null
  if (firstSlide.layers.desktop) {
    const layer = firstSlide.layers.desktop.find((l: any) => l.src)
    return layer?.src ?? null
  }
  if (Array.isArray(firstSlide.layers)) {
    const layer = firstSlide.layers.find((l: any) => l.src)
    return layer?.src ?? null
  }
  return null
}

function getCatalogSlotCount(section: HomepageSection): number {
  const metadata = section.metadata as Record<string, any> | null
  if (!metadata?.slots) return 0
  return Object.keys(metadata.slots).length
}

function getCatalogFirstImage(section: HomepageSection): string | null {
  const metadata = section.metadata as Record<string, any> | null
  if (!metadata?.slots) return null
  for (const slot of Object.values(metadata.slots)) {
    const s = slot as Record<string, any>
    const img = s.desktop?.image || s.tablet?.image || s.mobile?.image
    if (img) return img
  }
  return null
}

// ─── Hero Slider Tab ──────────────────────────────────────────────────────

function HeroSliderTab({
  sections,
  onRefresh,
  onUpdateTitle,
  activeEditors,
}: {
  sections: HomepageSection[];
  onRefresh: (silent?: boolean) => Promise<void>;
  onUpdateTitle: (id: string, newTitle: string) => void;
  activeEditors: Record<string, Array<{ id: string; fullName: string; email: string }>>;
}) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = React.useState<HomepageSection | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [actionTarget, setActionTarget] = React.useState<HomepageSection | null>(null)
  const [isPublishing, setIsPublishing] = React.useState(false)

  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null)
  const [inlineTitleInput, setInlineTitleInput] = React.useState("")
  const [isSavingInlineTitle, setIsSavingInlineTitle] = React.useState(false)
  const isSavingRef = React.useRef(false)

  const handleSaveInlineTitle = async (sectionId: string) => {
    if (isSavingRef.current) return
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    const newTitle = inlineTitleInput.trim()
    if (!newTitle || newTitle === (section.title || "")) {
      setEditingSectionId(null)
      return
    }

    const originalTitle = section.title || ""
    onUpdateTitle(sectionId, newTitle)
    setEditingSectionId(null)

    isSavingRef.current = true
    setIsSavingInlineTitle(true)
    try {
      await homepageService.updateSection(sectionId, { title: newTitle })
      await onRefresh(true)
    } catch {
      onUpdateTitle(sectionId, originalTitle)
      alert("Đổi tên thất bại. Đang khôi phục tiêu đề.")
    } finally {
      isSavingRef.current = false
      setIsSavingInlineTitle(false)
    }
  }

  const handleCreate = () => router.push("/hero-slider/new")

  const handlePublish = async () => {
    if (!actionTarget) return
    setIsPublishing(true)
    try {
      await homepageService.updateSection(actionTarget.id, { status: ContentStatus.PUBLISHED })
      const others = sections.filter((s) => s.id !== actionTarget.id && s.status === ContentStatus.PUBLISHED)
      await Promise.all(others.map((s) => homepageService.updateSection(s.id, { status: ContentStatus.HIDDEN })))
      await onRefresh()
      setActionTarget(null)
    } catch {
      alert("Xuất bản thất bại.")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await homepageService.deleteSection(deleteTarget.id)
      setDeleteTarget(null)
      await onRefresh()
    } catch {
      alert("Xóa thất bại.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Banner Hero</h2>
          <p className="text-sm text-muted-foreground">Slider banner hiển thị trên trang chủ</p>
        </div>
        <Button onClick={handleCreate} className="rounded-xl">
          <IconPlus className="mr-2 size-4" />
          Tạo mới
        </Button>
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconCarouselHorizontal className="size-14 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-medium text-muted-foreground mb-1">Chưa có slider nào</h3>
          <p className="text-sm text-muted-foreground mb-3">Tạo slider đầu tiên để hiển thị trên trang chủ</p>
          <Button onClick={handleCreate} variant="outline" className="rounded-xl">
            <IconPlus className="mr-2 size-4" />
            Tạo slider
          </Button>
        </div>
      )}

      {/* Grid */}
      {sections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => {
            const thumbnail = getThumbnail(section)
            const slideCount = getSlideCount(section)
            const status = section.status || ContentStatus.PUBLISHED
            const statusInfo = statusConfig[status] ?? statusConfig[ContentStatus.PUBLISHED]
            return (
              <Card key={section.id} className="rounded-xl cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setActionTarget(section)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    {editingSectionId === section.id ? (
                      <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={inlineTitleInput}
                          onChange={(e) => setInlineTitleInput(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              await handleSaveInlineTitle(section.id)
                            } else if (e.key === "Escape") {
                              setEditingSectionId(null)
                            }
                          }}
                          onBlur={() => handleSaveInlineTitle(section.id)}
                          className="h-7 text-xs font-semibold px-2 py-0.5 rounded-md"
                          autoFocus
                          disabled={isSavingInlineTitle}
                        />
                      </div>
                    ) : (
                      <CardTitle
                        className="text-sm truncate flex-1 hover:underline cursor-pointer decoration-dotted decoration-primary/40 underline-offset-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSectionId(section.id)
                          setInlineTitleInput(section.title || "")
                        }}
                        title="Click để đổi tên"
                      >
                        {section.title || "Hero Slider"}
                      </CardTitle>
                    )}
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ml-2 ${statusInfo.className}`}>
                      {status === ContentStatus.PUBLISHED ? "Đang hiển thị" : statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mb-3">
                    {thumbnail ? (
                      <img src={thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconPhoto className="size-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{slideCount} slide{slideCount !== 1 ? "s" : ""}</span>
                      {section.updatedAt && (
                        <>
                          <span>•</span>
                          <span>Cập nhật: {new Date(section.updatedAt).toLocaleDateString("vi-VN")}</span>
                        </>
                      )}
                      {activeEditors[section.id] && activeEditors[section.id].length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium animate-pulse flex items-center gap-1" title={activeEditors[section.id].map(u => u.fullName).join(", ")}>
                            <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" />
                            Đang được sửa
                          </span>
                        </>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="size-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setDeleteTarget(section) }}>
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Action dialog */}
      <Dialog open={!!actionTarget} onOpenChange={() => setActionTarget(null)}>
        <DialogContent className="rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base truncate">
              {actionTarget?.title || "Hero Slider"}
            </DialogTitle>
            <DialogDescription>
              {actionTarget && getSlideCount(actionTarget)} slides ·{" "}
              {actionTarget && (actionTarget.status === ContentStatus.PUBLISHED ? "Đang hiển thị" : statusConfig[actionTarget.status || ContentStatus.DRAFT]?.label || actionTarget.status)}
            </DialogDescription>
          </DialogHeader>
          {actionTarget && getThumbnail(actionTarget) && (
            <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
              <img src={getThumbnail(actionTarget)!} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePublish} disabled={isPublishing || actionTarget?.status === ContentStatus.PUBLISHED} className="rounded-xl flex-1">
              {isPublishing ? <IconLoader2 className="size-3.5 mr-1.5 animate-spin" /> : <IconSend className="size-3.5 mr-1.5" />}
              Xuất bản
            </Button>
            <Button onClick={() => { if (actionTarget) router.push(`/hero-slider/${actionTarget.id}`) }} className="rounded-xl flex-1">
              <IconEdit className="size-3.5 mr-1.5" />
              Mở
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Xóa slider?</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa &quot;{deleteTarget?.title || "Hero Slider"}&quot;? Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-xl">
              {isDeleting ? <IconLoader2 className="size-3.5 mr-1 animate-spin" /> : null}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Catalog Banner Tab ───────────────────────────────────────────────────

function CatalogBannerTab({
  sections,
  onRefresh,
  onUpdateTitle,
  activeEditors,
}: {
  sections: HomepageSection[];
  onRefresh: (silent?: boolean) => Promise<void>;
  onUpdateTitle: (id: string, newTitle: string) => void;
  activeEditors: Record<string, Array<{ id: string; fullName: string; email: string }>>;
}) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = React.useState<HomepageSection | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [actionTarget, setActionTarget] = React.useState<HomepageSection | null>(null)
  const [isPublishing, setIsPublishing] = React.useState(false)

  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null)
  const [inlineTitleInput, setInlineTitleInput] = React.useState("")
  const [isSavingInlineTitle, setIsSavingInlineTitle] = React.useState(false)
  const isSavingRef = React.useRef(false)

  const handleSaveInlineTitle = async (sectionId: string) => {
    if (isSavingRef.current) return
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    const newTitle = inlineTitleInput.trim()
    if (!newTitle || newTitle === (section.title || "")) {
      setEditingSectionId(null)
      return
    }

    const originalTitle = section.title || ""
    onUpdateTitle(sectionId, newTitle)
    setEditingSectionId(null)

    isSavingRef.current = true
    setIsSavingInlineTitle(true)
    try {
      await homepageService.updateSection(sectionId, { title: newTitle })
      await onRefresh(true)
    } catch {
      onUpdateTitle(sectionId, originalTitle)
      alert("Đổi tên thất bại. Đang khôi phục tiêu đề.")
    } finally {
      isSavingRef.current = false
      setIsSavingInlineTitle(false)
    }
  }

  const handleCreate = () => {
    router.push("/hero-slider/catalog/new")
  }

  const handlePublish = async () => {
    if (!actionTarget) return
    setIsPublishing(true)
    try {
      await homepageService.updateSection(actionTarget.id, { status: ContentStatus.PUBLISHED })
      const others = sections.filter((s) => s.id !== actionTarget.id && s.status === ContentStatus.PUBLISHED)
      await Promise.all(others.map((s) => homepageService.updateSection(s.id, { status: ContentStatus.HIDDEN })))
      await onRefresh()
      setActionTarget(null)
    } catch {
      alert("Xuất bản thất bại.")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await homepageService.deleteSection(deleteTarget.id)
      setDeleteTarget(null)
      await onRefresh()
    } catch {
      alert("Xóa thất bại.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Banner Catalog</h2>
          <p className="text-sm text-muted-foreground">Banner cho các trang danh mục (boot nam, nữ, phụ kiện...)</p>
        </div>
        <Button onClick={handleCreate} className="rounded-xl">
          <IconPlus className="mr-2 size-4" />
          Tạo mới
        </Button>
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconLayoutGrid className="size-14 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-medium text-muted-foreground mb-1">Chưa có banner catalog nào</h3>
          <p className="text-sm text-muted-foreground mb-3">Tạo banner catalog cho các trang danh mục</p>
          <Button onClick={handleCreate} variant="outline" className="rounded-xl">
            <IconPlus className="mr-2 size-4" />
            Tạo banner catalog
          </Button>
        </div>
      )}

      {/* Grid */}
      {sections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => {
            const firstImage = getCatalogFirstImage(section)
            const slotCount = getCatalogSlotCount(section)
            const status = section.status || ContentStatus.PUBLISHED
            const statusInfo = statusConfig[status] ?? statusConfig[ContentStatus.PUBLISHED]
            return (
              <Card key={section.id} className="rounded-xl cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setActionTarget(section)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    {editingSectionId === section.id ? (
                      <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={inlineTitleInput}
                          onChange={(e) => setInlineTitleInput(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              await handleSaveInlineTitle(section.id)
                            } else if (e.key === "Escape") {
                              setEditingSectionId(null)
                            }
                          }}
                          onBlur={() => handleSaveInlineTitle(section.id)}
                          className="h-7 text-xs font-semibold px-2 py-0.5 rounded-md"
                          autoFocus
                          disabled={isSavingInlineTitle}
                        />
                      </div>
                    ) : (
                      <CardTitle
                        className="text-sm truncate flex-1 hover:underline cursor-pointer decoration-dotted decoration-primary/40 underline-offset-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSectionId(section.id)
                          setInlineTitleInput(section.title || "")
                        }}
                        title="Click để đổi tên"
                      >
                        {section.title || "Banner Catalog"}
                      </CardTitle>
                    )}
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ml-2 ${statusInfo.className}`}>
                      {status === ContentStatus.PUBLISHED ? "Đang hiển thị" : statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mb-3">
                    {firstImage ? (
                      <img src={firstImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconLayoutGrid className="size-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{slotCount} slot{slotCount !== 1 ? "s" : ""}</span>
                      {section.updatedAt && (
                        <>
                          <span>•</span>
                          <span>Cập nhật: {new Date(section.updatedAt).toLocaleDateString("vi-VN")}</span>
                        </>
                      )}
                      {activeEditors[section.id] && activeEditors[section.id].length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium animate-pulse flex items-center gap-1" title={activeEditors[section.id].map(u => u.fullName).join(", ")}>
                            <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" />
                            Đang được sửa
                          </span>
                        </>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="size-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setDeleteTarget(section) }}>
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Action dialog */}
      <Dialog open={!!actionTarget} onOpenChange={() => setActionTarget(null)}>
        <DialogContent className="rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base truncate">
              {actionTarget?.title || "Banner Catalog"}
            </DialogTitle>
            <DialogDescription>
              {actionTarget && getCatalogSlotCount(actionTarget)} slots ·{" "}
              {actionTarget && (actionTarget.status === ContentStatus.PUBLISHED ? "Đang hiển thị" : statusConfig[actionTarget.status || ContentStatus.DRAFT]?.label || actionTarget.status)}
            </DialogDescription>
          </DialogHeader>
          {actionTarget && getCatalogFirstImage(actionTarget) && (
            <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
              <img src={getCatalogFirstImage(actionTarget)!} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePublish} disabled={isPublishing || actionTarget?.status === ContentStatus.PUBLISHED} className="rounded-xl flex-1">
              {isPublishing ? <IconLoader2 className="size-3.5 mr-1.5 animate-spin" /> : <IconSend className="size-3.5 mr-1.5" />}
              Xuất bản
            </Button>
            <Button onClick={() => { if (actionTarget) router.push(`/hero-slider/catalog/${actionTarget.id}`) }} className="rounded-xl flex-1">
              <IconEdit className="size-3.5 mr-1.5" />
              Mở
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Xóa banner catalog?</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa &quot;{deleteTarget?.title || "Banner Catalog"}&quot;? Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-xl">
              {isDeleting ? <IconLoader2 className="size-3.5 mr-1 animate-spin" /> : null}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function BannerListPage() {
  const router = useRouter()
  const [heroSections, setHeroSections] = React.useState<HomepageSection[]>([])
  const [catalogSections, setCatalogSections] = React.useState<HomepageSection[]>([])
  const [activeEditors, setActiveEditors] = React.useState<Record<string, Array<{ id: string; fullName: string; email: string }>>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("hero")

  // Sync tab from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab === "catalog" || tab === "hero") {
      setActiveTab(tab)
    }
  }, [])

  // Sync tab to URL on change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.replace(`/hero-slider?tab=${tab}`, { scroll: false })
  }

  const loadSections = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const result = await homepageService.getSections()
      const all = result.data ?? []
      setHeroSections(all.filter((s) => s.type === "HERO"))
      setCatalogSections(all.filter((s) => s.type === "CUSTOM"))
    } catch {
      setHeroSections([])
      setCatalogSections([])
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [])

  const updateSectionTitle = (id: string, newTitle: string) => {
    setHeroSections((prev) => prev.map((s) => s.id === id ? { ...s, title: newTitle } : s))
    setCatalogSections((prev) => prev.map((s) => s.id === id ? { ...s, title: newTitle } : s))
  }

  const loadActiveEditors = React.useCallback(async () => {
    try {
      const active = await homepageService.getActiveEditors()
      setActiveEditors(active || {})
    } catch (err) {
      console.error("Failed to load active editors", err)
    }
  }, [])

  React.useEffect(() => {
    loadSections()
    loadActiveEditors()

    const interval = setInterval(() => {
      loadActiveEditors()
    }, 5000)

    return () => clearInterval(interval)
  }, [loadSections, loadActiveEditors])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Banner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý banner trang chủ và banner danh mục
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="hero" className="rounded-lg text-xs">
            <IconCarouselHorizontal className="size-3.5 mr-1.5" />
            Banner Hero
          </TabsTrigger>
          <TabsTrigger value="catalog" className="rounded-lg text-xs">
            <IconLayoutGrid className="size-3.5 mr-1.5" />
            Banner Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroSliderTab sections={heroSections} onRefresh={loadSections} onUpdateTitle={updateSectionTitle} activeEditors={activeEditors} />
        </TabsContent>

        <TabsContent value="catalog">
          <CatalogBannerTab sections={catalogSections} onRefresh={loadSections} onUpdateTitle={updateSectionTitle} activeEditors={activeEditors} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
