"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconAlertTriangle,
  IconDeviceFloppy,
  IconDownload,
  IconLoader2,
  IconMap2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { seoService } from "@/lib/api/services/seo.service"
import { CreateRedirectPayload, CreateRedirectPayloadSchema, Redirect } from "@/lib/api/schemas/seo.schema"

type RedirectIssue = {
  key: string
  severity: "warning" | "error"
  message: string
}

const normalizePath = (value?: string | null) => {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

const getDestination = (redirect: Redirect) => normalizePath(redirect.destinationPath ?? redirect.targetPath)

const getRedirectIssues = (redirects: Redirect[]): RedirectIssue[] => {
  const issues: RedirectIssue[] = []
  const sourceCounts = new Map<string, number>()
  const destinationBySource = new Map<string, string>()

  redirects.forEach((redirect) => {
    const source = normalizePath(redirect.sourcePath)
    const destination = getDestination(redirect)
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
    destinationBySource.set(source, destination)

    if (source && destination && source === destination) {
      issues.push({
        key: `${redirect.id}-self`,
        severity: "error",
        message: `${source} đang redirect về chính nó.`,
      })
    }
  })

  sourceCounts.forEach((count, source) => {
    if (count > 1) {
      issues.push({
        key: `duplicate-${source}`,
        severity: "error",
        message: `${source} bị khai báo trùng ${count} lần.`,
      })
    }
  })

  destinationBySource.forEach((destination, source) => {
    const nextDestination = destinationBySource.get(destination)
    if (nextDestination === source) {
      issues.push({
        key: `loop-${source}`,
        severity: "error",
        message: `Loop 2 chiều: ${source} ↔ ${destination}.`,
      })
    } else if (nextDestination) {
      issues.push({
        key: `chain-${source}`,
        severity: "warning",
        message: `Chain redirect: ${source} → ${destination} → ${nextDestination}.`,
      })
    }
  })

  return issues
}

const toCsv = (redirects: Redirect[]) => {
  const rows = [
    ["sourcePath", "destinationPath", "type", "isActive"],
    ...redirects.map((redirect) => [
      normalizePath(redirect.sourcePath),
      getDestination(redirect),
      redirect.type || String(redirect.statusCode || 301),
      String(Boolean(redirect.isActive ?? redirect.status === "ACTIVE")),
    ]),
  ]

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n")
}

const parseCsv = (text: string): CreateRedirectPayload[] => {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)

  return rows.slice(1).flatMap((row) => {
    const cells = row
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((cell) => cell.replace(/^"|"$/g, "").replaceAll('""', '"').trim())
    const [sourcePath, destinationPath, type = "301", isActive = "true"] = cells
    if (!sourcePath || !destinationPath) return []
    return [
      {
        sourcePath: normalizePath(sourcePath),
        destinationPath: normalizePath(destinationPath),
        type: type === "302" ? "302" : "301",
        isActive: isActive.toLowerCase() !== "false",
      },
    ]
  })
}

