"use client"

import * as React from "react"
import { IconLoader2, IconPlus, IconSearch, IconSettings, IconTrash } from "@tabler/icons-react"
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

  const resetForm = () => {
    setSelectedAttribute(null)
    setForm({ name: "", slug: "", type: "OTHER", sortBy: "custom", swatch: "default" })
    setTermName("")
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
            <div className="font-semibold">Cấu hình chủng loại</div>
            <div className="mt-3 flex gap-2">
              <Input value={termName} onChange={(event) => setTermName(event.target.value)} placeholder="VD: 39, 40, Đen..." className="rounded-xl" />
              <Button type="button" onClick={handleCreateTerm} disabled={isSaving || !termName.trim()} className="rounded-xl">Thêm</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedAttribute.terms.map((term) => (
                <span key={term.id} className="rounded-full border bg-white px-3 py-1 text-sm">{term.name}</span>
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
    </>
  )
}
