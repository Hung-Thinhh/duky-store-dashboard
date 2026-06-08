"use client"

import * as React from "react"
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconFilter,
  IconLoader2,
  IconRefresh,
  IconSearch,
  IconSend,
  IconUpload,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { gscService } from "@/lib/api/services/gsc.service"
import { seoService } from "@/lib/api/services/seo.service"
import {
  GscAnalyzedUrl,
  GscAnalyzeResult,
  GscCandidatesResult,
  GscInspectResult,
  GscOverview,
  GscUrlInput,
} from "@/lib/api/schemas/gsc.schema"

type Severity = "ok" | "info" | "warning" | "error"

const severityLabel: Record<Severity, string> = {
  error: "Cần sửa",
  info: "Theo dõi",
  ok: "Ổn",
  warning: "Ưu tiên",
}

const severityVariant: Record<
  Severity,
  "default" | "secondary" | "destructive" | "outline"
> = {
  error: "destructive",
  info: "secondary",
  ok: "outline",
  warning: "secondary",
}

const formatNumber = (value?: number) =>
  new Intl.NumberFormat("vi-VN").format(value ?? 0)

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()

const splitCsvLine = (line: string) => {
  const cells: string[] = []
  let current = ""
  let insideQuote = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && next === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      insideQuote = !insideQuote
    } else if (char === "," && !insideQuote) {
      cells.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells.map((cell) => cell.replace(/^"|"$/g, "").trim())
}

const toUrlInput = (url: string, reason?: string): GscUrlInput | null => {
  const cleaned = url
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.,;:)\]]+$/g, "")

  if (!cleaned) return null

  if (cleaned.startsWith("/") || /^https?:\/\//i.test(cleaned)) {
    return {
      reason: reason?.trim() || undefined,
      url: cleaned,
    }
  }

  return null
}

const parseSearchConsoleExport = (text: string): GscUrlInput[] => {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitCsvLine)

  if (!rows.length) return []

  const headers = rows[0].map(normalizeHeader)
  const urlIndex = headers.findIndex((header) =>
    ["url", "page", "trang", "dia chi", "duong dan"].some((keyword) =>
      header.includes(keyword)
    )
  )
  const reasonIndex = headers.findIndex((header) =>
    ["reason", "issue", "nguyen nhan", "ly do"].some((keyword) =>
      header.includes(keyword)
    )
  )
  const parsed = new Map<string, GscUrlInput>()

  if (urlIndex >= 0) {
    for (const row of rows.slice(1)) {
      const item = toUrlInput(
        row[urlIndex] ?? "",
        reasonIndex >= 0 ? row[reasonIndex] : undefined
      )

      if (item) parsed.set(item.url, item)
    }
  }

  if (!parsed.size) {
    const matches =
      text.match(
        /https?:\/\/[^\s"',<>`]+|\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g
      ) ?? []

    for (const match of matches) {
      const item = toUrlInput(match)

      if (item) parsed.set(item.url, item)
    }
  }

  return Array.from(parsed.values())
}

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const escapeCsvCell = (value: unknown) => {
  const text = String(value ?? "")

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

const downloadCsv = (filename: string, rows: unknown[][]) => {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")
  const blob = new Blob([`${csv}\n`], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const downloadAnalysisCsv = (analysis: GscAnalyzeResult) => {
  downloadCsv("gsc-url-analysis.csv", [
    [
      "url",
      "path",
      "issue",
      "severity",
      "action",
      "gscReason",
      "entityType",
      "entityTitle",
      "inSitemap",
      "redirectSource",
      "redirectTarget",
      "mappingOldUrl",
      "mappingNewUrl",
    ],
    ...analysis.urls.map((item) => [
      item.url,
      item.path,
      item.primaryIssue.label,
      item.primaryIssue.severity,
      item.primaryIssue.action,
      item.gscReason,
      item.entityType,
      item.entityTitle,
      item.inSitemap ? "yes" : "no",
      item.redirect?.sourcePath,
      item.redirect?.targetPath,
      item.urlMapping?.oldUrl,
      item.urlMapping?.newUrl,
    ]),
  ])
}

const getDashboardEntityPath = (item: GscAnalyzedUrl) => {
  if (!item.entityId) return null

  if (item.entityType === "PRODUCT") return `/products/${item.entityId}`
  if (item.entityType === "BLOG_POST") return `/blog/${item.entityId}`
  if (item.entityType === "CATEGORY") return "/categories"

  return null
}

const getRedirectSearchPath = (item: GscAnalyzedUrl) => {
  if (item.urlMapping) {
    return `/redirects?search=${encodeURIComponent(item.urlMapping.oldUrl)}`
  }

  if (!item.redirect) return null

  return `/redirects?search=${encodeURIComponent(item.redirect.sourcePath)}`
}

function MetricCard({
  label,
  value,
  caption,
}: {
  caption: string
  label: string
  value?: number
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{formatNumber(value)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    error: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap",
    info: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap",
    ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap",
  }

  return (
    <span className={styles[severity]}>
      {severityLabel[severity]}
    </span>
  )
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-sm text-muted-foreground"
      >
        {text}
      </TableCell>
    </TableRow>
  )
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: Array<number | "..."> = []
  const total = totalPages || 1
  const current = currentPage || 1

  if (total <= 7) {
    for (let index = 1; index <= total; index++) pages.push(index)
  } else if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total)
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total)
  }

  return pages
}