export default function SeoPage() {
  const [redirects, setRedirects] = React.useState<Redirect[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isGeneratingSitemap, setIsGeneratingSitemap] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateRedirectPayload>({
    resolver: zodResolver(CreateRedirectPayloadSchema),
    defaultValues: {
      sourcePath: "/",
      destinationPath: "/",
      type: "301",
      isActive: true,
    },
  })

  const fetchRedirects = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await seoService.getRedirects({ limit: 200 })
      setRedirects(data.data)
    } catch (error) {
      console.error("Failed to fetch redirects", error)
      setRedirects([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRedirects()
  }, [fetchRedirects])

  const issues = React.useMemo(() => getRedirectIssues(redirects), [redirects])
  const errorCount = issues.filter((issue) => issue.severity === "error").length
  const warningCount = issues.length - errorCount

  const filteredRedirects = React.useMemo(
    () =>
      redirects.filter((redirect) => {
        const query = searchQuery.toLowerCase()
        return (
          redirect.sourcePath.toLowerCase().includes(query) ||
          getDestination(redirect).toLowerCase().includes(query)
        )
      }),
    [redirects, searchQuery]
  )

  const handleOpenSheet = () => {
    reset({
      sourcePath: "/",
      destinationPath: "/",
      type: "301",
      isActive: true,
    })
    setIsSheetOpen(true)
  }

  const onSubmit = async (data: CreateRedirectPayload) => {
    const nextRedirects = [
      ...redirects,
      {
        id: "draft",
        sourcePath: normalizePath(data.sourcePath),
        destinationPath: normalizePath(data.destinationPath),
        type: data.type,
        isActive: data.isActive,
        statusCode: Number(data.type),
        status: data.isActive ? "ACTIVE" : "INACTIVE",
      },
    ]
    const draftIssues = getRedirectIssues(nextRedirects).filter((issue) => issue.severity === "error")
    if (draftIssues.length > errorCount) {
      alert(draftIssues[draftIssues.length - 1]?.message || "Redirect chưa hợp lệ.")
      return
    }

    try {
      setIsSaving(true)
      await seoService.createRedirect({
        ...data,
        sourcePath: normalizePath(data.sourcePath),
        destinationPath: normalizePath(data.destinationPath),
      })
      setIsSheetOpen(false)
      fetchRedirects()
    } catch (error) {
      console.error("Failed to create redirect", error)
      alert("Chưa tạo được redirect.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (redirect: Redirect) => {
    if (!window.confirm(`Xóa redirect ${redirect.sourcePath}?`)) return
    try {
      await seoService.deleteRedirect(redirect.id)
      fetchRedirects()
    } catch (error) {
      console.error("Failed to delete redirect", error)
      alert("Chưa xóa được redirect.")
    }
  }

  const handleGenerateSitemap = async () => {
    try {
      setIsGeneratingSitemap(true)
      await seoService.generateSitemap()
      alert("Đã gọi sitemap endpoint thành công.")
    } catch (error) {
      console.error("Failed to generate sitemap", error)
      alert("Chưa gọi được sitemap endpoint.")
    } finally {
      setIsGeneratingSitemap(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([toCsv(redirects)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `duky-redirects-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setIsSaving(true)
      const content = await file.text()
      const rows = parseCsv(content)
      for (const row of rows) {
        await seoService.createRedirect(row)
      }
      await fetchRedirects()
      alert(`Đã import ${rows.length} redirect.`)
    } catch (error) {
      console.error("Failed to import redirects", error)
      alert("Import redirect chưa thành công. Kiểm tra file CSV.")
    } finally {
      setIsSaving(false)
      event.target.value = ""
    }
  }

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý SEO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý metadata, redirect, sitemap và cảnh báo loop/chain.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} className="rounded-xl">
            <IconDownload className="mr-2 size-4" />
            Xuất CSV
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving} className="rounded-xl">
            <IconUpload className="mr-2 size-4" />
            Nhập CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleImport} className="hidden" />
          <Button onClick={handleOpenSheet} className="rounded-xl">
            <IconPlus className="mr-2 size-4" />
            Thêm redirect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <IconMap2 className="size-5" />
              <CardTitle>Sitemap XML</CardTitle>
            </div>
            <CardDescription>
              Gọi endpoint sitemap.xml để kiểm tra/generate nội dung mới nhất cho sản phẩm, bài viết và danh mục.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full rounded-xl" onClick={handleGenerateSitemap} disabled={isGeneratingSitemap}>
              {isGeneratingSitemap ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconRefresh className="mr-2 size-4" />
              )}
              {isGeneratingSitemap ? "Đang kiểm tra..." : "Tạo lại / kiểm tra sitemap"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Lần kiểm tra: {new Date().toLocaleDateString("vi-VN")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Kiểm tra sức khỏe redirect</CardTitle>
                <CardDescription>Phát hiện redirect trùng, tự trỏ, loop 2 chiều và chain.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={errorCount ? "destructive" : "secondary"} className="rounded-md">
                  {errorCount} lỗi
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  {warningCount} cảnh báo
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.length === 0 ? (
              <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Chưa phát hiện redirect loop hoặc chain.
              </p>
            ) : (
              issues.slice(0, 6).map((issue) => (
                <div
                  key={issue.key}
                  className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                    issue.severity === "error" ? "border-destructive/30 bg-destructive/5" : "bg-amber-50"
                  }`}
                >
                  <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Chuyển hướng URL</h3>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm URL gốc hoặc đích..."
              className="w-full rounded-xl pl-9 md:w-[360px]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-12 w-[260px]">Đường dẫn gốc</TableHead>
                <TableHead className="h-12 w-[280px]">Đường dẫn đích</TableHead>
                <TableHead className="h-12">Loại</TableHead>
                <TableHead className="h-12">Trạng thái</TableHead>
                <TableHead className="h-12 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredRedirects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Không có redirect phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRedirects.map((redirect) => (
                  <TableRow key={redirect.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-primary">{normalizePath(redirect.sourcePath)}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{getDestination(redirect)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md font-mono">
                        {redirect.type || redirect.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`rounded-md ${
                          redirect.isActive ?? redirect.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {redirect.isActive ?? redirect.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(redirect)}
                        className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[420px]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader className="border-b p-6 pb-4">
              <SheetTitle>Thêm chuyển hướng</SheetTitle>
              <SheetDescription>Tạo URL Redirect để điều hướng người dùng và bot tìm kiếm.</SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="sourcePath">Đường dẫn gốc *</Label>
                <Input id="sourcePath" {...register("sourcePath")} className="rounded-xl font-mono text-sm" placeholder="/duong-dan-cu" />
                {errors.sourcePath ? <p className="text-xs text-destructive">{errors.sourcePath.message as string}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationPath">Đường dẫn đích *</Label>
                <Input
                  id="destinationPath"
                  {...register("destinationPath")}
                  className="rounded-xl font-mono text-sm"
                  placeholder="/duong-dan-moi"
                />
                {errors.destinationPath ? (
                  <p className="text-xs text-destructive">{errors.destinationPath.message as string}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Loại chuyển hướng</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-xl font-mono text-sm">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="301">301 Permanent</SelectItem>
                        <SelectItem value="302">302 Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Tạm dừng</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="border-t p-6">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="w-full rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="w-full rounded-xl">
                {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
                Lưu
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
