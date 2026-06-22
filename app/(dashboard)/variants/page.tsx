"use client"

import * as React from "react"
import { IconLoader2, IconPlus, IconSearch, IconSettings, IconTrash, IconX, IconGripVertical, IconDeviceFloppy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductAttribute } from "@/lib/api/schemas/product-attribute.schema"
import { productAttributeService } from "@/lib/api/services/product-attribute.service"

const slugify = (value: string) =>
  value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export default function VariantsPage() {
  const [attributes, setAttributes] = React.useState<ProductAttribute[]>([])
  const [selectedAttribute, setSelectedAttribute] = React.useState<ProductAttribute | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ProductAttribute | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [form, setForm] = React.useState({ name: "", slug: "", type: "OTHER", sortBy: "custom", swatch: "default" })
  const [termName, setTermName] = React.useState("")
  const [deleteTermTarget, setDeleteTermTarget] = React.useState<{ id: string; name: string } | null>(null)
  const [toast, setToast] = React.useState<{ message: string; tone: "success" | "error" | "info" } | null>(null)
  const [draggingTermId, setDraggingTermId] = React.useState<string | null>(null)
  const [dragOverTermId, setDragOverTermId] = React.useState<string | null>(null)
  const [isTermsOrderDirty, setIsTermsOrderDirty] = React.useState(false)

  const fetchAttributes = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await productAttributeService.getAttributes({ search: searchQuery || undefined, limit: 100 })
      setAttributes(result.data)
      setSelectedAttribute((current) => current ? result.data.find((item) => item.id === current.id) ?? null : null)
    } catch (error) {
      console.error("Failed to fetch product attributes", error)
      setAttributes([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  React.useEffect(() => {
    const timer = window.setTimeout(fetchAttributes, 250)
    return () => window.clearTimeout(timer)
  }, [fetchAttributes])

  React.useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(null), 3000)
      return () => window.clearTimeout(timer)
    }
  }, [toast])

  const resetForm = () => {
    setSelectedAttribute(null)
    setForm({ name: "", slug: "", type: "OTHER", sortBy: "custom", swatch: "default" })
    setTermName("")
    setIsTermsOrderDirty(false)
  }

  const handleSubmitAttribute = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        type: form.type as ProductAttribute["type"],
        sortBy: form.sortBy,
        swatch: form.swatch,
        isVisible: true,
        sortOrder: 0,
      }
      if (selectedAttribute) {
        await productAttributeService.updateAttribute(selectedAttribute.id, payload)
      } else {
        await productAttributeService.createAttribute(payload)
      }
      resetForm()
      fetchAttributes()
    } catch (error) {
      console.error("Failed to save product attribute", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectAttribute = (attribute: ProductAttribute) => {
    setSelectedAttribute(attribute)
    setForm({
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      sortBy: attribute.sortBy,
      swatch: attribute.swatch,
    })
    setTermName("")
    setIsTermsOrderDirty(false)
  }

  const handleCreateTerm = async () => {
    if (!selectedAttribute || !termName.trim()) return
    try {
      setIsSaving(true)
      await productAttributeService.createTerm(selectedAttribute.id, {
        name: termName.trim(),
        slug: slugify(termName),
        value: selectedAttribute.type === "COLOR" ? termName.trim() : null,
        metadata: null,
        sortOrder: selectedAttribute.terms.length,
      })
      setTermName("")
      fetchAttributes()
    } catch (error) {
      console.error("Failed to create attribute term", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTerm = (termId: string, name: string) => {
    setDeleteTermTarget({ id: termId, name })
  }

  const handleDragStartTerm = (event: React.DragEvent, termId: string) => {
    event.dataTransfer.setData("text/plain", termId)
    setDraggingTermId(termId)
  }

  const handleDragOverTerm = (event: React.DragEvent, termId: string) => {
    event.preventDefault()
    if (draggingTermId && draggingTermId !== termId) {
      setDragOverTermId(termId)
    }
  }

  const handleDropTerm = (event: React.DragEvent, targetTermId: string) => {
    event.preventDefault()
    const sourceTermId = event.dataTransfer.getData("text/plain")
    if (!sourceTermId || sourceTermId === targetTermId || !selectedAttribute) {
      setDraggingTermId(null)
      setDragOverTermId(null)
      return
    }

    const currentTerms = [...selectedAttribute.terms]
    const sourceIndex = currentTerms.findIndex((t) => t.id === sourceTermId)
    const targetIndex = currentTerms.findIndex((t) => t.id === targetTermId)
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingTermId(null)
      setDragOverTermId(null)
      return
    }

    const [movedTerm] = currentTerms.splice(sourceIndex, 1)
    currentTerms.splice(targetIndex, 0, movedTerm)

    const updatedTerms = currentTerms.map((t, index) => ({
      ...t,
      sortOrder: index,
    }))

    const updatedAttribute = {
      ...selectedAttribute,
      terms: updatedTerms,
    }
    setSelectedAttribute(updatedAttribute)
    setAttributes((prev) =>
      prev.map((attr) => (attr.id === selectedAttribute.id ? updatedAttribute : attr))
    )
    setIsTermsOrderDirty(true)
    setDraggingTermId(null)
    setDragOverTermId(null)
  }

  const handleSaveTermsOrder = async () => {
    if (!selectedAttribute || !isTermsOrderDirty) return
    try {
      setIsSaving(true)
      await Promise.all(
        selectedAttribute.terms.map((t) =>
          productAttributeService.updateTerm(t.id, {
            name: t.name,
            slug: t.slug,
            sortOrder: t.sortOrder,
            value: t.value,
          })
        )
      )
      setToast({ message: "Đã lưu thứ tự chủng loại thành công", tone: "success" })
      setIsTermsOrderDirty(false)
      fetchAttributes()
    } catch (error) {
      console.error("Failed to save terms order", error)
      setToast({ message: "Lỗi khi lưu thứ tự chủng loại", tone: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDeleteTerm = async () => {
    if (!deleteTermTarget) return
    try {
      setIsSaving(true)
      await productAttributeService.deleteTerm(deleteTermTarget.id)
      setToast({ message: `Đã xóa giá trị thuộc tính "${deleteTermTarget.name}" thành công`, tone: "success" })
      setDeleteTermTarget(null)
      await fetchAttributes()
    } catch (error) {
      console.error("Failed to delete attribute term", error)
      setToast({ message: `Lỗi khi xóa giá trị thuộc tính: ${(error as any)?.message || "Không xác định"}`, tone: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAttribute = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await productAttributeService.deleteAttribute(deleteTarget.id)
      if (selectedAttribute?.id === deleteTarget.id) {
        resetForm()
      }
      setDeleteTarget(null)
      fetchAttributes()
    } catch (error) {
      console.error("Failed to delete product attribute", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
    <div className="grid gap-6 p-6 lg:grid-cols-[380px_1fr]">
      <section className="rounded-xl border bg-card p-5">
        <h1 className="text-xl font-bold">Các thuộc tính</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tạo thuộc tính toàn cục như kích thước, màu sắc, thương hiệu. Sau đó vào sản phẩm để chọn các giá trị như 39, 40.</p>

        <form onSubmit={handleSubmitAttribute} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Tên</Label>
            <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value, slug: prev.slug || slugify(event.target.value) }))} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Đường dẫn tĩnh</Label>
            <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIZE">Kích thước</SelectItem>
                  <SelectItem value="COLOR">Màu sắc</SelectItem>
                  <SelectItem value="MATERIAL">Chất liệu</SelectItem>
                  <SelectItem value="STYLE">Kiểu dáng</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sắp xếp</Label>
              <Select value={form.sortBy} onValueChange={(value) => setForm((prev) => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  <SelectItem value="name">Tên</SelectItem>
                  <SelectItem value="name_numeric">Tên (bằng số)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kiểu hiển thị thuộc tính</Label>
            <Select value={form.swatch} onValueChange={(value) => setForm((prev) => ({ ...prev, swatch: value }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Mặc định</SelectItem>
                <SelectItem value="color">Ô màu</SelectItem>
                <SelectItem value="image">Ô ảnh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled={isSaving || !form.name.trim()} className="w-full rounded-xl">
            {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconPlus className="mr-2 size-4" />}
            {selectedAttribute ? "Cập nhật thuộc tính" : "Thêm thuộc tính"}
          </Button>
          {selectedAttribute && (
            <Button type="button" variant="outline" onClick={resetForm} className="w-full rounded-xl">
              Hủy sửa
            </Button>
          )}
        </form>

        {selectedAttribute && (
          <div className="mt-6 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Cấu hình chủng loại</div>
              {isTermsOrderDirty && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTermsOrder}
                  disabled={isSaving}
                  className="h-7 rounded-lg border-orange-200 bg-orange-50 text-xs font-semibold text-orange-700 hover:bg-orange-100 hover:text-orange-800 gap-1 px-2.5 py-0"
                >
                  {isSaving ? <IconLoader2 className="size-3 animate-spin" /> : <IconDeviceFloppy className="size-3" />}
                  Lưu thứ tự mới
                </Button>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={termName} onChange={(event) => setTermName(event.target.value)} placeholder="VD: 39, 40, Đen..." className="rounded-xl" />
              <Button type="button" onClick={handleCreateTerm} disabled={isSaving || !termName.trim()} className="rounded-xl">Thêm</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedAttribute.terms.map((term) => (
                <span
                  key={term.id}
                  draggable={!isSaving}
                  onDragStart={(e) => handleDragStartTerm(e, term.id)}
                  onDragOver={(e) => handleDragOverTerm(e, term.id)}
                  onDragEnd={() => {
                    setDraggingTermId(null)
                    setDragOverTermId(null)
                  }}
                  onDrop={(e) => handleDropTerm(e, term.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm text-foreground transition-all select-none cursor-grab active:cursor-grabbing ${
                    draggingTermId === term.id ? "opacity-40 scale-95" : ""
                  } ${
                    dragOverTermId === term.id
                      ? "border-dashed border-orange-50 bg-orange-50"
                      : "bg-white border-stone-200 hover:bg-muted/30"
                  }`}
                >
                  <IconGripVertical className="size-3 text-muted-foreground shrink-0" />
                  <span>{term.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTerm(term.id, term.name)}
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-destructive focus:outline-none transition-all ml-1"
                    title={`Xóa ${term.name}`}
                  >
                    <IconX className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-4 border-b p-4">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm thuộc tính..." className="rounded-xl pl-9" />
          </div>
          {isLoading && <IconLoader2 className="size-5 animate-spin text-primary" />}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Đường dẫn tĩnh</TableHead>
              <TableHead>Sắp xếp theo</TableHead>
              <TableHead>Tên chủng loại</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributes.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Chưa có thuộc tính.</TableCell></TableRow>
            ) : attributes.map((attribute) => (
              <TableRow key={attribute.id} className="cursor-pointer hover:bg-orange-50/50" onClick={() => handleSelectAttribute(attribute)}>
                <TableCell className="font-semibold text-primary">{attribute.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{attribute.slug}</TableCell>
                <TableCell>{attribute.sortBy === "name_numeric" ? "Tên (bằng số)" : attribute.sortBy === "name" ? "Tên" : "Tùy chỉnh sắp xếp"}</TableCell>
                <TableCell className="max-w-[520px]">
                  <div className="line-clamp-2 text-sm">{attribute.terms.map((term) => term.name).join(", ") || "Chưa có"}</div>
                  <button type="button" className="mt-1 inline-flex items-center text-sm text-primary" onClick={(event) => { event.stopPropagation(); handleSelectAttribute(attribute) }}>
                    <IconSettings className="mr-1 size-4" /> Cấu hình chủng loại của thuộc tính sản phẩm
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-destructive"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeleteTarget(attribute)
                    }}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa thuộc tính?</DialogTitle>
          <DialogDescription>
            Thuộc tính "{deleteTarget?.name}" và các chủng loại bên trong sẽ bị ẩn khỏi danh sách quản trị. Hành động này có thể ảnh hưởng tới cấu hình biến thể sản phẩm.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" className="rounded-xl" onClick={handleDeleteAttribute} disabled={isDeleting}>
            {isDeleting && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Xóa thuộc tính
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={!!deleteTermTarget} onOpenChange={(open) => !open && setDeleteTermTarget(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa giá trị thuộc tính?</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa giá trị "{deleteTermTarget?.name}" này không?
            Hành động này chỉ ẩn giá trị khỏi danh sách chọn khi tạo sản phẩm mới, không ảnh hưởng đến các sản phẩm cũ đã có biến thể này.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTermTarget(null)} disabled={isSaving}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" className="rounded-xl" onClick={handleConfirmDeleteTerm} disabled={isSaving}>
            {isSaving && <IconLoader2 className="mr-2 size-4 animate-spin" />}
            Xóa giá trị
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {toast && (
      <div
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-5 duration-300 min-w-[300px] ${
          toast.tone === "success"
            ? "border-success/20 bg-success-soft text-success"
            : toast.tone === "error"
            ? "border-danger/20 bg-danger-soft text-danger"
            : "border-info/20 bg-info-soft text-info"
        }`}
      >
        <div className="flex-1 text-sm font-medium">{toast.message}</div>
        <button
          onClick={() => setToast(null)}
          className="text-muted-foreground hover:text-foreground text-xs font-semibold"
        >
          Đóng
        </button>
      </div>
    )}
    </>
  )
}