const getInspectionCoverageBadge = (item: Record<string, any>) => {
  if (item.errorMessage) {
    return {
      text: item.errorMessage,
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs font-semibold"
    }
  }

  const verdict = String(item.verdict || "");
  const coverage = String(item.coverageState || "");

  if (verdict === "PASS" || coverage.toLowerCase().includes("indexed") || coverage.toLowerCase().includes("lập chỉ mục")) {
    return {
      text: coverage || "Đã lập chỉ mục (PASS)",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold"
    }
  }

  if (verdict === "PARTIAL" || coverage.toLowerCase().includes("warning") || coverage.toLowerCase().includes("cảnh báo")) {
    return {
      text: coverage || "Có cảnh báo (PARTIAL)",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-semibold"
    }
  }

  if (verdict === "FAIL" || coverage.toLowerCase().includes("noindex") || coverage.toLowerCase().includes("not indexed")) {
    return {
      text: coverage || "Không lập chỉ mục (FAIL)",
      className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-xs font-semibold"
    }
  }

  return {
    text: coverage || verdict || "Chưa xác định",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-xs font-semibold"
  }
}

const formatGscFetchState = (item: Record<string, any>) => {
  if (item.errorMessage) return "-"
  
  const fetchState = item.pageFetchState
  const robotsState = item.robotsTxtState
  
  const fetchMap: Record<string, string> = {
    PAGE_FETCH_STATE_UNSPECIFIED: "Chưa thu thập",
    SUCCESSFUL: "Thành công",
    EMPTY_RESPONSE: "Phản hồi trống",
    HTTP_ERROR: "Lỗi HTTP",
    MY_IP_BLOCKED: "IP bị chặn",
    BLOCKED_ROBOTS_TXT: "Chặn bởi robots.txt",
    ROBOTS_TXT_NOT_AVAILABLE: "Robots.txt không có sẵn",
    NETWORK_ERROR: "Lỗi mạng",
    DNS_ERROR: "Lỗi DNS",
    FETCH_ERROR: "Lỗi tải trang",
    URL_UNKNOWN: "URL không xác định",
    REDIRECT_ERROR: "Lỗi chuyển hướng",
    BLOCKED_401: "Bị chặn (401)",
    SOFT_404: "Soft 404",
  }

  const robotsMap: Record<string, string> = {
    ROBOTS_TXT_STATE_UNSPECIFIED: "Chưa xác định",
    ALLOWED: "Cho phép",
    DISALLOWED: "Chặn",
    FETCH_FAILED: "Lỗi tải robots.txt",
  }

  const parts: string[] = []
  if (fetchState && fetchState !== "PAGE_FETCH_STATE_UNSPECIFIED") {
    parts.push(fetchMap[fetchState] || fetchState)
  }
  if (robotsState && robotsState !== "ROBOTS_TXT_STATE_UNSPECIFIED") {
    parts.push(`Robots: ${robotsMap[robotsState] || robotsState}`)
  }

  if (parts.length === 0) {
    if (fetchState === "PAGE_FETCH_STATE_UNSPECIFIED") {
      return "Chưa thu thập"
    }
    return "-"
  }

  return parts.join(" | ")
}

const formatGscCanonical = (item: Record<string, any>) => {
  if (item.errorMessage) return "-"
  const user = item.userCanonical
  const google = item.googleCanonical

  if (!user && !google) return "-"
  if (user === google) return user
  
  const parts: string[] = []
  if (user) parts.push(`Khai báo: ${user}`)
  if (google) parts.push(`Google chọn: ${google}`)
  return parts.join(" | ")
}

const formatGscCrawlTime = (time: string | null | undefined) => {
  if (!time || time === "-") return "-"
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return time
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return time
  }
}

