"use client"

import * as React from "react"
import {
  IconDeviceFloppy,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconLoader2,
  IconPhoto,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { homepageService } from "@/lib/api/services/homepage.service"
import {
  CreateHomepageItemPayload,
  CreateHomepageSectionPayload,
  HomepageItem,
  HomepageSection,
} from "@/lib/api/schemas/homepage.schema"
import { ContentStatus, HomepageSectionType } from "@/lib/api/schemas/enums"
import { Media } from "@/lib/api/schemas/media.schema"

const statusConfig: Record<string, { className: string; label: string }> = {
  [ContentStatus.PUBLISHED]: { className: "bg-emerald-100 text-emerald-700", label: "Hiển thị" },
  [ContentStatus.DRAFT]: { className: "bg-slate-100 text-slate-700", label: "Bản nháp" },
  [ContentStatus.HIDDEN]: { className: "bg-amber-100 text-amber-700", label: "Đã ẩn" },
  [ContentStatus.ARCHIVED]: { className: "bg-zinc-100 text-zinc-700", label: "Lưu trữ" },
}

const sectionTypeOptions = [
  { value: HomepageSectionType.HERO, label: "Hero chính" },
  { value: HomepageSectionType.SALE_BANNER, label: "Banner khuyến mãi" },
  { value: HomepageSectionType.FEATURED_PRODUCTS, label: "Bộ sưu tập nổi bật" },
  { value: HomepageSectionType.BEST_SELLERS, label: "Sản phẩm bán chạy" },
  { value: HomepageSectionType.NEW_PRODUCTS, label: "Sản phẩm mới" },
  { value: HomepageSectionType.MEN_PRODUCTS, label: "Giày nam" },
  { value: HomepageSectionType.WOMEN_PRODUCTS, label: "Giày nữ" },
  { value: HomepageSectionType.FEEDBACK, label: "Feedback/Testimonial" },
  { value: HomepageSectionType.VIDEO, label: "Video" },
  { value: HomepageSectionType.SERVICE_COMMITMENT, label: "Cam kết dịch vụ" },
  { value: HomepageSectionType.CTA, label: "CTA" },
  { value: HomepageSectionType.CUSTOM, label: "Tuỳ chỉnh" },
]

const staticPageDefaults = [
  { key: "contact", label: "Liên hệ", slug: "/contact" },
  { key: "warranty", label: "Bảo hành", slug: "/warranty" },
  { key: "return", label: "Đổi trả", slug: "/return" },
  { key: "shipping", label: "Vận chuyển", slug: "/shipping" },
  { key: "privacy", label: "Bảo mật", slug: "/privacy" },
  { key: "faq", label: "FAQ", slug: "/faq" },
]

type StaticPageDraft = {
  key: string
  label: string
  slug: string
  title: string
  content: string
  seoTitle: string
  seoDescription: string
}

type SectionForm = CreateHomepageSectionPayload & {
  id?: string
  imagePreviewUrl?: string
  metadataText: string
}

const createEmptySectionForm = (sortOrder: number): SectionForm => ({
  type: HomepageSectionType.CUSTOM,
  title: "",
  subtitle: "",
  content: "",
  imageMediaId: "",
  ctaLabel: "",
  ctaUrl: "",
  status: ContentStatus.DRAFT,
  sortOrder,
  metadata: {},
  metadataText: "{}",
})

const createSectionForm = (section: HomepageSection): SectionForm => ({
  id: section.id,
  type: section.type,
  title: section.title ?? "",
  subtitle: section.subtitle ?? "",
  content: section.content ?? "",
  imageMediaId: section.imageMediaId ?? "",
  ctaLabel: section.ctaLabel ?? "",
  ctaUrl: section.ctaUrl ?? "",
  status: section.status,
  sortOrder: section.sortOrder,
  metadata: section.metadata ?? {},
  metadataText: JSON.stringify(section.metadata ?? {}, null, 2),
})

const createPayload = (form: SectionForm): CreateHomepageSectionPayload => {
  let metadata: Record<string, any> = {}
  try {
    metadata = form.metadataText.trim() ? JSON.parse(form.metadataText) : {}
  } catch {
    metadata = {}
  }

  return {
    type: form.type,
    title: form.title?.trim() || null,
    subtitle: form.subtitle?.trim() || null,
    content: form.content?.trim() || null,
    imageMediaId: form.imageMediaId || null,
    ctaLabel: form.ctaLabel?.trim() || null,
    ctaUrl: form.ctaUrl?.trim() || null,
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
    metadata,
  }
}

const createEmptyItemForm = (): CreateHomepageItemPayload => ({
  title: "",
  subtitle: "",
  content: "",
  imageMediaId: "",
  productId: "",
  ctaLabel: "",
  ctaUrl: "",
  sortOrder: 0,
})

export default function HomeContentPage() {
  const [sections, setSections] = React.useState<HomepageSection[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [mediaTarget, setMediaTarget] = React.useState<"section" | "item">("section")
  const [sectionForm, setSectionForm] = React.useState<SectionForm>(() => createEmptySectionForm(1))
  const [itemForm, setItemForm] = React.useState<CreateHomepageItemPayload>(() => createEmptyItemForm())
  const [staticPages, setStaticPages] = React.useState<StaticPageDraft[]>([])
  const [selectedStaticKey, setSelectedStaticKey] = React.useState(staticPageDefaults[0].key)

  const fetchSections = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await homepageService.getSections({ limit: 100 })
      setSections([...data.data].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (error) {
      console.error("Failed to fetch homepage sections", error)
      setSections([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSections()
  }, [fetchSections])

  React.useEffect(() => {
    const rawDrafts = window.localStorage.getItem("duky-static-page-drafts")
    if (rawDrafts) {
      setStaticPages(JSON.parse(rawDrafts) as StaticPageDraft[])
      return
    }

    setStaticPages(
      staticPageDefaults.map((page) => ({
        ...page,
        title: page.label,
        content: "",
        seoTitle: page.label,
        seoDescription: "",
      }))
    )
  }, [])

  const selectedStaticPage = staticPages.find((page) => page.key === selectedStaticKey)

  const openCreate = () => {
    setSectionForm(createEmptySectionForm(sections.length + 1))
    setItemForm(createEmptyItemForm())
    setEditorOpen(true)
  }

  const openEdit = (section: HomepageSection) => {
    setSectionForm(createSectionForm(section))
    setItemForm(createEmptyItemForm())
    setEditorOpen(true)
  }

  const handleSaveSection = async () => {
    try {
      JSON.parse(sectionForm.metadataText || "{}")
    } catch {
      alert("Metadata JSON chưa hợp lệ.")
      return
    }

    try {
      setIsSaving(true)
      const payload = createPayload(sectionForm)
      if (sectionForm.id) {
        await homepageService.updateSection(sectionForm.id, payload)
      } else {
        await homepageService.createSection(payload)
      }
      setEditorOpen(false)
      fetchSections()
    } catch (error) {
      console.error("Failed to save section", error)
      alert("Chưa lưu được section. Kiểm tra API/backend rồi thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!sectionForm.id) {
      alert("Lưu section trước khi thêm item.")
      return
    }

    try {
      setIsSaving(true)
      await homepageService.createItem(sectionForm.id, {
        ...itemForm,
        title: itemForm.title || null,
        subtitle: itemForm.subtitle || null,
        content: itemForm.content || null,
        imageMediaId: itemForm.imageMediaId || null,
        productId: itemForm.productId || null,
        ctaLabel: itemForm.ctaLabel || null,
        ctaUrl: itemForm.ctaUrl || null,
        sortOrder: Number(itemForm.sortOrder) || 0,
      })
      setItemForm(createEmptyItemForm())
      const freshSection = await homepageService.getSection(sectionForm.id)
      setSectionForm(createSectionForm(freshSection))
      setSections((current) =>
        current.map((section) => (section.id === freshSection.id ? freshSection : section))
      )
    } catch (error) {
      console.error("Failed to add homepage item", error)
      alert("Chưa thêm được item.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSection = async (section: HomepageSection) => {
    if (!window.confirm(`Xoá section "${section.title || section.type}"?`)) return
    try {
      await homepageService.deleteSection(section.id)
      fetchSections()
    } catch (error) {
      console.error("Failed to delete section", error)
      alert("Chưa xoá được section.")
    }
  }

  const handleToggleVisibility = async (section: HomepageSection) => {
    const nextStatus =
      section.status === ContentStatus.PUBLISHED ? ContentStatus.HIDDEN : ContentStatus.PUBLISHED
    try {
      await homepageService.updateSection(section.id, { status: nextStatus })
      fetchSections()
    } catch (error) {
      console.error("Failed to update section status", error)
    }
  }

  const handleDuplicate = async (section: HomepageSection) => {
    try {
      await homepageService.createSection({
        type: section.type,
        title: `${section.title || section.type} copy`,
        subtitle: section.subtitle ?? null,
        content: section.content ?? null,
        imageMediaId: section.imageMediaId ?? null,
        ctaLabel: section.ctaLabel ?? null,
        ctaUrl: section.ctaUrl ?? null,
        status: ContentStatus.DRAFT,
        sortOrder: sections.length + 1,
        metadata: section.metadata ?? {},
      })
      fetchSections()
    } catch (error) {
      console.error("Failed to duplicate section", error)
    }
  }

  const handleMediaSelect = (media: Media) => {
    if (mediaTarget === "item") {
      setItemForm((current) => ({ ...current, imageMediaId: media.id }))
      return
    }
    setSectionForm((current) => ({ ...current, imageMediaId: media.id, imagePreviewUrl: media.url }))
  }

  const saveStaticDrafts = () => {
    window.localStorage.setItem("duky-static-page-drafts", JSON.stringify(staticPages))
    alert("Đã lưu bản nháp static pages trên dashboard.")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang chủ & nội dung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý hero, banners, collection sản phẩm, blog/testimonial, CTA và các trang tĩnh.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSections} disabled={isLoading} className="rounded-xl">
            {isLoading ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconRefresh className="mr-2 size-4" />}
            Tải lại
          </Button>
          <Button onClick={openCreate} className="rounded-xl">
            <IconPlus className="mr-2 size-4" />
            Thêm section
          </Button>
        </div>
      </div>

      <Tabs defaultValue="homepage" className="gap-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="homepage">Dựng trang chủ</TabsTrigger>
          <TabsTrigger value="static">Trang tĩnh</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              Chưa có section nào. Tạo hero hoặc banner đầu tiên để bắt đầu dựng trang chủ.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {sections.map((section) => (
                <Card key={section.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-1 text-muted-foreground">
                          <IconGripVertical className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold">
                              {section.title || "Chưa có tiêu đề"}
                            </h3>
                            <Badge variant="secondary" className={`rounded-md ${statusConfig[section.status]?.className}`}>
                              {statusConfig[section.status]?.label || section.status}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="rounded-md font-mono text-[10px]">
                              {section.type}
                            </Badge>
                            <span>Thứ tự {section.sortOrder}</span>
                            <span>{section.items?.length || 0} item</span>
                          </div>
                          {section.subtitle ? (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{section.subtitle}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(section)} className="rounded-lg">
                          Cấu hình
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem onClick={() => openEdit(section)} className="rounded-lg">
                              <IconEdit className="mr-2 size-4" /> Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleVisibility(section)} className="rounded-lg">
                              {section.status === ContentStatus.PUBLISHED ? (
                                <IconEyeOff className="mr-2 size-4" />
                              ) : (
                                <IconEye className="mr-2 size-4" />
                              )}
                              {section.status === ContentStatus.PUBLISHED ? "Ẩn" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(section)} className="rounded-lg">
                              <IconPlus className="mr-2 size-4" /> Nhân bản
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSection(section)}
                              className="rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <IconTrash className="mr-2 size-4" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="static" className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Trang tĩnh</CardTitle>
              <CardDescription>Contact, warranty, return, shipping, privacy, FAQ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {staticPages.map((page) => (
                <Button
                  key={page.key}
                  type="button"
                  variant={selectedStaticKey === page.key ? "default" : "ghost"}
                  className="w-full justify-start rounded-lg"
                  onClick={() => setSelectedStaticKey(page.key)}
                >
                  {page.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>{selectedStaticPage?.label || "Static page"}</CardTitle>
              <CardDescription>
                Backend chưa có endpoint riêng cho static page, nên phần này lưu draft local để đội dev nối API sau.
              </CardDescription>
            </CardHeader>
            {selectedStaticPage ? (
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tiêu đề</Label>
                    <Input
                      value={selectedStaticPage.title}
                      onChange={(event) =>
                        setStaticPages((current) =>
                          current.map((page) =>
                            page.key === selectedStaticKey ? { ...page, title: event.target.value } : page
                          )
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Đường dẫn</Label>
                    <Input value={selectedStaticPage.slug} disabled className="rounded-xl font-mono text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <Textarea
                    value={selectedStaticPage.content}
                    onChange={(event) =>
                      setStaticPages((current) =>
                        current.map((page) =>
                          page.key === selectedStaticKey ? { ...page, content: event.target.value } : page
                        )
                      )
                    }
                    className="min-h-[260px] rounded-xl"
                    placeholder="Nhập nội dung trang..."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tiêu đề SEO</Label>
                    <Input
                      value={selectedStaticPage.seoTitle}
                      onChange={(event) =>
                        setStaticPages((current) =>
                          current.map((page) =>
                            page.key === selectedStaticKey ? { ...page, seoTitle: event.target.value } : page
                          )
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả SEO</Label>
                    <Input
                      value={selectedStaticPage.seoDescription}
                      onChange={(event) =>
                        setStaticPages((current) =>
                          current.map((page) =>
                            page.key === selectedStaticKey
                              ? { ...page, seoDescription: event.target.value }
                              : page
                          )
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <Button type="button" onClick={saveStaticDrafts} className="rounded-xl">
                  <IconDeviceFloppy className="mr-2 size-4" />
                  Lưu draft static pages
                </Button>
              </CardContent>
            ) : null}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{sectionForm.id ? "Cấu hình section" : "Thêm section mới"}</DialogTitle>
            <DialogDescription>
              Dùng cho hero, banners, product collections, blog/testimonials, CTA và block tuỳ chỉnh.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Loại section</Label>
                  <Select
                    value={sectionForm.type}
                    onValueChange={(value) => setSectionForm((current) => ({ ...current, type: value as any }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {sectionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select
                    value={sectionForm.status}
                    onValueChange={(value) => setSectionForm((current) => ({ ...current, status: value as any }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value={ContentStatus.PUBLISHED}>Hiển thị</SelectItem>
                      <SelectItem value={ContentStatus.DRAFT}>Bản nháp</SelectItem>
                      <SelectItem value={ContentStatus.HIDDEN}>Ẩn</SelectItem>
                      <SelectItem value={ContentStatus.ARCHIVED}>Lưu trữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={sectionForm.title ?? ""}
                  onChange={(event) => setSectionForm((current) => ({ ...current, title: event.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề phụ</Label>
                <Input
                  value={sectionForm.subtitle ?? ""}
                  onChange={(event) => setSectionForm((current) => ({ ...current, subtitle: event.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea
                  value={sectionForm.content ?? ""}
                  onChange={(event) => setSectionForm((current) => ({ ...current, content: event.target.value }))}
                  className="min-h-[120px] rounded-xl"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nhãn CTA</Label>
                  <Input
                    value={sectionForm.ctaLabel ?? ""}
                    onChange={(event) => setSectionForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Link CTA</Label>
                  <Input
                    value={sectionForm.ctaUrl ?? ""}
                    onChange={(event) => setSectionForm((current) => ({ ...current, ctaUrl: event.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Thứ tự hiển thị</Label>
                  <Input
                    type="number"
                    value={sectionForm.sortOrder}
                    onChange={(event) =>
                      setSectionForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID media</Label>
                  <div className="flex gap-2">
                    <Input value={sectionForm.imageMediaId ?? ""} readOnly className="rounded-xl font-mono text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMediaTarget("section")
                        setMediaPickerOpen(true)
                      }}
                      className="rounded-xl"
                    >
                      <IconPhoto className="mr-2 size-4" />
                      Chọn
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dữ liệu metadata JSON</Label>
                <Textarea
                  value={sectionForm.metadataText}
                  onChange={(event) =>
                    setSectionForm((current) => ({ ...current, metadataText: event.target.value }))
                  }
                  className="min-h-[120px] rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">Preview nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                    {sectionForm.imagePreviewUrl ? (
                      <img src={sectionForm.imagePreviewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <IconPhoto className="size-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{sectionForm.title || "Tiêu đề section"}</p>
                    <p className="text-sm text-muted-foreground">{sectionForm.subtitle || "Subtitle"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">Các item trong section</CardTitle>
                  <CardDescription>
                    Dùng cho collections, feedback, banner phụ hoặc CTA con.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(sections.find((section) => section.id === sectionForm.id)?.items || []).map((item: HomepageItem) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{item.title || "Untitled item"}</p>
                      <p className="text-xs text-muted-foreground">{item.ctaUrl || item.productId || "Không có link"}</p>
                    </div>
                  ))}
                  <Input
                    placeholder="Tiêu đề item"
                    value={itemForm.title ?? ""}
                    onChange={(event) => setItemForm((current) => ({ ...current, title: event.target.value }))}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Product ID hoặc để trống"
                    value={itemForm.productId ?? ""}
                    onChange={(event) => setItemForm((current) => ({ ...current, productId: event.target.value }))}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="CTA URL"
                    value={itemForm.ctaUrl ?? ""}
                    onChange={(event) => setItemForm((current) => ({ ...current, ctaUrl: event.target.value }))}
                    className="rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMediaTarget("item")
                      setMediaPickerOpen(true)
                    }}
                    className="w-full rounded-xl"
                  >
                    <IconPhoto className="mr-2 size-4" />
                    Chọn ảnh item
                  </Button>
                  <Button type="button" onClick={handleAddItem} disabled={isSaving} className="w-full rounded-xl">
                    <IconPlus className="mr-2 size-4" />
                    Thêm item
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button type="button" onClick={handleSaveSection} disabled={isSaving} className="rounded-xl">
              {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
              Lưu section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        title="Chọn ảnh cho nội dung trang chủ"
      />
    </div>
  )
}