export default function SearchConsolePage() {
  const [overview, setOverview] = React.useState<GscOverview | null>(null)
  const [analysis, setAnalysis] = React.useState<GscAnalyzeResult | null>(null)
  const [candidates, setCandidates] =
    React.useState<GscCandidatesResult | null>(null)
  const [inspection, setInspection] = React.useState<GscInspectResult | null>(
    null
  )
  const [rawInput, setRawInput] = React.useState("")
  const [importedUrls, setImportedUrls] = React.useState<GscUrlInput[]>([])
  const [issueFilter, setIssueFilter] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [isLoadingOverview, setIsLoadingOverview] = React.useState(true)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isAutoScanning, setIsAutoScanning] = React.useState(false)
  const [isInspecting, setIsInspecting] = React.useState(false)
  const [inspectingUrl, setInspectingUrl] = React.useState<string | null>(null)
  const [redirectToDisable, setRedirectToDisable] =
    React.useState<GscAnalyzedUrl | null>(null)
  const [isDisablingRedirect, setIsDisablingRedirect] = React.useState(false)
  const [submittingUrl, setSubmittingUrl] = React.useState<string | null>(null)
  const [isBulkSubmitting, setIsBulkSubmitting] = React.useState(false)
  
  const [_feedback, _setFeedback] = React.useState<{
    message: string
    tone: "success" | "error" | "info"
  } | null>(null)

  const setFeedback = React.useCallback(
    (
      val:
        | string
        | { message: string; tone: "success" | "error" | "info" }
        | null
    ) => {
      if (val === null) {
        _setFeedback(null)
      } else if (typeof val === "string") {
        const lower = val.toLowerCase()
        const isError =
          lower.includes("lỗi") ||
          lower.includes("thất bại") ||
          lower.includes("không") ||
          lower.includes("chưa") ||
          lower.includes("failed")
        const tone = isError ? "error" : "success"
        _setFeedback({ message: val, tone })
      } else {
        _setFeedback(val)
      }
    },
    []
  )

  const feedback = _feedback

  React.useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => {
      _setFeedback(null)
    }, 4500)
    return () => clearTimeout(timer)
  }, [feedback])

  const feedbackToastClassName = (tone?: "success" | "error" | "info") => {
    if (tone === "success") {
      return "border-emerald-500/20 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 shadow-emerald-500/10"
    }
    if (tone === "error") {
      return "border-red-500/20 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 shadow-red-500/10"
    }
    return "border-amber-500/20 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 shadow-amber-500/10"
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Redirect Dialog States
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = React.useState(false)
  const [redirectDialogUrlItem, setRedirectDialogUrlItem] = React.useState<GscAnalyzedUrl | null>(null)
  const [redirectSourcePath, setRedirectSourcePath] = React.useState("")
  const [redirectDestinationPath, setRedirectDestinationPath] = React.useState("")
  const [redirectType, setRedirectType] = React.useState("301")
  const [redirectIsActive, setRedirectIsActive] = React.useState(true)
  const [isSubmittingRedirect, setIsSubmittingRedirect] = React.useState(false)

  const handleOpenRedirectDialog = (item: GscAnalyzedUrl) => {
    setRedirectDialogUrlItem(item)
    setRedirectSourcePath(item.redirect?.sourcePath || item.path || "")
    setRedirectDestinationPath(item.redirect?.targetPath || item.urlMapping?.newUrl || "")
    setRedirectType(String(item.redirect?.statusCode || 301))
    setRedirectIsActive(true)
    setIsRedirectDialogOpen(true)
  }

  const handleSaveRedirect = async () => {
    if (!redirectSourcePath.trim() || !redirectDestinationPath.trim()) {
      alert("Vui lòng điền đầy đủ đường dẫn nguồn và đích.")
      return
    }

    try {
      setIsSubmittingRedirect(true)
      
      const payload = {
        sourcePath: redirectSourcePath.trim(),
        destinationPath: redirectDestinationPath.trim(),
        type: redirectType as "301" | "302",
        isActive: redirectIsActive,
      }

      if (redirectDialogUrlItem?.redirect?.id) {
        await seoService.updateRedirect(redirectDialogUrlItem.redirect.id, payload)
        setFeedback(`Đã cập nhật chuyển hướng cho ${redirectSourcePath}.`)
      } else {
        try {
          await seoService.createRedirect(payload)
          setFeedback(`Đã tạo chuyển hướng mới cho ${redirectSourcePath}.`)
        } catch (error: any) {
          const status = error?.status || error?.response?.status || error?.EC
          if (status === 409 || String(error?.message).includes("409")) {
            const existing = await seoService.getRedirects({ search: redirectSourcePath.trim() })
            const matched = existing?.data?.find(
              (r: any) => r.sourcePath === redirectSourcePath.trim()
            )
            if (matched?.id) {
              await seoService.updateRedirect(matched.id, payload)
              setFeedback(`Tự động cập nhật chuyển hướng đã tồn tại cho ${redirectSourcePath}.`)
            } else {
              throw error
            }
          } else {
            throw error
          }
        }
      }

      const source = currentAnalysisSource()
      if (source.length) {
        setAnalysis(await gscService.analyzeUrls(source))
      }
      
      await fetchOverview()
      setIsRedirectDialogOpen(false)
    } catch (error) {
      console.error("Failed to save redirect", error)
      alert("Lỗi khi lưu redirect. Vui lòng kiểm tra và thử lại.")
    } finally {
      setIsSubmittingRedirect(false)
    }
  }

  const fetchOverview = React.useCallback(async () => {
    try {
      setIsLoadingOverview(true)
      setFeedback(null)
      setOverview(await gscService.getOverview())
    } catch (error) {
      console.error("Failed to load GSC overview", error)
      setFeedback("Không tải được overview SEO từ backend.")
    } finally {
      setIsLoadingOverview(false)
    }
  }, [])

  React.useEffect(() => {
    let isCurrent = true

    void gscService
      .getOverview()
      .then((data) => {
        if (isCurrent) setOverview(data)
      })
      .catch((error) => {
        console.error("Failed to load GSC overview", error)
        if (isCurrent) setFeedback("Không tải được overview SEO từ backend.")
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOverview(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(20)
  const [selectedUrls, setSelectedUrls] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setSelectedUrls(new Set())
  }, [issueFilter, query])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [issueFilter, query, itemsPerPage])

  const activeGroups = analysis?.groups ?? overview?.groups ?? []
  const filteredUrls = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!analysis) return []

    return analysis.urls.filter((item) => {
      let matchesIssue = false
      if (issueFilter === "all") {
        matchesIssue = true
      } else if (issueFilter === "status_ok") {
        matchesIssue = item.primaryIssue.severity === "ok" || item.primaryIssue.key === "GOOGLE_REPORTED" || item.primaryIssue.key === "OK"
      } else {
        matchesIssue = item.primaryIssue.key === issueFilter
      }

      if (!matchesIssue) return false

      if (!normalizedQuery) return true

      return [
        item.url,
        item.path,
        item.canonicalPath,
        item.gscReason,
        item.primaryIssue.label,
        item.entityTitle,
        item.redirect?.sourcePath,
        item.redirect?.targetPath,
        item.urlMapping?.oldUrl,
        item.urlMapping?.newUrl,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    })
  }, [analysis, issueFilter, query])

  const totalPages = Math.ceil(filteredUrls.length / itemsPerPage)
  const paginatedUrls = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredUrls.slice(start, start + itemsPerPage)
  }, [filteredUrls, currentPage, itemsPerPage])

  const parsedInput = React.useMemo(
    () => parseSearchConsoleExport(rawInput),
    [rawInput]
  )
  const readyToAnalyze = importedUrls.length > 0 || parsedInput.length > 0
  const stableNonIndexedUrls = React.useMemo(() => {
    if (!analysis) return []
    return filteredUrls.filter(
      (item) =>
        (item.primaryIssue.severity === "ok" ||
          item.primaryIssue.key === "GOOGLE_REPORTED" ||
          item.primaryIssue.key === "OK") &&
        item.inspectionResult?.verdict !== "PASS"
    )
  }, [filteredUrls, analysis])

  const urlsForInspect = React.useMemo(() => {
    if (selectedUrls.size > 0) {
      return Array.from(selectedUrls).slice(0, 50).map((url) => {
        const matched = analysis?.urls.find((item) => item.url === url)
        return {
          url,
          reason: matched?.gscReason ?? undefined,
        }
      })
    }

    return stableNonIndexedUrls.slice(0, 50).map((item) => ({
      url: item.url,
      reason: item.gscReason ?? undefined,
    }))
  }, [selectedUrls, stableNonIndexedUrls, analysis])

  const handleSelectFirst50 = React.useCallback(() => {
    const first50 = stableNonIndexedUrls.slice(0, 50).map((item) => item.url)
    setSelectedUrls(new Set(first50))
    setFeedback(`Đã chọn 50 URL ổn chưa index đầu tiên.`)
  }, [stableNonIndexedUrls])

  const handleSelectNext50 = React.useCallback(() => {
    const unselected = stableNonIndexedUrls.filter((item) => !selectedUrls.has(item.url))
    const next50 = unselected.slice(0, 50).map((item) => item.url)
    if (next50.length === 0) {
      setFeedback("Không còn URL ổn chưa index nào khác để chọn.")
      return
    }
    setSelectedUrls(new Set(next50))
    setFeedback(`Đã chọn 50 URL ổn chưa index tiếp theo.`)
  }, [stableNonIndexedUrls, selectedUrls])

  const handleClearSelection = React.useCallback(() => {
    setSelectedUrls(new Set())
    setFeedback("Đã xóa toàn bộ tích chọn.")
  }, [])

  const isAllCurrentPageSelected = React.useMemo(() => {
    return paginatedUrls.length > 0 && paginatedUrls.every((item) => selectedUrls.has(item.url))
  }, [paginatedUrls, selectedUrls])

  const handleToggleSelectAllCurrentPage = React.useCallback(() => {
    const next = new Set(selectedUrls)
    if (isAllCurrentPageSelected) {
      paginatedUrls.forEach((item) => next.delete(item.url))
    } else {
      paginatedUrls.forEach((item) => next.add(item.url))
    }
    setSelectedUrls(next)
  }, [paginatedUrls, selectedUrls, isAllCurrentPageSelected])

  const handleToggleSelectUrl = React.useCallback((url: string) => {
    const next = new Set(selectedUrls)
    if (next.has(url)) {
      next.delete(url)
    } else {
      next.add(url)
    }
    setSelectedUrls(next)
  }, [selectedUrls])

  const currentAnalysisSource = React.useCallback(() => {
    if (analysis?.urls.length) {
      return analysis.urls.map((item) => ({
        reason: item.gscReason ?? undefined,
        url: item.url,
      }))
    }

    return importedUrls.length ? importedUrls : parsedInput
  }, [analysis, importedUrls, parsedInput])

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    const text = await file.text()
    const nextUrls = parseSearchConsoleExport(text)
    setRawInput(text)
    setImportedUrls(nextUrls)
    setCandidates(null)
    setAnalysis(null)
    setInspection(null)
    setIssueFilter("all")
    setFeedback(`Đã đọc ${formatNumber(nextUrls.length)} URL từ file export.`)
  }

  const handleAnalyze = async () => {
    const nextUrls = importedUrls.length ? importedUrls : parsedInput

    if (!nextUrls.length) {
      setFeedback("Chưa có URL để phân tích.")
      return
    }

    try {
      setIsAnalyzing(true)
      setFeedback(null)
      setAnalysis(await gscService.analyzeUrls(nextUrls))
      setIssueFilter("all")
    } catch (error) {
      console.error("Failed to analyze GSC URLs", error)
      setFeedback(
        "Phân tích URL thất bại. Kiểm tra backend hoặc định dạng file."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAutoScan = async () => {
    try {
      setIsAutoScanning(true)
      setFeedback(null)
      const nextCandidates = await gscService.getCandidates({
        includeLiveSitemap: true,
        limit: 2500,
      })
      const nextUrls = nextCandidates.urls.map((item) => ({
        reason: item.reason,
        url: item.url,
      }))
      const nextAnalysis = await gscService.analyzeUrls(nextUrls)

      setCandidates(nextCandidates)
      setImportedUrls(nextUrls)
      setRawInput("")
      setAnalysis(nextAnalysis)
      setInspection(null)
      setIssueFilter("all")
      setQuery("")
      setFeedback(
        `Đã quét ${formatNumber(nextCandidates.total)} URL từ hệ thống${
          nextCandidates.totalBeforeLimit > nextCandidates.total
            ? ` / ${formatNumber(nextCandidates.totalBeforeLimit)} URL tổng`
            : ""
        }.`
      )
    } catch (error) {
      console.error("Failed to auto scan GSC candidates", error)
      setFeedback(
        "Quét tự động thất bại. Kiểm tra backend, quyền admin hoặc kết nối sitemap live."
      )
    } finally {
      setIsAutoScanning(false)
    }
  }

  const handleInspect = async () => {
    if (!urlsForInspect.length) {
      setFeedback("Chưa có URL để inspect.")
      return
    }

    try {
      setIsInspecting(true)
      setFeedback(null)
      const nextInspection = await gscService.inspectUrls(urlsForInspect)
      setInspection(nextInspection)

      const source = currentAnalysisSource()
      if (source.length) {
        setAnalysis(await gscService.analyzeUrls(source))
      }
      setFeedback(`Đã inspect xong ${urlsForInspect.length} URL. Kết quả inspect đã được lưu và cập nhật lên bảng chính.`)
      setSelectedUrls(new Set())
    } catch (error) {
      console.error("Failed to inspect URLs", error)
      setFeedback(
        "Chưa inspect được Google. Kiểm tra service account và quyền GSC."
      )
    } finally {
      setIsInspecting(false)
    }
  }

  const handleInspectOne = async (item: GscAnalyzedUrl) => {
    try {
      setInspectingUrl(item.url)
      setFeedback(null)
      const nextInspection = await gscService.inspectUrls([
        {
          reason: item.gscReason ?? undefined,
          url: item.url,
        },
      ])
      setInspection(nextInspection)
      
      const source = currentAnalysisSource()
      if (source.length) {
        setAnalysis(await gscService.analyzeUrls(source))
      }
      setFeedback(`Đã inspect ${item.path}. Kết quả đã được cập nhật trực tiếp lên bảng chính.`)
    } catch (error) {
      console.error("Failed to inspect URL", error)
      setFeedback("Inspect URL thất bại. Kiểm tra quyền GSC hoặc thử lại sau.")
    } finally {
      setInspectingUrl(null)
    }
  }

  const handleSubmitIndexingOne = async (item: GscAnalyzedUrl) => {
    try {
      setSubmittingUrl(item.url)
      setFeedback(null)
      const result = await gscService.submitIndexing(item.url, "URL_UPDATED")
      if (result?.success) {
        setFeedback(`Đã gửi yêu cầu lập chỉ mục cho ${item.path} thành công!`)
      } else {
        setFeedback("Gửi yêu cầu lập chỉ mục thất bại. Vui lòng cấu hình Google Indexing API.")
      }
    } catch (error: any) {
      console.error("Failed to submit index for URL", error)
      setFeedback(error?.message || "Gửi yêu cầu Index thất bại. Thử lại sau.")
    } finally {
      setSubmittingUrl(null)
    }
  }

  const handleBulkSubmitIndexing = async () => {
    let targetUrls = []
    if (selectedUrls.size > 0) {
      targetUrls = filteredUrls.filter(item => 
        selectedUrls.has(item.url) &&
        (item.primaryIssue.severity === "ok" || item.primaryIssue.key === "GOOGLE_REPORTED" || item.primaryIssue.key === "OK") &&
        item.inspectionResult?.verdict !== "PASS"
      )
    } else {
      targetUrls = stableNonIndexedUrls
    }

    const slicedTargets = targetUrls.slice(0, 50)
    
    if (!slicedTargets.length) {
      setFeedback("Không tìm thấy URL nào có trạng thái 'Ổn' và chưa được index (hoặc chưa được chọn) để gửi yêu cầu.")
      return
    }

    try {
      setIsBulkSubmitting(true)
      setFeedback(`Đang gửi yêu cầu lập chỉ mục cho ${slicedTargets.length} URL...`)
      
      let successCount = 0
      for (const item of slicedTargets) {
        try {
          const res = await gscService.submitIndexing(item.url, "URL_UPDATED")
          if (res?.success) {
            successCount++
          }
        } catch (e) {
          console.error(`Failed to bulk index ${item.url}:`, e)
        }
      }

      const source = currentAnalysisSource()
      if (source.length) {
        setAnalysis(await gscService.analyzeUrls(source))
      }
      setSelectedUrls(new Set())
      setFeedback(`Đã gửi thành công ${successCount}/${slicedTargets.length} URL lên Google Indexing API.`)
    } catch (error: any) {
      console.error("Failed to bulk submit indexing", error)
      setFeedback("Gửi hàng loạt thất bại. Kiểm tra kết nối Google API.")
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  const handleConfirmDisableRedirect = async () => {
    if (!redirectToDisable?.redirect?.id) return

    try {
      setIsDisablingRedirect(true)
      setFeedback(null)
      await seoService.deleteRedirect(redirectToDisable.redirect.id)

      const source = currentAnalysisSource()

      if (source.length) {
        setAnalysis(await gscService.analyzeUrls(source))
      }

      await fetchOverview()
      setFeedback(`Đã tắt redirect ${redirectToDisable.redirect.sourcePath}.`)
      setRedirectToDisable(null)
    } catch (error) {
      console.error("Failed to disable redirect", error)
      setFeedback("Tắt redirect thất bại. Kiểm tra quyền admin hoặc thử lại.")
    } finally {
      setIsDisablingRedirect(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {feedback ? (
        <div className="fixed right-4 top-[80px] z-[80] w-[min(420px,calc(100vw-32px))] animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md",
              feedbackToastClassName(feedback.tone)
            )}
            role="status"
            aria-live="polite"
          >
            <span className="min-w-0 flex-1 leading-6">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-stone-500/10 hover:text-current font-bold"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Google Search Console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng hợp index, redirect, sitemap và dữ liệu inspect URL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchOverview}
            disabled={isLoadingOverview}
          >
            {isLoadingOverview ? (
              <IconLoader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <IconRefresh data-icon="inline-start" />
            )}
            Tải lại
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              analysis && downloadJson("gsc-url-analysis.json", analysis)
            }
            disabled={!analysis}
          >
            <IconDownload data-icon="inline-start" />
            Xuất phân tích
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => analysis && downloadAnalysisCsv(analysis)}
            disabled={!analysis}
          >
            <IconDownload data-icon="inline-start" />
            Xuất CSV
          </Button>
        </div>
      </div>



      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sản phẩm public"
          value={overview?.counts.publishedProducts}
          caption="URL sản phẩm đang có thể index"
        />
        <MetricCard
          label="Bài blog public"
          value={overview?.counts.publishedBlogPosts}
          caption="Nguồn traffic nội dung"
        />
        <MetricCard
          label="URL sitemap dự kiến"
          value={overview?.counts.expectedSitemapUrls}
          caption="Tính từ DB và sitemap entry"
        />
        <MetricCard
          label="Redirect active"
          value={overview?.counts.activeRedirects}
          caption="Nhóm cần kiểm tra khi GSC báo excluded"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lý do trang không được lập chỉ mục</CardTitle>
                <CardDescription>
                  {analysis
                    ? `${formatNumber(analysis.total)} URL từ export`
                    : "Baseline từ backend"}
                </CardDescription>
              </div>
              <Badge
                variant={overview?.google.connected ? "default" : "outline"}
              >
                {overview?.google.connected
                  ? "GSC API sẵn sàng"
                  : "Chưa cấu hình GSC API"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nguyên nhân</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead className="w-28">Mức</TableHead>
                    <TableHead className="w-24 text-right">Trang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeGroups.length ? (
                    activeGroups.map((group) => (
                      <TableRow key={group.key}>
                        <TableCell className="font-medium">
                          {group.label}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {group.action}
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={group.severity} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(group.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRow
                      colSpan={4}
                      text={
                        isLoadingOverview ? "Đang tải..." : "Chưa có dữ liệu"
                      }
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Kết nối Google</CardTitle>
            <CardDescription>
              {overview?.google.siteUrl ?? "https://dukystore.com/"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Service account</span>
              <Badge
                variant={overview?.google.connected ? "default" : "outline"}
              >
                {overview?.google.connected
                  ? "Đã cấu hình"
                  : "Thiếu credential"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Nguồn credential</span>
              <Badge variant="secondary">
                {overview?.google.credentialSource ?? "Chưa có"}
              </Badge>
            </div>
            {overview?.google.serviceAccountEmail ? (
              <p className="rounded-lg bg-muted/40 p-3 text-xs break-all text-muted-foreground">
                {overview.google.serviceAccountEmail}
              </p>
            ) : null}
            {overview?.google.credentialError ? (
              <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {overview.google.credentialError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Property</span>
              <Badge variant="secondary">
                {overview?.google.siteUrl ?? "Chưa rõ"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">URL inspect mỗi lần</span>
              <Badge variant="outline">50</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleInspect}
                disabled={isInspecting || !urlsForInspect.length}
                className="w-full text-xs px-2"
              >
                {isInspecting ? (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin size-3"
                  />
                ) : (
                  <IconSearch data-icon="inline-start" className="size-3" />
                )}
                {selectedUrls.size > 0 
                  ? `Inspect (${Math.min(selectedUrls.size, 50)})` 
                  : "Inspect Google (50)"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleBulkSubmitIndexing}
                disabled={isBulkSubmitting || (selectedUrls.size === 0 && !stableNonIndexedUrls.length)}
                className="w-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-50/20 text-xs px-2"
              >
                {isBulkSubmitting ? (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin size-3"
                  />
                ) : (
                  <IconSend data-icon="inline-start" className="size-3" />
                )}
                {selectedUrls.size > 0 
                  ? `Index (${Math.min(selectedUrls.size, 50)})` 
                  : "Index hàng loạt (50)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Nguồn URL cần rà index</CardTitle>
              <CardDescription>
                Tự quét hệ thống hoặc import CSV Page Indexing từ Search
                Console.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoScan}
                disabled={isAutoScanning || isAnalyzing}
              >
                {isAutoScanning ? (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <IconSearch data-icon="inline-start" />
                )}
                Quét hệ thống
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload data-icon="inline-start" />
                Chọn file
              </Button>
              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isAutoScanning || !readyToAnalyze}
              >
                {isAnalyzing ? (
                  <IconLoader2
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <IconCheck data-icon="inline-start" />
                )}
                Phân tích URL
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={rawInput}
            onChange={(event) => {
              setRawInput(event.target.value)
              setImportedUrls([])
              setCandidates(null)
            }}
            className="min-h-36 font-mono text-xs"
            placeholder="https://dukystore.com/san-pham/..."
          />
          {candidates ? (
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">
                  Tự động quét {formatNumber(candidates.total)} URL
                </Badge>
                <Badge variant="outline">
                  Sitemap trực tiếp {candidates.includeLiveSitemap ? "bật" : "tắt"}
                </Badge>
                {candidates.totalBeforeLimit > candidates.total ? (
                  <Badge variant="outline">
                    Giới hạn {formatNumber(candidates.limit)} /{" "}
                    {formatNumber(candidates.totalBeforeLimit)}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {candidates.sources.map((source) => (
                  <Badge key={source.key} variant="outline">
                    {(() => {
                      const dict: Record<string, string> = {
                        "Blog posts in database": "Bài viết trong database",
                        "Products in database": "Sản phẩm trong database",
                        "Sitemap (database)": "Sitemap (database)",
                        "Sitemap (live)": "Sitemap (trực tiếp)",
                        "Active Redirects": "Chuyển hướng đang hoạt động",
                      };
                      return dict[source.label] ?? source.label;
                    })()}: {formatNumber(source.total)}
                  </Badge>
                ))}
              </div>
              {candidates.warnings.length ? (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {candidates.warnings.slice(0, 3).map((warning, index) => (
                    <span key={`${warning}-${index}`}>{warning}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {formatNumber(importedUrls.length || parsedInput.length)} URL đọc
              được
            </Badge>
            <span>
              {analysis
                ? `Đã phân tích ${formatNumber(analysis.total)} URL`
                : "Chưa có kết quả phân tích"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Danh sách URL cần xử lý</CardTitle>
              <CardDescription>
                Ưu tiên theo lỗi local và reason từ GSC.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Select value={issueFilter} onValueChange={setIssueFilter}>
                <SelectTrigger className="w-full md:w-64">
                  <IconFilter data-icon="inline-start" />
                  <SelectValue placeholder="Lọc nguyên nhân" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả nguyên nhân</SelectItem>
                    {analysis && (
                      <SelectItem value="status_ok">
                        URL ổn ({formatNumber(analysis.urls.filter(item => item.primaryIssue.severity === "ok" || item.primaryIssue.key === "GOOGLE_REPORTED" || item.primaryIssue.key === "OK").length)})
                      </SelectItem>
                    )}
                    {analysis?.groups.map((group) => (
                      <SelectItem key={group.key} value={group.key}>
                        {group.label} ({formatNumber(group.total)})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="relative w-full md:w-80">
                <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Tìm URL, nguyên nhân, hành động..."
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground border-b pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Hiển thị {formatNumber(filteredUrls.length)} /{" "}
                  {formatNumber(analysis.total)} URL
                </Badge>
                {selectedUrls.size > 0 && (
                  <Badge variant="default" className="bg-emerald-600 text-white font-medium">
                    Đang chọn {selectedUrls.size} URL
                  </Badge>
                )}
                {issueFilter !== "all" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setIssueFilter("all")}
                  >
                    Bỏ lọc
                  </Button>
                ) : null}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectFirst50}
                  className="h-8 px-2.5 text-xs font-medium"
                >
                  Chọn 50 link đầu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNext50}
                  className="h-8 px-2.5 text-xs font-medium"
                >
                  Chọn 50 link tiếp
                </Button>
                {selectedUrls.size > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="h-8 px-2.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    Xóa chọn
                  </Button>
                )}
              </div>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={isAllCurrentPageSelected}
                      onCheckedChange={handleToggleSelectAllCurrentPage}
                      aria-label="Chọn tất cả trang"
                    />
                  </TableHead>
                  <TableHead className="w-[30%]">Đường dẫn URL</TableHead>
                  <TableHead className="w-[20%]">Trạng thái GSC / Lý do</TableHead>
                  <TableHead className="w-[20%]">Thực thể liên kết</TableHead>
                  <TableHead className="w-[10%]">Sitemap</TableHead>
                  <TableHead className="w-[10%]">Mức độ</TableHead>
                  <TableHead className="w-[10%]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUrls.length ? (
                  paginatedUrls.map((item: GscAnalyzedUrl) => (
                    <TableRow key={item.url} className={selectedUrls.has(item.url) ? "bg-muted/40" : undefined}>
                      <TableCell className="w-[50px] text-center">
                        <Checkbox
                          checked={selectedUrls.has(item.url)}
                          onCheckedChange={() => handleToggleSelectUrl(item.url)}
                          aria-label={`Chọn URL ${item.path}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        <div className="flex flex-col gap-1">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium hover:underline max-w-full"
                            title={item.path}
                          >
                            <span className="truncate block max-w-full">{item.path}</span>
                            <IconExternalLink className="size-3 shrink-0" />
                          </a>
                          <p className="mt-1 text-xs text-muted-foreground break-words whitespace-normal" title={item.primaryIssue.action}>
                            {item.primaryIssue.action}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] text-sm text-muted-foreground break-words whitespace-normal">
                        <div className="flex flex-col gap-1 items-start">
                          {item.inspectionResult ? (
                            <>
                              <span className={getInspectionCoverageBadge(item.inspectionResult).className}>
                                {getInspectionCoverageBadge(item.inspectionResult).text}
                              </span>
                              {item.inspectionResult.lastCrawlTime && (
                                <span className="text-[10px] text-muted-foreground block">
                                  Crawl: {item.inspectionResult.lastCrawlTime.split("T")[0]}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="line-clamp-3">
                              {item.gscReason || item.primaryIssue.label}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] break-words whitespace-normal text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex">
                            <span
                              className={
                                item.entityType === "PRODUCT"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                                  : item.entityType === "BLOG_POST"
                                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                                  : item.entityType === "CATEGORY"
                                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                                  : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                              }
                            >
                              {item.entityType === "PRODUCT"
                                ? "Sản phẩm"
                                : item.entityType === "BLOG_POST"
                                ? "Bài viết"
                                : item.entityType === "CATEGORY"
                                ? "Danh mục"
                                : "Chưa khớp"}
                            </span>
                          </div>
                          <span className="max-w-full truncate text-xs text-muted-foreground" title={item.entityTitle || "Không khớp thực thể"}>
                            {item.entityTitle || "Không khớp thực thể"}
                          </span>
                          {item.urlMapping ? (
                            <span className="max-w-full truncate text-xs text-muted-foreground" title={`Mapping: ${item.urlMapping.newUrl}`}>
                              Mapping: {item.urlMapping.newUrl}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            item.inSitemap
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                          }
                        >
                          {item.inSitemap ? "Có" : "Thiếu"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={item.primaryIssue.severity} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getDashboardEntityPath(item) ? (
                            <Button
                              asChild
                              type="button"
                              variant="outline"
                              size="sm"
                              className="px-2"
                            >
                              <a href={getDashboardEntityPath(item) ?? "#"}>
                                <IconEdit data-icon="inline-start" className="size-3" />
                                Mở sửa
                              </a>
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="px-2"
                            onClick={() => handleOpenRedirectDialog(item)}
                          >
                            <IconExternalLink data-icon="inline-start" className="size-3" />
                            {item.redirect ? "Sửa Redirect" : "Tạo Redirect"}
                          </Button>
                          {item.redirect?.id ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="px-2"
                              disabled={isDisablingRedirect}
                              onClick={() => setRedirectToDisable(item)}
                            >
                              <IconBan data-icon="inline-start" className="size-3" />
                              Tắt
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="px-2"
                            disabled={inspectingUrl === item.url}
                            onClick={() => handleInspectOne(item)}
                          >
                            {inspectingUrl === item.url ? (
                              <IconLoader2
                                data-icon="inline-start"
                                className="animate-spin size-3"
                              />
                            ) : (
                              <IconSearch data-icon="inline-start" className="size-3" />
                            )}
                            Inspect live
                          </Button>
                          {(item.primaryIssue.severity === "ok" || item.primaryIssue.key === "GOOGLE_REPORTED" || item.primaryIssue.key === "OK") && 
                            item.inspectionResult?.verdict !== "PASS" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="px-2 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 hover:text-emerald-800"
                              disabled={submittingUrl === item.url}
                              onClick={() => handleSubmitIndexingOne(item)}
                            >
                              {submittingUrl === item.url ? (
                                <IconLoader2
                                  data-icon="inline-start"
                                  className="animate-spin size-3"
                                />
                              ) : (
                                <IconSend data-icon="inline-start" className="size-3" />
                              )}
                              Index live
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow
                    colSpan={6}
                    text="Bấm Quét hệ thống hoặc import CSV rồi phân tích URL"
                  />
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t pt-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  Trang {currentPage} / {totalPages} · {formatNumber(filteredUrls.length)} URL
                </span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="10">10 / trang</SelectItem>
                      <SelectItem value="20">20 / trang</SelectItem>
                      <SelectItem value="50">50 / trang</SelectItem>
                      <SelectItem value="100">100 / trang</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                >
                  <IconChevronLeft data-icon="inline-start" className="size-4" />
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {getPageNumbers(currentPage, totalPages).map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-muted-foreground text-sm"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        type="button"
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon-sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Sau
                  <IconChevronRight data-icon="inline-end" className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Kết quả Live URL Inspection</CardTitle>
              <CardDescription>
                {inspection
                  ? `${formatNumber(inspection.total)} URL đã kiểm tra`
                  : "Chưa gọi Google API"}
              </CardDescription>
            </div>
            {inspection ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  downloadJson("gsc-inspection-results.json", inspection)
                }
              >
                <IconDownload data-icon="inline-start" />
                Xuất kết quả
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đường dẫn URL</TableHead>
                  <TableHead>Trạng thái Index (Coverage)</TableHead>
                  <TableHead>Thu thập dữ liệu (Fetch)</TableHead>
                  <TableHead>Khai báo Canonical</TableHead>
                  <TableHead>Lần quét (Crawl) gần nhất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspection?.results.length ? (
                  inspection.results.map((item) => (
                    <TableRow key={item.inspectionUrl}>
                      <TableCell className="max-w-[360px] truncate font-medium">
                        {item.inspectionUrl}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const badge = getInspectionCoverageBadge(item);
                          return (
                            <span className={badge.className}>
                              {badge.text}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatGscFetchState(item)}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-sm text-muted-foreground" title={formatGscCanonical(item)}>
                        {formatGscCanonical(item)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatGscCrawlTime(item.lastCrawlTime)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow colSpan={5} text="Chưa có kết quả inspect" />
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(redirectToDisable)}
        title="Tắt redirect này?"
        description={
          redirectToDisable?.redirect
            ? `${redirectToDisable.redirect.sourcePath} -> ${redirectToDisable.redirect.targetPath}`
            : undefined
        }
        confirmLabel="Tắt redirect"
        destructive
        isLoading={isDisablingRedirect}
        onOpenChange={(open) => {
          if (!open) setRedirectToDisable(null)
        }}
        onConfirm={handleConfirmDisableRedirect}
      />

      <Dialog open={isRedirectDialogOpen} onOpenChange={setIsRedirectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {redirectDialogUrlItem?.redirect ? "Cấu hình / Sửa Redirect" : "Tạo chuyển hướng Redirect chuẩn"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập chuyển hướng URL để đảm bảo người dùng và bot tìm kiếm (Googlebot) được dẫn đến trang hoạt động tốt (trả về mã 200).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Đường dẫn nguồn (Source Path)</label>
              <Input
                value={redirectSourcePath}
                onChange={(e) => setRedirectSourcePath(e.target.value)}
                placeholder="/duong-dan-nguon"
                className="font-mono text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
                disabled
              />
              <span className="text-xs text-muted-foreground">Đường dẫn bị lỗi cần chuyển hướng đi.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Đường dẫn đích chuẩn (Target Path)</label>
              <Input
                value={redirectDestinationPath}
                onChange={(e) => setRedirectDestinationPath(e.target.value)}
                placeholder="/blog/duong-dan-moi-chuan"
                className="font-mono text-sm"
              />
              <span className="text-xs text-muted-foreground">Nhập đường dẫn hoạt động tốt (ví dụ `/blog/bai-viet-moi` hoặc `/products/san-pham-chuan`).</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Kiểu Redirect</label>
                <Select value={redirectType} onValueChange={setRedirectType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn kiểu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 (Vĩnh viễn - Khuyên dùng)</SelectItem>
                    <SelectItem value="302">302 (Tạm thời)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="redirect-active"
                  checked={redirectIsActive}
                  onChange={(e) => setRedirectIsActive(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="redirect-active" className="text-sm font-medium cursor-pointer">
                  Kích hoạt ngay
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmittingRedirect}
              onClick={() => setIsRedirectDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={isSubmittingRedirect}
              onClick={handleSaveRedirect}
            >
              {isSubmittingRedirect ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu cấu hình"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
