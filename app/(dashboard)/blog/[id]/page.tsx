"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
  type Editor,
  type NodeViewProps,
} from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Extension, mergeAttributes } from "@tiptap/core"
import Blockquote from "@tiptap/extension-blockquote"
import Color from "@tiptap/extension-color"
import FontFamily from "@tiptap/extension-font-family"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import LinkExtension from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import { DOMSerializer } from "@tiptap/pm/model"
import {
  IconArrowLeft,
  IconBlockquote,
  IconCheckupList,
  IconCheck,
  IconChevronDown,
  IconClearFormatting,
  IconCode,
  IconCornerDownLeft,
  IconDeviceFloppy,
  IconHighlight,
  IconEye,
  IconFileText,
  IconGlobe,
  IconH3,
  IconLineDashed,
  IconLink,
  IconLoader2,
  IconList,
  IconListNumbers,
  IconPhoto,
  IconPaint,
  IconPlus,
  IconRefresh,
  IconResize,
  IconSearch,
  IconSeo,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTable,
  IconTableColumn,
  IconTableRow,
  IconTextDirectionRtl,
  IconBold,
  IconTextColor,
  IconItalic,
  IconTextWrapDisabled,
  IconTextSize,
  IconTextSpellcheck,
  IconTextWrap,
  IconTrash,
  IconX,
  IconWand,
  IconArrowUp,
  IconArrowDown,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconGripVertical,
  IconLayoutAlignLeft,
  IconLayoutAlignCenter,
  IconLayoutAlignRight,
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { SeoScoringPanel } from "@/components/seo/seo-scoring-panel"
import { useSeoAnalysis } from "@/hooks/use-seo-analysis"
import type { SeoInput } from "@/lib/seo/types"
import { generateTableOfContents, generateHeadingId } from "@/lib/seo/table-of-contents"
import { suggestInternalLinks } from "@/lib/seo/internal-links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CreateBlogPostPayload,
  CreateBlogPostPayloadSchema,
  type BlogAiAssistResult,
  type BlogAiBlockAssistResult,
  type BlogAiTask,
  type BlogCategory,
  type BlogReusableBlock,
  type BlogReusableBlockType,
  type BlogPost,
} from "@/lib/api/schemas/blog.schema"
import { ContentStatus, type ContentStatusType, TagType } from "@/lib/api/schemas/enums"
import type { Media } from "@/lib/api/schemas/media.schema"
import type { Tag } from "@/lib/api/schemas/tag.schema"
import { blogService } from "@/lib/api/services/blog.service"
import { mediaService } from "@/lib/api/services/media.service"
import { tagService } from "@/lib/api/services/tag.service"
import { cn } from "@/lib/utils"

const NO_CATEGORY = "NO_CATEGORY"
const STOREFRONT_URL = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://dukystore.com"
).replace(/\/+$/g, "")

function storefrontPath(path: string) {
  return `${STOREFRONT_URL}${path.startsWith("/") ? path : `/${path}`}`
}

const BLOG_AI_TASK_LABELS: Record<BlogAiTask, string> = {
  FULL_DRAFT: "Tạo nháp đầy đủ",
  SEO: "Tối ưu SEO",
  OUTLINE: "Lên dàn ý",
  OPTIMIZE: "Tối ưu bài hiện tại",
  INTERNAL_LINKS: "Gợi ý internal link",
  IMAGE_ALT: "Alt ảnh & caption",
}

const BLOG_AI_TASK_HINTS: Record<BlogAiTask, string> = {
  FULL_DRAFT: "Tạo tiêu đề, mô tả, nội dung HTML, FAQ, SEO và link gợi ý.",
  SEO: "Sửa các lỗi điểm SEO: keyword, link, ảnh, độ dài và readability.",
  OUTLINE: "Tạo cấu trúc H2/H3 để viết bài nhanh hơn.",
  OPTIMIZE: "Rewrite sâu hơn để bài mượt, dễ đọc và bán hàng tốt hơn.",
  INTERNAL_LINKS: "Gợi ý link sang sản phẩm hoặc bài viết liên quan.",
  IMAGE_ALT: "Gợi ý alt/caption cho ảnh trong bài và ảnh đại diện.",
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "75%",
        parseHTML: (element) => {
          const figure = element.closest("figure")
          return (
            element.getAttribute("data-width") ||
            figure?.getAttribute("data-width") ||
            figure?.style.width ||
            element.style.width ||
            "75%"
          )
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const figure = element.closest("figure")
          const rawAlign =
            element.getAttribute("data-align") ||
            figure?.getAttribute("data-align") ||
            figure?.style.float ||
            "center"
          return rawAlign === "left" || rawAlign === "right" ? rawAlign : "center"
        },
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-caption") ||
          element.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ||
          "",
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const width = (HTMLAttributes.width as string | undefined) || "75%"
    const align = (HTMLAttributes.align as string | undefined) || "center"
    const caption = ((HTMLAttributes.caption as string | undefined) ?? "").trim()
    const figureStyle =
      align === "left"
        ? "float:left;margin:8px 24px 18px 0;"
        : align === "right"
          ? "float:right;margin:8px 0 18px 24px;"
          : "float:none;margin:28px auto;"
    const figureAttrs = mergeAttributes({
      class: "duky-blog-image-figure",
      "data-width": width,
      "data-align": align,
      "data-caption": caption,
      contenteditable: "false",
      draggable: "true",
      style: `${figureStyle}width:${width};max-width:100%;display:block;text-align:center;`,
    })
    const imageAttrs = mergeAttributes(this.options.HTMLAttributes, {
      src: HTMLAttributes.src,
      alt: HTMLAttributes.alt,
      title: HTMLAttributes.title,
      class: "rounded-2xl",
      "data-width": width,
      "data-align": align,
      "data-caption": caption,
      style: "display:block;width:100%;height:auto;margin:0;border-radius:24px;",
    })
    const children: unknown[] = ["figure", figureAttrs, ["img", imageAttrs]]

    if (caption) {
      children.push([
        "figcaption",
        {
          class: "duky-blog-image-caption",
          style:
            "margin-top:10px;text-align:center;font-size:14px;line-height:1.6;color:#6b7280;font-style:italic;",
        },
        caption,
      ])
    }

    return children as any
  },
})

const fontFamilies = [
  { label: "Mặc định", value: "" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier", value: "'Courier New', monospace" },
]

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"]

const colorSwatches = [
  "#111827",
  "#374151",
  "#ea580c",
  "#dc2626",
  "#16a34a",
  "#0f766e",
  "#2563eb",
  "#1d4ed8",
  "#7c3aed",
  "#db2777",
]

const highlightSwatches = [
  "#ffffff",
  "#ffedd5",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#f3e8ff",
  "#fce7f3",
  "#e0f2fe",
  "#ecfccb",
  "#fde68a",
]

const tableCellBackgroundSwatches = [
  "#ffffff",
  "#f8fafc",
  "#f5f5f4",
  "#ffedd5",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#f3e8ff",
]

const DEFAULT_BLOG_TABLE_STYLE = "width: 100%; min-width: 100%; table-layout: fixed;"

function readCssDeclaration(style: string | null | undefined, property: string) {
  const target = property.trim().toLowerCase()
  if (!style || !target) return ""

  const declaration = style
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .find((rule) => rule.split(":")[0]?.trim().toLowerCase() === target)

  return declaration?.split(":").slice(1).join(":").trim() ?? ""
}

function writeCssDeclaration(
  style: string | null | undefined,
  property: string,
  value?: string | null
) {
  const target = property.trim().toLowerCase()
  const nextValue = value?.trim()
  const rules = (style ?? "")
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .filter((rule) => rule.split(":")[0]?.trim().toLowerCase() !== target)

  if (nextValue) {
    rules.push(`${property}: ${nextValue}`)
  }

  return rules.length ? `${rules.join("; ")};` : null
}

function writeCssDeclarations(
  style: string | null | undefined,
  declarations: Record<string, string | null | undefined>
) {
  return Object.entries(declarations).reduce(
    (nextStyle, [property, value]) => writeCssDeclaration(nextStyle, property, value),
    style ?? null
  )
}

const BlogTable = Table.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      tableStyle: {
        default: DEFAULT_BLOG_TABLE_STYLE,
        parseHTML: (element) =>
          element.getAttribute("style") ||
          element.getAttribute("data-table-style") ||
          DEFAULT_BLOG_TABLE_STYLE,
        renderHTML: (attributes) => ({
          "data-table-style": attributes.tableStyle || DEFAULT_BLOG_TABLE_STYLE,
          style: attributes.tableStyle || DEFAULT_BLOG_TABLE_STYLE,
        }),
      },
    }
  },
})

const BlogTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      cellStyle: {
        default: null,
        parseHTML: (element) => element.getAttribute("style") || null,
        renderHTML: (attributes) => (attributes.cellStyle ? { style: attributes.cellStyle } : {}),
      },
    }
  },
})

const BlogTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      cellStyle: {
        default: null,
        parseHTML: (element) => element.getAttribute("style") || null,
        renderHTML: (attributes) => (attributes.cellStyle ? { style: attributes.cellStyle } : {}),
      },
    }
  },
})

type Feedback = {
  message: string
  tone: "info" | "success" | "error"
}

const CONTENT_BLOCK_SEPARATOR = "<!-- duky-block -->"

const statusLabels: Record<string, string> = {
  [ContentStatus.PUBLISHED]: "Công khai",
  [ContentStatus.DRAFT]: "Tin nháp",
  [ContentStatus.HIDDEN]: "Ẩn",
  [ContentStatus.ARCHIVED]: "Lưu trữ",
}

const statusHints: Record<string, string> = {
  [ContentStatus.PUBLISHED]: "Bài viết hiển thị trên website",
  [ContentStatus.DRAFT]: "Chỉ lưu trong hệ thống quản trị",
  [ContentStatus.HIDDEN]: "Không hiển thị ngoài storefront",
  [ContentStatus.ARCHIVED]: "Giữ dữ liệu, không xuất bản",
}

const DEFAULT_NEW_BLOG_MOCK_TITLE = "Xu Hướng Áo Blazer Nữ 2026: Mặc Sao Cho Sang Mà Vẫn Dễ Ứng Dụng"
const DEFAULT_NEW_BLOG_MOCK_EXCERPT =
  "Tổng hợp xu hướng blazer nữ mới nhất 2026, cách chọn form theo dáng người và gợi ý phối đồ nhanh cho đi làm, đi chơi, dự sự kiện."
const DEFAULT_NEW_BLOG_MOCK_BODY_CONTENT = `<p>Áo blazer nữ đang là item "must-have" trong tủ đồ công sở lẫn dạo phố. Năm 2026, blazer không chỉ dừng ở sự thanh lịch mà còn thiên về tính linh hoạt: dễ phối, dễ layer và hợp nhiều hoàn cảnh.</p>
<h3>1. Vì Sao Blazer Vẫn Là Item Chủ Đạo?</h3>
<ul><li><strong>Dễ phối:</strong> đi làm, đi gặp khách, đi cafe đều hợp.</li><li><strong>Tôn dáng:</strong> tạo khung vai gọn, tổng thể chỉnh chu hơn.</li><li><strong>Đa mùa:</strong> phối được cả xuân, thu, đông nhẹ.</li></ul>
<h3>2. 5 Kiểu Blazer Đáng Mua Nhất</h3>
<ol><li><strong>Blazer form suông:</strong> hợp nhiều vóc dáng, dễ mặc hàng ngày.</li><li><strong>Blazer chiết eo:</strong> tôn vòng eo, hợp phong cách nữ tính.</li><li><strong>Blazer oversize:</strong> trẻ trung, hợp style năng động.</li><li><strong>Blazer tay lửng:</strong> nhẹ nhàng, phù hợp mùa nóng.</li><li><strong>Blazer màu trung tính:</strong> đen, be, xám, navy dễ phối đồ.</li></ol>
<h3>3. Gợi Ý Phối Đồ Nhanh</h3>
<p><strong>Đi làm:</strong> blazer + áo thun trơn + quần tây + loafer.</p>
<p><strong>Đi chơi:</strong> blazer oversize + áo hai dây + quần jeans + sneaker.</p>
<p><strong>Đi sự kiện:</strong> blazer chiết eo + chân váy midi + giày cao gót.</p>
<h3>Kết Luận</h3>
<p>Blazer là khoản đầu tư thời trang thông minh vì tính ứng dụng cao và bền xu hướng.</p>`

const DEFAULT_NEW_BLOG_MOCK_FOOTER_CONTENT = `<div style="margin-top:20px; border:1px solid #e5e7eb; border-radius:14px; padding:16px 18px; background:#fafaf9;">
  <h3 style="margin:0 0 10px 0; font-size:20px; font-weight:700; color:#1f2937;">Thông Tin Liên Hệ</h3>
  <p style="margin:0 0 8px 0; font-size:17px; font-weight:700; color:#111827;">Duky Store</p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">Hotline: <a href="tel:0900000000" style="color:#ea580c; text-decoration:none;">0900 000 000</a></p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">Email: <a href="mailto:contact@duky.store" style="color:#ea580c; text-decoration:none;">contact@duky.store</a></p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">Website: <a href="https://duky.store" target="_blank" rel="noopener noreferrer" style="color:#ea580c; text-decoration:none;">https://duky.store</a></p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
  <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #d6d3d1; color:#6b7280; font-size:13px;">Cảm ơn bạn đã theo dõi bài viết. Liên hệ ngay để được tư vấn nhanh và nhận ưu đãi mới nhất.</div>
</div>`

const EMPTY_NEW_BLOG_TITLE = ""

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä'/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function uniqueSlug(baseSlug: string, suffix: string) {
  const cleanBase = slugify(baseSlug) || "bai-viet"
  const cleanSuffix = slugify(suffix).slice(0, 8) || Date.now().toString(36)
  return `${cleanBase}-${cleanSuffix}`
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeKeywordList(value: string) {
  return value
    .split(/[,;\n]+/g)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword, index, keywords) =>
      keywords.findIndex((item) => item.toLowerCase() === keyword.toLowerCase()) === index
    )
    .join(", ")
}

function normalizeKeywordForCompare(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function getPrimaryKeywordWarning(keyword: string | undefined, title: string | undefined) {
  const primaryKeyword = keyword?.trim()
  if (!primaryKeyword) return null

  const wordCount = primaryKeyword.split(/\s+/).filter(Boolean).length
  const normalizedKeyword = normalizeKeywordForCompare(primaryKeyword)
  const normalizedTitle = normalizeKeywordForCompare(title)

  if (normalizedTitle && normalizedKeyword === normalizedTitle) {
    return "Từ khóa chính đang giống tiêu đề. Nên rút còn cụm search ngắn hơn, ví dụ 3-5 từ."
  }

  if (wordCount > 6) {
    return "Từ khóa chính hơi dài. Nên dùng 2-6 từ, còn phần mở rộng đưa xuống từ khóa phụ."
  }

  if (/[.!?:|]/.test(primaryKeyword)) {
    return "Từ khóa chính không nên có dấu câu như tiêu đề. Hãy dùng cụm search tự nhiên hơn."
  }

  return null
}

function isSlugConflictError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const maybeError = error as {
    EC?: number
    EM?: string
    DT?: {
      code?: string
      details?: unknown
    }
  }

  return (
    maybeError.EC === 409 ||
    maybeError.DT?.code === "409_CONFLICT" ||
    maybeError.EM?.toLowerCase().includes("slug") === true
  )
}

function createDraftUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isDefaultNewBlogTitle(title?: string | null) {
  return !title?.trim() || title.trim() === DEFAULT_NEW_BLOG_MOCK_TITLE
}

function minifyHtmlForStorage(html: string) {
  return html
    .replace(new RegExp(CONTENT_BLOCK_SEPARATOR, "g"), " ")
    .replace(/\r?\n/g, " ")
    .replace(/\t+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function minifyHtmlForEditorDraft(html: string) {
  const separator = CONTENT_BLOCK_SEPARATOR
  const parts = html.split(separator)
  const minifiedParts = parts.map((part) =>
    part
      .replace(/\r?\n/g, " ")
      .replace(/\t+/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim()
  )
  return minifiedParts.filter(Boolean).join(` ${separator} `)
}

function splitContentToBlocks(content?: string | null) {
  const raw = flattenNestedBlockWrappers((content ?? "").trim())
  if (!raw) return []

  const bySeparator = raw
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean)
  if (bySeparator.length > 1) return bySeparator

  const blockWrapperPattern =
    /<blockquote[^>]*(?:data-duky-block="true"|data-duky-block)[^>]*>[\s\S]*?<\/blockquote>|<blockquote[^>]*>[\s\S]*?<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>[\s\S]*?<\/blockquote>/gi
  const mixedBlocks: string[] = []
  let lastIndex = 0

  for (const match of raw.matchAll(blockWrapperPattern)) {
    const index = match.index ?? 0
    const before = raw.slice(lastIndex, index).trim()
    if (before) mixedBlocks.push(before)
    mixedBlocks.push(match[0].trim())
    lastIndex = index + match[0].length
  }

  const tail = raw.slice(lastIndex).trim()
  if (tail) mixedBlocks.push(tail)

  if (mixedBlocks.length) {
    return mixedBlocks
  }

  return [raw]
}

function inferBlockTypeFromHtml(html: string): "title" | "content" | "footer" {
  const normalized = html.toLowerCase()
  if (normalized.includes("thông tin liên hệ") || normalized.includes("hotline:")) {
    return "footer"
  }
  if (normalized.startsWith("<h1") || normalized.startsWith("<h2") || normalized.startsWith("<h3")) {
    return "title"
  }
  return "content"
}

function blockTypeLabel(type: "title" | "content" | "footer") {
  if (type === "title") return "Block Tiêu Đề"
  if (type === "footer") return "Block Footer Liên Hệ"
  return "Block Nội Dung"
}

function toReusableBlockType(type: "title" | "content" | "footer"): BlogReusableBlockType {
  if (type === "title") return "TITLE"
  if (type === "footer") return "FOOTER"
  return "CONTENT"
}

function toEditorBlockType(type?: BlogReusableBlockType | null): "title" | "content" | "footer" {
  if (type === "TITLE") return "title"
  if (type === "FOOTER") return "footer"
  return "content"
}

function blockTypeFromNodeAttrs(attrs: Record<string, unknown>): "title" | "content" | "footer" {
  const value = attrs.dukyBlockType
  if (value === "title" || value === "footer" || value === "content") return value
  return "content"
}

function stripLegacyBlockLabel(html: string) {
  return html
    .replace(/^\s*<div[^>]*data-duky-block-head[^>]*>[\s\S]*?<\/div>\s*/i, "")
    .replace(
      /^\s*<p>\s*<strong>\s*block\s+(?:tiêu\s*đề|nội\s*dung|footer\s+liên\s+hệ)\s*<\/strong>\s*<\/p>\s*/i,
      ""
    )
    .replace(/^\s*<p>\s*[↑↓×\s]+\s*<\/p>\s*/i, "")
    .trim()
}

function getMainTitle(title?: string | null) {
  return title?.trim() || "Tiêu đề bài viết"
}

function createTitleBlock(title?: string | null) {
  return wrapHtmlAsBlock(`<h1>${escapeHtml(getMainTitle(title))}</h1>`, "title")
}

function isTitleBlockHtml(block: string) {
  const normalized = block.trim().toLowerCase()
  return (
    normalized.includes('data-duky-block-type="title"') ||
    unwrapBlockHtml(block).trim().toLowerCase().startsWith("<h1")
  )
}

function ensureTitleBlockContent(content: string | null | undefined, title?: string | null) {
  const blocks = splitContentToBlocks(content)
  const titleBlock = createTitleBlock(title)
  const bodyBlocks = blocks
    .filter((block, index) => !(index === 0 && isTitleBlockHtml(block)))
    .map((block) => {
      const unwrapped = unwrapBlockHtml(block).trim()
      const withoutLeadingH1 = stripLeadingH1(unwrapped).content
      if (!withoutLeadingH1) return ""
      return isBlockWrapperHtml(block)
        ? wrapHtmlAsBlock(withoutLeadingH1, inferBlockTypeFromHtml(withoutLeadingH1))
        : withoutLeadingH1
    })
    .filter(Boolean)

  return mergeBlocksToContent([titleBlock, ...bodyBlocks])
}

function stripLeadingH1(html: string) {
  let title: string | null = null
  const content = html.replace(/^\s*<h1\b[^>]*>([\s\S]*?)<\/h1>\s*/i, (_match, heading) => {
    title = String(heading)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return ""
  })

  return { title, content: content.trim() }
}

function splitHtmlIntoContentBlocks(html: string) {
  const raw = html.trim()
  if (!raw) return []
  const withoutTopH1 = stripLeadingH1(raw).content
  if (!withoutTopH1) return []

  const parts = withoutTopH1
    .replace(/(<h2\b[^>]*>)/gi, `${CONTENT_BLOCK_SEPARATOR}$1`)
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.map((part) => wrapHtmlAsBlock(part, inferBlockTypeFromHtml(part) === "footer" ? "footer" : "content"))
}

function cleanAiContentHtml(html: string, options?: { dropTitleBlocks?: boolean }) {
  const rawBlocks = splitContentToBlocks(html)
  const unwrappedBlocks = (rawBlocks.length ? rawBlocks : [html])
    .map((block) => {
      const flattened = flattenNestedBlockWrappers(block)
      const unwrapped = unwrapBlockHtml(flattened)
      return stripLeadingH1(unwrapped).content
    })
    .filter((block) => block && !(options?.dropTitleBlocks && isTitleBlockHtml(block)))

  return unwrappedBlocks.join(`\n${CONTENT_BLOCK_SEPARATOR}\n`).trim()
}

function parseOutlineHeading(item: string) {
  const withoutTags = item.replace(/<[^>]+>/g, " ")
  const withoutListMarker = withoutTags
    .replace(/^\s*(?:[-*•]\s*)+/, "")
    .replace(/^\s*\d+[\s.)-]+/, "")
    .trim()
  const headingMatch = withoutListMarker.match(/^h([1-6])\s*[:.)-]\s*/i)
  const level = headingMatch ? Number(headingMatch[1]) : 2
  const text = (headingMatch
    ? withoutListMarker.slice(headingMatch[0].length)
    : withoutListMarker
  )
    .replace(/\s+/g, " ")
    .trim()

  return {
    level,
    text,
  }
}

function getOutlineDisplayText(item: string) {
  return parseOutlineHeading(item).text || item.trim()
}

function splitOutlineIntoContentBlocks(outline: string[]) {
  const blocks: string[] = []
  let currentBlockParts: string[] = []

  const flushBlock = () => {
    if (!currentBlockParts.length) return
    blocks.push(wrapHtmlAsBlock(currentBlockParts.join(""), "content"))
    currentBlockParts = []
  }

  outline.forEach((item) => {
    const { level, text } = parseOutlineHeading(item)
    if (!text || /^dàn\s*ý$/i.test(text)) return

    if (level <= 2) {
      flushBlock()
      currentBlockParts.push(`<h2>${escapeHtml(text)}</h2>`)
      return
    }

    if (!currentBlockParts.length) {
      currentBlockParts.push(`<h2>${escapeHtml(text)}</h2>`)
      return
    }

    currentBlockParts.push(`<h3>${escapeHtml(text)}</h3>`)
  })

  flushBlock()

  return blocks
}

type AiInlineImageSelection = NonNullable<
  NonNullable<BlogAiAssistResult["selectedMedia"]>["inlineImages"]
>[number]

function getMediaAssetUrl(media?: Pick<Media, "url" | "secureUrl"> | null) {
  return media?.secureUrl || media?.url || ""
}

function getAiSelectedMediaIds(result: BlogAiAssistResult | null) {
  const selectedMedia = result?.selectedMedia
  if (!selectedMedia) return []

  return Array.from(
    new Set([
      selectedMedia.coverMediaId,
      selectedMedia.ogImageMediaId,
      ...(selectedMedia.inlineImages ?? []).map((image) => image.mediaId),
    ].filter(Boolean) as string[])
  )
}

async function fetchAiSelectedMedia(result: BlogAiAssistResult | null) {
  const ids = getAiSelectedMediaIds(result)
  if (!ids.length) return []

  const media = await Promise.all(
    ids.map((id) =>
      mediaService.getMedia(id).catch(() => null)
    )
  )

  return media.filter(Boolean) as Media[]
}

function createAiImageHtml(media: Media, selection: AiInlineImageSelection) {
  const url = getMediaAssetUrl(media)
  if (!url) return ""

  const alt = selection.alt || media.altText || media.title || media.filename || "Ảnh minh họa"
  const caption = selection.caption || media.title || media.altText || ""

  return [
    `<figure data-width="75%" data-align="center" data-caption="${escapeHtml(caption)}" style="float:none;margin:28px auto;width:75%;max-width:100%;display:block;text-align:center;">`,
    `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" title="${escapeHtml(media.title || alt)}" data-width="75%" data-align="center" data-caption="${escapeHtml(caption)}" style="display:block;width:100%;height:auto;margin:0;border-radius:24px;" />`,
    caption
      ? `<figcaption class="duky-blog-image-caption" style="margin-top:10px;text-align:center;font-size:14px;line-height:1.6;color:#6b7280;font-style:italic;">${escapeHtml(caption)}</figcaption>`
      : "",
    "</figure>",
  ].join("")
}

function insertAiSelectedImagesIntoHtml(
  html: string,
  selectedMedia: BlogAiAssistResult["selectedMedia"],
  mediaById: Map<string, Media>
) {
  const inlineImages = selectedMedia?.inlineImages ?? []
  if (!html.trim() || !inlineImages.length) return html

  let nextHtml = html

  inlineImages.slice(0, 3).forEach((selection) => {
    const media = mediaById.get(selection.mediaId)
    const imageHtml = media ? createAiImageHtml(media, selection) : ""
    if (!imageHtml || nextHtml.includes(getMediaAssetUrl(media))) return

    const afterHeading = selection.afterHeading?.trim()
    if (afterHeading) {
      const escapedHeading = afterHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const headingPattern = new RegExp(`(<h[23]\\b[^>]*>[^<]*${escapedHeading}[^<]*<\\/h[23]>)`, "i")
      if (headingPattern.test(nextHtml)) {
        nextHtml = nextHtml.replace(headingPattern, `$1${imageHtml}`)
        return
      }
    }

    const firstH2Pattern = /(<h2\b[^>]*>[\s\S]*?<\/h2>)/i
    if (firstH2Pattern.test(nextHtml)) {
      nextHtml = nextHtml.replace(firstH2Pattern, `$1${imageHtml}`)
      return
    }

    nextHtml = `${nextHtml}${imageHtml}`
  })

  return nextHtml
}

function buildSeoAnalysisForAi(seoResult: ReturnType<typeof useSeoAnalysis>) {
  if (!seoResult) return null

  const failedChecks = seoResult.checks
    .filter((check) => !check.passed)
    .map((check) => ({
      id: check.id,
      label: check.label,
      category: check.category,
      description: check.description,
    }))

  return {
    score: seoResult.score,
    targetScore: 82,
    failedChecks,
    scoringNotes: [
      "Basic SEO moi check khoang 10 diem: keyword trong title, meta description, slug, intro, content, va noi dung >= 600 tu.",
      "Additional SEO moi check khoang 5 diem: keyword trong H2/H3, alt anh, density 1-2.5%, slug ngan, external link, internal link.",
      "Title/readability va content/readability la diem cong nho: title co keyword o nua dau, co so, doan ngan, co media, cau ngan va khong lap cach mo dau.",
      "Neu score duoi 80, uu tien sua failedChecks trong noi dung/anh/link. Metadata do FE tu sinh.",
    ],
  }
}

function normalizePlainText(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function truncateSeoText(value: string, maxLength: number) {
  const clean = normalizePlainText(value)
  if (clean.length <= maxLength) return clean

  const sliced = clean.slice(0, maxLength + 1)
  const sentenceCut = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf("!"),
    sliced.lastIndexOf("?")
  )
  const wordCut = sliced.lastIndexOf(" ")
  const cutAt = sentenceCut >= Math.floor(maxLength * 0.55)
    ? sentenceCut + 1
    : wordCut >= Math.floor(maxLength * 0.7)
      ? wordCut
      : maxLength

  return clean.slice(0, cutAt).trim().replace(/[,\-:;]+$/g, "")
}

function buildAutoSeoFields(input: {
  title?: string | null
  excerpt?: string | null
  content?: string | null
  slug: string
  focusKeyword: string
}) {
  const title = normalizePlainText(input.title)
  const focusKeyword = normalizePlainText(input.focusKeyword.split(",")[0])
  const contentText = normalizePlainText(stripBlockWrappersForHtml(input.content))
  const excerpt = normalizePlainText(input.excerpt) || truncateSeoText(contentText, 155)
  const titleWithKeyword =
    focusKeyword && title && !title.toLowerCase().includes(focusKeyword.toLowerCase())
      ? `${focusKeyword}: ${title}`
      : title || focusKeyword
  const metaTitle = truncateSeoText(titleWithKeyword, 60)
  const metaDescription = truncateSeoText(
    excerpt || `${metaTitle} - Gợi ý chọn mua và phối đồ tại Duky Store.`,
    160
  )

  return {
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    canonicalUrl: input.slug ? storefrontPath(`/blog/${input.slug}`) : "",
  }
}

function composeAiContentBlocks(contentHtml: string, title?: string | null) {
  const stripped = stripLeadingH1(cleanAiContentHtml(contentHtml))
  const mainTitle = stripped.title || title
  const bodyBlocks = splitHtmlIntoContentBlocks(stripped.content)
  return mergeBlocksToContent([createTitleBlock(mainTitle), ...bodyBlocks])
}

function composeAiSeoContentBlocks(contentHtml: string) {
  return mergeBlocksToContent(
    splitHtmlIntoContentBlocks(
      cleanAiContentHtml(contentHtml, { dropTitleBlocks: true })
    )
  )
}

function getTopLevelNodeInfo(props: NodeViewProps) {
  if (typeof props.getPos !== "function") return null

  const pos = props.getPos()
  if (typeof pos !== "number") return null
  const siblings: Array<{ node: typeof props.node; offset: number }> = []
  let currentIndex = -1

  props.editor.state.doc.forEach((node, offset, index) => {
    siblings.push({ node, offset })
    if (offset === pos) currentIndex = index
  })

  if (currentIndex < 0) return null
  return { currentIndex, pos, siblings }
}

function moveBlockNode(props: NodeViewProps, direction: "up" | "down") {
  const info = getTopLevelNodeInfo(props)
  if (!info) return

  const { currentIndex, pos, siblings } = info
  const type = blockTypeFromNodeAttrs(props.node.attrs)
  if (type === "title" && currentIndex === 0) return
  if (direction === "up" && currentIndex <= 1 && isTitleBlockHtml(props.node.toString?.() ?? "")) return
  if (direction === "up" && currentIndex <= 1) return
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  const target = siblings[targetIndex]
  if (!target) return

  const node = props.node
  const transaction = props.editor.state.tr.delete(pos, pos + node.nodeSize)

  if (direction === "up") {
    transaction.insert(target.offset, node)
  } else {
    transaction.insert(pos + target.node.nodeSize, node)
  }

  props.editor.view.dispatch(transaction)
  props.editor.commands.focus()
}

function moveTopLevelNodeByIndex(editor: Editor, fromIndex: number, toIndex: number) {
  const siblings: Array<{ node: typeof editor.state.doc; offset: number }> = []

  editor.state.doc.forEach((node, offset) => {
    siblings.push({ node, offset })
  })

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= siblings.length ||
    toIndex >= siblings.length ||
    fromIndex === toIndex ||
    fromIndex === 0 ||
    toIndex === 0
  ) {
    return
  }

  const source = siblings[fromIndex]
  const target = siblings[toIndex]
  const insertPosition = toIndex > fromIndex
    ? target.offset + target.node.nodeSize
    : target.offset
  const transaction = editor.state.tr.delete(
    source.offset,
    source.offset + source.node.nodeSize
  )

  transaction.insert(transaction.mapping.map(insertPosition), source.node)
  editor.view.dispatch(transaction)
  editor.commands.focus()
}

function removeBlockNode(props: NodeViewProps) {
  if (typeof props.getPos !== "function") return

  const info = getTopLevelNodeInfo(props)
  const type = blockTypeFromNodeAttrs(props.node.attrs)
  if (type === "title" && info?.currentIndex === 0) return

  const blockquoteStorage = (props.editor.storage as unknown as Record<string, unknown>)
    .blockquote as BlogBlockquoteStorage | undefined
  if (info && blockquoteStorage?.onRemoveBlock) {
    blockquoteStorage.onRemoveBlock(info.currentIndex)
    return
  }

  const pos = props.getPos()
  if (typeof pos !== "number") return

  const transaction = props.editor.state.tr.delete(pos, pos + props.node.nodeSize)
  props.editor.view.dispatch(transaction)
  props.editor.commands.focus()
}

function insertHtmlAfterBlockNode(props: NodeViewProps, html: string) {
  if (typeof props.getPos !== "function") return

  const pos = props.getPos()
  if (typeof pos !== "number") return

  props.editor
    .chain()
    .focus()
    .insertContentAt(pos + props.node.nodeSize, html)
    .run()
}

type SaveReusableBlockRequest = {
  type: "title" | "content" | "footer"
  html: string
}

type BlogAiBlockContext = {
  articleExcerpt?: string
  focusKeyword?: string
  articleType?: string
  tone?: string
  outline?: string[]
  previousBlockHtml?: string
  nextBlockHtml?: string
  seoScore?: number
  seoFailedChecks?: string[]
}

type BlogBlockquoteStorage = {
  onSaveReusableBlock?: ((data: SaveReusableBlockRequest) => void) | null
  onRemoveBlock?: ((index: number) => void) | null
  onReplaceBlock?: ((index: number, html: string, type: "title" | "content" | "footer") => void) | null
  getAiContext?: ((index: number | null) => BlogAiBlockContext) | null
  reusableBlocks?: BlogReusableBlock[]
  currentTitle?: string
}

function serializeBlockNodeContent(props: NodeViewProps) {
  const document = props.editor.view.dom.ownerDocument
  const container = document.createElement("div")
  const fragment = DOMSerializer.fromSchema(props.editor.schema).serializeFragment(
    props.node.content,
    { document }
  )

  container.appendChild(fragment)
  return stripLegacyBlockLabel(container.innerHTML)
}

const BLOG_AI_ALLOWED_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "UL",
  "OL",
  "LI",
  "STRONG",
  "EM",
  "A",
  "BLOCKQUOTE",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
  "IMG",
  "HR",
])

function sanitizeBlockAiHtml(html: string) {
  if (typeof document === "undefined") return html.trim()

  const template = document.createElement("template")
  template.innerHTML = html

  template.content.querySelectorAll("*").forEach((element) => {
    if (!BLOG_AI_ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const keep =
        (element.tagName === "A" && name === "href") ||
        (element.tagName === "IMG" && ["src", "alt", "title"].includes(name))

      if (!keep) element.removeAttribute(attribute.name)
    })

    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? ""
      if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(href)) element.removeAttribute("href")
    }

    if (element.tagName === "IMG") {
      const src = element.getAttribute("src") ?? ""
      if (!/^(https?:\/\/|\/)/i.test(src)) element.remove()
    }
  })

  return template.innerHTML.trim()
}

function normalizeBlockAiReplacementHtml(html: string, type: "title" | "content" | "footer") {
  const unwrapped = unwrapBlockHtml(flattenNestedBlockWrappers(html))
  const safeHtml = sanitizeBlockAiHtml(unwrapped)
  if (type === "title") return safeHtml

  return safeHtml
    .replace(/<h1(\b[^>]*)>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>")
    .trim()
}

function extractBlockTitleFromHtml(html: string) {
  const safeHtml = normalizeBlockAiReplacementHtml(html, "title")
  if (typeof document === "undefined") return ""

  const container = document.createElement("div")
  container.innerHTML = safeHtml
  const heading = container.querySelector("h1, h2, h3")
  return (heading?.textContent ?? container.textContent ?? "").replace(/\s+/g, " ").trim()
}

function replaceBlockNodeContent(props: NodeViewProps, html: string) {
  if (typeof props.getPos !== "function") return false

  const pos = props.getPos()
  if (typeof pos !== "number") return false

  const type = blockTypeFromNodeAttrs(props.node.attrs)
  const nextHtml = normalizeBlockAiReplacementHtml(html, type)
  if (!nextHtml) return false

  props.editor.commands.insertContentAt(
    { from: pos, to: pos + props.node.nodeSize },
    wrapHtmlAsBlock(nextHtml, type)
  )
  props.editor.commands.focus()
  return true
}

function getSelectedDukyBlock(editor: Editor) {
  const { selection } = editor.state
  const { $from } = selection

  if (!selection.empty) return null

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    const isDukyBlock = Boolean(node.attrs.dukyBlock || node.attrs.dukyBlockType)

    if (node.type.name === "blockquote" && isDukyBlock) {
      return {
        node,
        depth,
        contentStart: $from.start(depth),
        contentEnd: $from.end(depth),
      }
    }
  }

  return null
}

function stripDukyBlockChromeText(text: string) {
  return text
    .replace(/block\s+(tiêu đề|nội dung|footer liên hệ)/gi, "")
    .replace(/\s+/g, "")
}

function getDukyBlockChildAtSelection(editor: Editor, block: NonNullable<ReturnType<typeof getSelectedDukyBlock>>) {
  const { $from } = editor.state.selection
  const childDepth = block.depth + 1
  const childStart = $from.depth >= childDepth ? $from.before(childDepth) : null
  let childIndex = -1

  for (let index = 0; index < block.node.childCount; index += 1) {
    const child = block.node.child(index)
    if (child === $from.parent || child.eq($from.parent)) {
      childIndex = index
      break
    }
  }

  const foundChildFromParent = childIndex >= 0

  if (childIndex < 0) {
    childIndex = $from.index(block.depth)
  }

  if (!foundChildFromParent && typeof childStart === "number") {
    let offset = 0
    for (let index = 0; index < block.node.childCount; index += 1) {
      if (block.contentStart + offset === childStart) {
        childIndex = index
        break
      }
      offset += block.node.child(index).nodeSize
    }
  }

  const child = block.node.maybeChild(childIndex)

  if (!child) return null

  let childOffset = 0
  for (let index = 0; index < childIndex; index += 1) {
    childOffset += block.node.child(index).nodeSize
  }

  const from = block.contentStart + childOffset

  return {
    child,
    childIndex,
    from,
    to: from + child.nodeSize,
  }
}

function isEmptyEditableBlockChild(editor: Editor, block: NonNullable<ReturnType<typeof getSelectedDukyBlock>>, childIndex: number) {
  const child = block.node.maybeChild(childIndex)
  if (!child?.isTextblock) return false
  if (child.textContent.replace(/\s+/g, "").length > 0) return false

  const firstEditableChildIndex = block.node.childCount > 1 ? 1 : 0
  if (childIndex < firstEditableChildIndex) return false

  const hasAnotherEditableChild = Array.from({ length: block.node.childCount }).some((_, index) => {
    if (index === childIndex || index < firstEditableChildIndex) return false
    return Boolean(block.node.maybeChild(index)?.isTextblock)
  })

  return hasAnotherEditableChild
}

function deleteBlockChildByIndex(editor: Editor, block: NonNullable<ReturnType<typeof getSelectedDukyBlock>>, childIndex: number) {
  let childOffset = 0
  for (let index = 0; index < childIndex; index += 1) {
    childOffset += block.node.child(index).nodeSize
  }

  const child = block.node.maybeChild(childIndex)
  if (!child) return false

  const from = block.contentStart + childOffset
  editor.view.dispatch(editor.state.tr.delete(from, from + child.nodeSize))
  editor.commands.focus()
  return true
}

function shouldBlockDukyBoundaryDelete(editor: Editor, direction: "backward" | "forward") {
  const block = getSelectedDukyBlock(editor)
  if (!block) return false

  const { selection } = editor.state
  const { $from } = selection
  const selectedChild = getDukyBlockChildAtSelection(editor, block)
  if (!selectedChild) return false

  if (direction === "backward") {
    if ($from.parentOffset !== 0) return false

    if (isEmptyEditableBlockChild(editor, block, selectedChild.childIndex)) {
      return deleteBlockChildByIndex(editor, block, selectedChild.childIndex)
    }

    const previousChildIndex = selectedChild.childIndex - 1
    if (isEmptyEditableBlockChild(editor, block, previousChildIndex)) {
      return deleteBlockChildByIndex(editor, block, previousChildIndex)
    }

    const relativeCursor = Math.max(0, selection.from - block.contentStart)
    const visibleTextBeforeCursor = stripDukyBlockChromeText(
      block.node.textBetween(0, relativeCursor, "\n", "\ufffc")
    )

    return visibleTextBeforeCursor.length === 0
  }

  if ($from.parentOffset !== $from.parent.content.size) return false

  if (isEmptyEditableBlockChild(editor, block, selectedChild.childIndex)) {
    return deleteBlockChildByIndex(editor, block, selectedChild.childIndex)
  }

  const nextChildIndex = selectedChild.childIndex + 1
  if (isEmptyEditableBlockChild(editor, block, nextChildIndex)) {
    return deleteBlockChildByIndex(editor, block, nextChildIndex)
  }

  const relativeCursor = Math.max(0, selection.from - block.contentStart)
  const visibleTextAfterCursor = stripDukyBlockChromeText(
    block.node.textBetween(relativeCursor, block.node.content.size, "\n", "\ufffc")
  )

  return visibleTextAfterCursor.length === 0
}

const BLOCK_DRAG_DATA_TYPE = "application/x-duky-block-index"

function isBlockDrag(event: React.DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes(BLOCK_DRAG_DATA_TYPE)
}

function getBlockDragScrollTarget(target: EventTarget | null): HTMLElement | Window {
  if (!(target instanceof Element)) return window

  let current = target instanceof HTMLElement ? target : target.parentElement

  while (current) {
    const style = window.getComputedStyle(current)
    const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY)

    if (canScrollY && current.scrollHeight > current.clientHeight + 2) {
      return current
    }

    current = current.parentElement
  }

  return window
}

function autoScrollDuringBlockDrag(event: React.DragEvent<HTMLElement>) {
  const scrollTarget = getBlockDragScrollTarget(event.target)
  const threshold = 120
  const maxSpeed = 28
  const bounds = scrollTarget instanceof HTMLElement
    ? scrollTarget.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight }
  const distanceToTop = event.clientY - bounds.top
  const distanceToBottom = bounds.bottom - event.clientY
  let delta = 0

  if (distanceToTop < threshold) {
    delta = -Math.ceil((1 - Math.max(distanceToTop, 0) / threshold) * maxSpeed)
  } else if (distanceToBottom < threshold) {
    delta = Math.ceil((1 - Math.max(distanceToBottom, 0) / threshold) * maxSpeed)
  }

  if (!delta) return

  if (scrollTarget instanceof HTMLElement) {
    scrollTarget.scrollBy({ top: delta, behavior: "auto" })
  } else {
    window.scrollBy({ top: delta, behavior: "auto" })
  }
}

function BlogBlockquoteNodeView(props: NodeViewProps) {
  const type = blockTypeFromNodeAttrs(props.node.attrs)
  const info = getTopLevelNodeInfo(props)
  const isFirst = info?.currentIndex === 0
  const isLockedTitleBlock = type === "title" && isFirst
  const isAboveTitleBoundary = info?.currentIndex === 1
  const isLast = info ? info.currentIndex === info.siblings.length - 1 : false
  const isDukyBlock = Boolean(props.node.attrs.dukyBlock || props.node.attrs.dukyBlockType)
  const [insertMenuOpen, setInsertMenuOpen] = React.useState(false)
  const [aiPanelOpen, setAiPanelOpen] = React.useState(false)
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiError, setAiError] = React.useState("")
  const [aiResult, setAiResult] = React.useState<BlogAiBlockAssistResult | null>(null)
  const blockquoteStorage = (props.editor.storage as unknown as Record<string, unknown>)
    .blockquote as BlogBlockquoteStorage | undefined
  const reusableBlocks = blockquoteStorage?.reusableBlocks ?? []
  const currentTitle = blockquoteStorage?.currentTitle?.trim() || "Tiêu đề bài viết"

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    const currentInfo = getTopLevelNodeInfo(props)
    if (!currentInfo) return
    if (isLockedTitleBlock) {
      event.preventDefault()
      return
    }

    event.stopPropagation()
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData(BLOCK_DRAG_DATA_TYPE, String(currentInfo.currentIndex))
    event.dataTransfer.setData("text/plain", String(currentInfo.currentIndex))
  }

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!isBlockDrag(event)) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    autoScrollDuringBlockDrag(event)
  }

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    const rawIndex = event.dataTransfer.getData(BLOCK_DRAG_DATA_TYPE)
    if (!rawIndex) return

    const fromIndex = Number(rawIndex)
    const currentInfo = getTopLevelNodeInfo(props)
    if (!Number.isFinite(fromIndex) || !currentInfo) return

    event.preventDefault()
    event.stopPropagation()
    moveTopLevelNodeByIndex(props.editor, fromIndex, currentInfo.currentIndex)
  }

  const handleSaveReusableBlock = () => {
    const html = serializeBlockNodeContent(props)
    const saveBlock = blockquoteStorage?.onSaveReusableBlock as
      | ((data: SaveReusableBlockRequest) => void)
      | undefined

    if (!html || !saveBlock) return
    saveBlock({ type, html })
  }

  const handleRemoveBlock = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    removeBlockNode(props)
  }

  const handleAskAiForBlock = async () => {
    const instruction = aiPrompt.trim()
    if (!instruction) {
      setAiError("Nhập yêu cầu cho AI trước khi gửi.")
      return
    }

    setAiLoading(true)
    setAiError("")
    setAiResult(null)

    try {
      const aiContext = blockquoteStorage?.getAiContext?.(info?.currentIndex ?? null) ?? {}
      const result = await blogService.assistBlockWithAi({
        instruction,
        blockHtml: serializeBlockNodeContent(props),
        blockType: type,
        articleTitle: currentTitle,
        ...aiContext,
      })
      setAiResult({
        ...result,
        replacementHtml: result.replacementHtml
          ? normalizeBlockAiReplacementHtml(result.replacementHtml, type)
          : null,
      })
    } catch (error) {
      console.error("Failed to run block AI assistant", error)
      setAiError("AI chưa xử lý được block này. Kiểm tra backend/API rồi thử lại.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleApplyAiBlock = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const replacementHtml = aiResult?.replacementHtml?.trim()
    if (!replacementHtml) return

    const currentInfo = getTopLevelNodeInfo(props)
    if (currentInfo && blockquoteStorage?.onReplaceBlock) {
      blockquoteStorage.onReplaceBlock(currentInfo.currentIndex, replacementHtml, type)
    } else {
      replaceBlockNodeContent(props, replacementHtml)
    }
    setAiPanelOpen(false)
  }

  const insertBlockAfterCurrent = (html: string, nextType: "title" | "content" | "footer") => {
    insertHtmlAfterBlockNode(props, wrapHtmlAsBlock(html, nextType))
    setInsertMenuOpen(false)
  }

  const insertReusableBlockAfterCurrent = (blockId: string) => {
    const selected = reusableBlocks.find((item) => item.id === blockId)
    if (!selected) return

    insertHtmlAfterBlockNode(
      props,
      isBlockWrapperHtml(selected.html)
        ? selected.html
        : wrapHtmlAsBlock(selected.html, toEditorBlockType(selected.type))
    )
    setInsertMenuOpen(false)
  }

  if (!isDukyBlock) {
    return (
      <NodeViewWrapper as="blockquote">
        <NodeViewContent />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as="blockquote"
      data-duky-block="true"
      data-duky-block-type={type}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        contentEditable={false}
        className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 "
      >
        <span className="rounded-full bg-orange-500/80 px-3.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
          {props.node.textContent.includes("Mục lục") ? "Block Mục Lục" : blockTypeLabel(type)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            draggable
            disabled={isLockedTitleBlock}
            onMouseDown={(event) => event.stopPropagation()}
            onDragStart={handleDragStart}
            onClick={(event) => event.preventDefault()}
            className="flex size-7 cursor-grab items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 active:cursor-grabbing"
            title="Kéo thả để đổi vị trí block"
            aria-label="Kéo thả để đổi vị trí block"
          >
            <IconGripVertical className="size-4" />
          </button>
          <button
            type="button"
            disabled={isFirst || isAboveTitleBoundary || isLockedTitleBlock}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => moveBlockNode(props, "up")}
            className="flex size-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="Di chuyển block lên"
            aria-label="Di chuyển block lên"
          >
            <IconArrowUp className="size-4" />
          </button>
          <button
            type="button"
            disabled={isLast || isLockedTitleBlock}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => moveBlockNode(props, "down")}
            className="flex size-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="Di chuyển block xuống"
            aria-label="Di chuyển block xuống"
          >
            <IconArrowDown className="size-4" />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleSaveReusableBlock}
            className="flex size-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            title="Lưu block để dùng lại"
            aria-label="Lưu block để dùng lại"
          >
            <IconDeviceFloppy className="size-4" />
          </button>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setAiPanelOpen((current) => !current)
              setAiError("")
            }}
            className={cn(
              "flex size-7 items-center justify-center rounded-full border bg-white transition",
              aiPanelOpen
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-stone-200 text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            )}
            title="Hỏi AI cho block"
            aria-label="Hỏi AI cho block"
            aria-expanded={aiPanelOpen}
          >
            <IconWand className="size-4" />
          </button>
          {!isLockedTitleBlock ? (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={handleRemoveBlock}
              className="flex size-7 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:border-red-300 hover:bg-red-50"
              title="Xóa block"
              aria-label="Xóa block"
            >
              <IconTrash className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      {aiPanelOpen ? (
        <div
          contentEditable={false}
          className="mb-4 rounded-lg border border-orange-200 bg-orange-50/40 p-3 text-sm not-prose"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-semibold text-stone-800">AI cho block</p>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setAiPanelOpen(false)}
              className="flex size-7 items-center justify-center rounded-md text-stone-500 hover:bg-white hover:text-stone-700"
              title="Đóng"
              aria-label="Đóng AI cho block"
            >
              <IconX className="size-4" />
            </button>
          </div>
          <div className="space-y-2">
            <Textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation()
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault()
                  void handleAskAiForBlock()
                }
              }}
              placeholder="Ví dụ: Viết lại ngắn gọn hơn, thêm CTA nhẹ, hoặc tóm tắt nội dung..."
              className="min-h-20 resize-y bg-white text-sm"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={aiLoading || !aiPrompt.trim()}
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void handleAskAiForBlock()
                }}
              >
                {aiLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconWand className="size-4" />}
                {aiLoading ? "Đang hỏi AI" : "Gửi AI"}
              </Button>
            </div>
          </div>
          {aiError ? <p className="mt-3 text-sm text-red-600">{aiError}</p> : null}
          {aiResult ? (
            <div className="mt-3 space-y-3 border-t border-orange-200 pt-3">
              <p className="whitespace-pre-wrap leading-6 text-stone-700">{aiResult.answer}</p>
              {aiResult.replacementHtml ? (
                <>
                  <div
                    className="rounded-md border border-stone-200 bg-white p-3 text-stone-800 [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_p]:my-2"
                    dangerouslySetInnerHTML={{ __html: aiResult.replacementHtml }}
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleApplyAiBlock}>
                      <IconCheck className="size-4" />
                      Áp dụng vào block
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <NodeViewContent className="[&>p:first-child]:hidden" />
      <div contentEditable={false} className="relative mt-4 flex justify-center">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setInsertMenuOpen((current) => !current)}
          className="flex size-9 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-100"
          title="Thêm block ngay sau block này"
          aria-label="Thêm block ngay sau block này"
        >
          <IconPlus className="size-4" />
        </button>

        {insertMenuOpen ? (
          <div className="absolute bottom-11 z-[70] w-72 rounded-2xl border border-stone-200 bg-white p-2 text-sm shadow-xl shadow-stone-900/15">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertBlockAfterCurrent(`<h2>${currentTitle}</h2>`, "content")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>Block Heading</span>
              <IconPlus className="size-4" />
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertBlockAfterCurrent("<p>Nội dung block mới...</p>", "content")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>Block Nội Dung</span>
              <IconPlus className="size-4" />
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                insertBlockAfterCurrent(
                  `<hr /><h3>Thông tin liên hệ</h3><p><strong>Duky Store</strong><br />Hotline: 0900 000 000<br />Email: contact@duky.store<br />Website: https://duky.store</p>`,
                  "footer"
                )
              }
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>Block Footer Liên Hệ</span>
              <IconPlus className="size-4" />
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const html = props.editor.getHTML()
                const toc = generateTableOfContents(html)
                if (toc.length === 0) {
                  insertBlockAfterCurrent("<p><em>Chưa có heading (h2/h3) để tạo mục lục.</em></p>", "content")
                  return
                }
                let counter = 0
                const tocHtml = `<p><strong>📋 Mục lục</strong></p>${toc.map((item) => {
                  if (item.level === 2) {
                    counter++
                    return `<p style="margin:2px 0;padding:4px 8px;background:#f9fafb;border-radius:6px;"><a href="#${item.id}" style="color:#c2410c;text-decoration:none;font-weight:500;">${counter}. ${item.text}</a></p>`
                  }
                  return `<p style="margin:2px 0;padding:4px 8px 4px 24px;"><a href="#${item.id}" style="color:#78716c;text-decoration:none;">• ${item.text}</a></p>`
                }).join("")}`
                insertBlockAfterCurrent(tocHtml, "content")
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>Block Mục Lục</span>
              <IconPlus className="size-4" />
            </button>

            {reusableBlocks.length ? (
              <div className="mt-2 border-t border-stone-200 pt-2">
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Reusable block
                </p>
                <div className="max-h-48 overflow-auto pr-1">
                  {reusableBlocks.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertReusableBlockAfterCurrent(item.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
                    >
                      <span className="min-w-0 truncate">{item.name}</span>
                      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-500">
                        {blockTypeLabel(toEditorBlockType(item.type)).replace("Block ", "")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  )
}

const BlogBlockquote = Blockquote.extend({
  addStorage() {
      return {
        onSaveReusableBlock: null as
          | ((data: SaveReusableBlockRequest) => void)
          | null,
        onRemoveBlock: null as ((index: number) => void) | null,
        onReplaceBlock: null as
          | ((index: number, html: string, type: "title" | "content" | "footer") => void)
          | null,
        getAiContext: null as ((index: number | null) => BlogAiBlockContext) | null,
        reusableBlocks: [] as BlogReusableBlock[],
        currentTitle: "",
      }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      dukyBlock: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-duky-block"),
        renderHTML: (attributes) =>
          attributes.dukyBlock ? { "data-duky-block": attributes.dukyBlock } : {},
      },
      dukyBlockType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-duky-block-type"),
        renderHTML: (attributes) =>
          attributes.dukyBlockType ? { "data-duky-block-type": attributes.dukyBlockType } : {},
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlogBlockquoteNodeView)
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => shouldBlockDukyBoundaryDelete(this.editor, "backward"),
      Delete: () => shouldBlockDukyBoundaryDelete(this.editor, "forward"),
    }
  },
})

function wrapHtmlAsBlock(html: string, type: "title" | "content" | "footer") {
  return `<blockquote data-duky-block="true" data-duky-block-type="${type}">${stripLegacyBlockLabel(html)}</blockquote>`
}

function unwrapBlockHtml(blockHtml: string) {
  const normalized = blockHtml.trim()
  const blockquoteWrapper = normalized.match(
    /^<blockquote\b[^>]*>([\s\S]*)<\/blockquote>\s*$/i
  )
  const raw = blockquoteWrapper ? blockquoteWrapper[1].trim() : normalized
  return stripLegacyBlockLabel(raw)
}

function stripFigcaptionTags(html: string): string {
  let next = html.trim()
  if (!next) return ""
  // Loại bỏ tất cả các thẻ <figcaption>...</figcaption> bao gồm cả nội dung của chúng
  return next.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, "")
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

function cleanDuplicateCaptions(html: string): string {
  let next = html.trim()
  if (!next) return ""

  if (typeof window === "undefined") {
    return next
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${next}</div>`, "text/html")
    const root = doc.body.firstChild as HTMLElement
    if (!root) return next

    const captions = new Set<string>()

    const figures = root.querySelectorAll("figure")
    figures.forEach((fig) => {
      const dataCaption = fig.getAttribute("data-caption")?.trim()
      if (dataCaption) captions.add(dataCaption)

      const figcaption = fig.querySelector("figcaption")?.textContent?.trim()
      if (figcaption) captions.add(figcaption)
    })

    const imgs = root.querySelectorAll("img")
    imgs.forEach((img) => {
      const dataCaption = img.getAttribute("data-caption")?.trim()
      if (dataCaption) captions.add(dataCaption)
    })

    if (captions.size === 0) {
      return next
    }

    const paragraphs = root.querySelectorAll("p")
    paragraphs.forEach((p) => {
      if (p.closest("figure")) return

      const text = p.textContent?.trim() || ""
      if (!text) return

      let isMatch = false
      const normText = removeVietnameseTones(text.toLowerCase())
        .replace(/[^a-z0-9]/g, "")
        .replace(/nbsp/g, "")

      if (!normText) return

      for (const cap of captions) {
        const normCap = removeVietnameseTones(cap.toLowerCase())
          .replace(/[^a-z0-9]/g, "")
          .replace(/nbsp/g, "")

        if (!normCap) continue

        const prefixText = normText.slice(0, 15)
        const prefixCap = normCap.slice(0, 15)

        if (
          normText === normCap ||
          (prefixText.length >= 10 && prefixText === prefixCap) ||
          normText.includes(normCap) ||
          normCap.includes(normText)
        ) {
          isMatch = true
          break
        }
      }

      if (isMatch) {
        p.remove()
      }
    })

    return root.innerHTML.trim()
  } catch (error) {
    console.error("Error cleaning duplicate captions in DOMParser:", error)
    return next
  }
}

function flattenNestedBlockWrappers(html: string): string {
  let next = html.trim()
  if (!next) return ""

  if (typeof window === "undefined") {
    // Môi trường Server-side (SSR), ta trả về chuỗi nguyên bản để tránh lỗi DOMParser không tồn tại
    return next
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${next}</div>`, "text/html")
    const root = doc.body.firstChild as HTMLElement
    if (!root) return next

    let hasNested = true
    let safetyCounter = 0

    while (hasNested && safetyCounter < 100) {
      safetyCounter++
      const nestedChild = root.querySelector("[data-duky-block] [data-duky-block]") as HTMLElement
      if (!nestedChild) {
        hasNested = false
        break
      }

      const parent = nestedChild.parentElement
      if (!parent) {
        hasNested = false
        break
      }

      const parentCloneBefore = parent.cloneNode(false) as HTMLElement
      const parentCloneAfter = parent.cloneNode(false) as HTMLElement
      
      let isBefore = true
      const childNodes = Array.from(parent.childNodes)
      
      for (const node of childNodes) {
        if (node === nestedChild) {
          isBefore = false
          continue
        }
        if (isBefore) {
          parentCloneBefore.appendChild(node.cloneNode(true))
        } else {
          parentCloneAfter.appendChild(node.cloneNode(true))
        }
      }

      const parentNode = parent.parentNode
      if (parentNode) {
        if (parentCloneBefore.innerHTML.trim()) {
          parentNode.insertBefore(parentCloneBefore, parent)
        }
        
        parentNode.insertBefore(nestedChild.cloneNode(true), parent)
        
        if (parentCloneAfter.innerHTML.trim()) {
          parentNode.insertBefore(parentCloneAfter, parent)
        }
        
        parentNode.removeChild(parent)
      }
    }

    let hasNestedAny = true
    let safetyCounterAny = 0
    while (hasNestedAny && safetyCounterAny < 100) {
      safetyCounterAny++
      const nestedChild = root.querySelector("blockquote blockquote") as HTMLElement
      if (!nestedChild) {
        hasNestedAny = false
        break
      }

      const parent = nestedChild.parentElement
      if (!parent) {
        hasNestedAny = false
        break
      }

      const parentNode = parent.parentNode
      if (parentNode) {
        parentNode.insertBefore(nestedChild.cloneNode(true), parent)
        parentNode.removeChild(parent)
      }
    }

    let result = root.innerHTML.trim()
    result = stripLegacyBlockLabel(result.replace(/<p>\s*[↑↓×\s]+\s*<\/p>/gi, ""))
    return result
  } catch (error) {
    console.error("Error flattening blocks in DOMParser:", error)
    return next
  }
}

function isBlockWrapperHtml(html: string) {
  const normalized = html.toLowerCase()
  if (normalized.includes('data-duky-block="true"') || normalized.includes("data-duky-block")) {
    return true
  }
  return (
    normalized.startsWith("<blockquote") &&
    normalized.includes("<p><strong>block ") &&
    normalized.includes("</strong></p>")
  )
}

function isBlockContentEmpty(blockHtml: string) {
  const unwrapped = unwrapBlockHtml(blockHtml)
  // Strip all HTML tags, &nbsp;, whitespace
  const textOnly = unwrapped
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, "")
    .replace(/\s+/g, "")
    .trim()
  return textOnly.length === 0
}

function mergeBlocksToContent(blocks: string[]) {
  return blocks
    .map((block) => flattenNestedBlockWrappers(block))
    .filter(Boolean)
    .filter((block) => !isBlockContentEmpty(block))
    .map((block) =>
      isBlockWrapperHtml(block)
        ? block
        : wrapHtmlAsBlock(block, inferBlockTypeFromHtml(block))
    )
    .join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
}

function stripBlockWrappersForHtml(content?: string | null) {
  const blocks = splitContentToBlocks(content)
  return blocks.map((block) => unwrapBlockHtml(block)).join("\n\n").trim()
}

function mergeHtmlClass(attrs: string, className: string) {
  const classMatch = attrs.match(/\sclass=(["'])(.*?)\1/i)
  if (!classMatch) return `${attrs} class="${className}"`

  const quote = classMatch[1]
  const existing = classMatch[2].split(/\s+/).filter(Boolean)
  const next = [...existing]

  className.split(/\s+/).filter(Boolean).forEach((item) => {
    if (!next.includes(item)) next.push(item)
  })

  return attrs.replace(classMatch[0], ` class=${quote}${next.join(" ")}${quote}`)
}

function mergeHtmlStyle(attrs: string, style: string) {
  const styleMatch = attrs.match(/\sstyle=(["'])(.*?)\1/i)
  if (!styleMatch) return `${attrs} style="${style}"`

  const quote = styleMatch[1]
  const existing = styleMatch[2].trim()
  const existingKeys = new Set(
    existing
      .split(";")
      .map((rule) => rule.split(":")[0]?.trim().toLowerCase())
      .filter(Boolean)
  )
  const additions = style
    .split(";")
    .map((rule) => rule.trim())
    .filter((rule) => {
      const key = rule.split(":")[0]?.trim().toLowerCase()
      return key && !existingKeys.has(key)
    })

  if (!additions.length) return attrs

  const nextStyle = [existing.replace(/;$/, ""), ...additions].filter(Boolean).join("; ")
  return attrs.replace(styleMatch[0], ` style=${quote}${nextStyle}${quote}`)
}

function decorateHtmlTag(
  html: string,
  tagName: string,
  className: string,
  style: string
) {
  return html.replace(
    new RegExp(`<${tagName}(\\s[^>]*)?>`, "gi"),
    (_match, rawAttrs = "") => {
      let attrs = rawAttrs as string
      attrs = mergeHtmlClass(attrs, className)
      attrs = mergeHtmlStyle(attrs, style)
      return `<${tagName}${attrs}>`
    }
  )
}

function decorateBlogHtmlForPublish(html: string) {
  let next = html.trim()
  if (!next) return ""

  next = decorateHtmlTag(
    next,
    "h1",
    "duky-blog-heading duky-blog-h1",
    "margin: 8px 0 22px; font-size: 38px; line-height: 1.12; font-weight: 800; letter-spacing: 0; color: #1c1917;"
  )
  next = decorateHtmlTag(
    next,
    "h2",
    "duky-blog-heading duky-blog-h2",
    "margin: 32px 0 16px; font-size: 30px; line-height: 1.18; font-weight: 800; letter-spacing: 0; color: #1c1917;"
  )
  next = decorateHtmlTag(
    next,
    "h3",
    "duky-blog-heading duky-blog-h3",
    "margin: 28px 0 12px; font-size: 23px; line-height: 1.25; font-weight: 700; letter-spacing: 0; color: #292524;"
  )
  next = decorateHtmlTag(
    next,
    "p",
    "duky-blog-paragraph",
    "margin: 16px 0; font-size: 16px; line-height: 1.85; color: #292524;"
  )
  next = decorateHtmlTag(
    next,
    "ul",
    "duky-blog-list duky-blog-list-disc",
    "margin: 16px 0; padding-left: 28px; list-style-type: disc;"
  )
  next = decorateHtmlTag(
    next,
    "ol",
    "duky-blog-list duky-blog-list-decimal",
    "margin: 16px 0; padding-left: 28px; list-style-type: decimal;"
  )
  next = decorateHtmlTag(
    next,
    "li",
    "duky-blog-list-item",
    "margin: 6px 0; padding-left: 4px; line-height: 1.75;"
  )
  next = decorateHtmlTag(
    next,
    "a",
    "duky-blog-link",
    "color: #c2410c; text-decoration: underline; text-underline-offset: 4px;"
  )
  next = decorateHtmlTag(
    next,
    "img",
    "duky-blog-image",
    "display: block; max-width: 100%; height: auto; margin: 28px auto; border-radius: 24px;"
  )
  next = decorateHtmlTag(
    next,
    "figure",
    "duky-blog-image-figure",
    "display: block; max-width: 100%; text-align: center;"
  )
  next = decorateHtmlTag(
    next,
    "figcaption",
    "duky-blog-image-caption",
    "margin-top: 10px; text-align: center; font-size: 14px; line-height: 1.6; color: #6b7280; font-style: italic;"
  )
  next = decorateHtmlTag(
    next,
    "blockquote",
    "duky-blog-quote",
    "margin: 24px 0; padding: 16px 20px; border-left: 4px solid #fdba74; border-radius: 16px; background: #fff7ed; color: #292524;"
  )
  next = decorateHtmlTag(
    next,
    "table",
    "duky-blog-table",
    "width: 100%; margin: 24px 0; border-collapse: collapse;"
  )
  next = decorateHtmlTag(
    next,
    "th",
    "duky-blog-table-head",
    "border: 1px solid #e7e5e4; background: #f5f5f4; padding: 8px 12px; text-align: left; font-weight: 700;"
  )
  next = decorateHtmlTag(
    next,
    "td",
    "duky-blog-table-cell",
    "border: 1px solid #e7e5e4; padding: 8px 12px;"
  )
  next = decorateHtmlTag(
    next,
    "code",
    "duky-blog-code",
    "border-radius: 6px; background: #fff7ed; padding: 2px 6px; font-weight: 600; color: #ea580c;"
  )
  next = decorateHtmlTag(
    next,
    "pre",
    "duky-blog-pre",
    "margin: 20px 0; overflow: auto; border-radius: 16px; background: #1c1917; padding: 16px; color: #fed7aa;"
  )
  next = decorateHtmlTag(
    next,
    "hr",
    "duky-blog-divider",
    "margin: 32px 0; border: 0; border-top: 1px solid #e7e5e4;"
  )

  return next
}

function injectFigcaptions(html: string): string {
  let next = html.trim()
  if (!next) return ""

  if (typeof window === "undefined") {
    return next.replace(/<figure\b([^>]*data-caption=(["'])(.*?)\2[^>]*)>([\s\S]*?)<\/figure>/gi, (match, attrs, quote, caption, inner) => {
      const trimmedCaption = caption.trim()
      if (trimmedCaption && !inner.includes("<figcaption")) {
        const escapedCaption = trimmedCaption.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        const figHtml = `<figcaption class="duky-blog-image-caption" style="margin-top:10px;text-align:center;font-size:14px;line-height:1.6;color:#6b7280;font-style:italic;">${escapedCaption}</figcaption>`
        return `<figure${attrs}>${inner}${figHtml}</figure>`
      }
      return match
    })
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${next}</div>`, "text/html")
    const root = doc.body.firstChild as HTMLElement
    if (!root) return next

    const figures = root.querySelectorAll("figure")
    figures.forEach((fig) => {
      const caption = fig.getAttribute("data-caption")?.trim()
      if (!caption) return
      
      let figcaption = fig.querySelector("figcaption")
      if (!figcaption) {
        figcaption = doc.createElement("figcaption")
        figcaption.className = "duky-blog-image-caption"
        figcaption.setAttribute("style", "margin-top:10px;text-align:center;font-size:14px;line-height:1.6;color:#6b7280;font-style:italic;")
        fig.appendChild(figcaption)
      }
      figcaption.textContent = caption
    })

    return root.innerHTML.trim()
  } catch (error) {
    console.error("Error injecting figcaptions:", error)
    return next
  }
}

function toPublishableBlogHtml(content?: string | null) {
  const cleanHtml = stripFigcaptionTags(content ?? "")
  const publishedHtml = injectFigcaptions(stripBlockWrappersForHtml(cleanHtml))
  return cleanDuplicateCaptions(decorateBlogHtmlForPublish(publishedHtml))
}

function toHtmlDraftFromContent(content?: string | null) {
  const cleanedContent = stripFigcaptionTags(content ?? "")
  const blocks = splitContentToBlocks(cleanedContent)
  if (blocks.length <= 1) {
    const singleHtml = blocks.length === 1 ? unwrapBlockHtml(blocks[0]) : ""
    return prettyHtmlForEditor(cleanDuplicateCaptions(singleHtml))
  }
  const formattedBlocks = blocks.map((block) => {
    const unwrapped = unwrapBlockHtml(block)
    return prettyHtmlForEditor(cleanDuplicateCaptions(unwrapped))
  })
  return formattedBlocks.filter(Boolean).join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
}

function toContentFromHtmlDraft(htmlDraft: string) {
  const cleaned = stripFigcaptionTags(cleanDuplicateCaptions(htmlDraft))
  const rawBlocks = cleaned
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean)
  return mergeBlocksToContent(rawBlocks)
}

function prettyHtmlForEditor(html: string) {
  const minified = minifyHtmlForEditorDraft(html)
  if (!minified) return ""

  const withBreaks = minified
    .replace(/></g, ">\n<")
    .replace(/<(\/?(?:p|div|section|article|header|footer|h1|h2|h3|h4|h5|h6|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre))/g, "\n<$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return withBreaks
}

function cleanSeo(seo: CreateBlogPostPayload["seo"]) {
  if (!seo) return undefined

  const cleaned = {
    metaTitle: emptyToNull(seo.metaTitle),
    metaDescription: emptyToNull(seo.metaDescription),
    canonicalUrl: emptyToNull(seo.canonicalUrl),
    ogTitle: emptyToNull(seo.ogTitle),
    ogDescription: emptyToNull(seo.ogDescription),
    ogImageMediaId: emptyToNull(seo.ogImageMediaId),
    twitterTitle: emptyToNull(seo.twitterTitle),
    twitterDescription: emptyToNull(seo.twitterDescription),
    focusKeyword: emptyToNull(seo.focusKeyword),
    seoScore: seo.seoScore ?? null,
    analysisJson: seo.analysisJson ?? null,
    noIndex: seo.noIndex ?? false,
    noFollow: seo.noFollow ?? false,
  }

  const hasValue = Object.values(cleaned).some((value) =>
    typeof value === "boolean" ? value : Boolean(value)
  )

  return hasValue ? cleaned : undefined
}

/**
 * Inject `id` attributes into h2/h3 tags that don't already have one.
 * This ensures anchor links from the TOC block work correctly.
 */
function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, content) => {
    // Skip if already has an id attribute
    if (/\bid\s*=/i.test(attrs)) return match
    const text = content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()
    if (!text) return match
    const id = generateHeadingId(text)
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}

function normalizePayload(
  data: CreateBlogPostPayload,
  seoExtras?: Partial<NonNullable<CreateBlogPostPayload["seo"]>>
): CreateBlogPostPayload {
  const generatedSlug = slugify(data.slug || data.title)
  const contentWithTitleBlock = ensureTitleBlockContent(data.content, data.title)
  const contentWithHeadingIds = injectHeadingIds(contentWithTitleBlock.trim())
  // Strip empty blocks before saving
  const contentBlocks = contentWithHeadingIds
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((b) => b.trim())
    .filter(Boolean)
    .filter((b) => !isBlockContentEmpty(b))
  const cleanedContent = contentBlocks.join(` ${CONTENT_BLOCK_SEPARATOR} `)
  const seo = {
    ...(data.seo ?? {}),
    ...(seoExtras ?? {}),
  }

  return {
    title: data.title.trim(),
    slug: generatedSlug || emptyToNull(data.slug),
    excerpt: emptyToNull(data.excerpt),
    content: minifyHtmlForStorage(cleanedContent),
    coverMediaId: emptyToNull(data.coverMediaId),
    status: data.status ?? ContentStatus.DRAFT,
    categoryIds: data.categoryIds ?? [],
    tagIds: data.tagIds ?? [],
    seo: cleanSeo(seo),
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa có"

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function statusBadgeClassName(status?: string) {
  if (status === ContentStatus.PUBLISHED) {
    return "border-orange-300 bg-orange-50 text-orange-700"
  }
  if (status === ContentStatus.HIDDEN) {
    return "border-yellow-300 bg-yellow-50 text-yellow-700"
  }
  if (status === ContentStatus.ARCHIVED) {
    return "border-stone-300 bg-stone-100 text-stone-700"
  }
  return "border-orange-200 bg-orange-50 text-orange-700"
}

function feedbackToastClassName(tone?: Feedback["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-900/10"
  }
  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-700 shadow-red-900/10"
  }
  return "border-orange-200 bg-orange-50 text-orange-800 shadow-orange-900/10"
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

function Panel({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-stone-200 bg-white overflow-hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-t-2xl border-b border-stone-100 bg-white px-4 py-3 text-sm font-semibold text-stone-950 group-open:rounded-b-none">
        <span className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="flex size-7 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              {icon}
            </span>
          ) : null}
          <span className="truncate">{title}</span>
        </span>
        <IconChevronDown className="size-4 text-stone-400 transition group-open:rotate-180" />
      </summary>
      <div className="p-4">{children}</div>
    </details>
  )
}

function MetaBox({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-950">{title}</h2>
        <IconChevronDown className="size-4 text-stone-400" />
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function EditorButton({
  active,
  disabled,
  children,
  label,
  onClick,
}: {
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-9 items-center justify-center rounded-xl text-stone-600 transition hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-500",
        active && "bg-orange-100 text-orange-700"
      )}
    >
      {children}
    </button>
  )
}

function EditorDivider() {
  return <span className="mx-1 h-6 w-px bg-stone-200" />
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/
const SHORT_HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{3}$/

function normalizeHexColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback

  if (HEX_COLOR_PATTERN.test(value)) return value
  if (SHORT_HEX_COLOR_PATTERN.test(value)) {
    const [, red, green, blue] = value
    return `#${red}${red}${green}${green}${blue}${blue}`
  }

  return fallback
}

function ToolbarDropdown({
  children,
  icon,
  label,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  label: string
}) {
  const [open, setOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-stone-600 transition hover:bg-orange-50 hover:text-orange-700",
          open && "bg-orange-100 text-orange-700"
        )}
      >
        {icon}
        <IconChevronDown className="size-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-[80] mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3 shadow-xl shadow-stone-900/10">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function ColorToolbarControl({
  fallback,
  icon,
  label,
  onChange,
  swatches,
  value,
}: {
  fallback: string
  icon: React.ReactNode
  label: string
  onChange: (value: string) => void
  swatches: string[]
  value: string
}) {
  const [open, setOpen] = React.useState(false)
  const controlRef = React.useRef<HTMLDivElement | null>(null)
  const activeColor = normalizeHexColor(value, fallback)

  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!controlRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const cycleColor = () => {
    const currentIndex = swatches.findIndex(
      (color) => color.toLowerCase() === activeColor.toLowerCase()
    )
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % swatches.length : 0
    onChange(swatches[nextIndex])
  }

  return (
    <div ref={controlRef} className="relative">
      <div className="flex h-9 items-center rounded-full border border-orange-200 bg-orange-50/60 px-1">
        <button
          type="button"
          aria-label={`${label} nÒ¢ng cao`}
          title={`${label} nÒ¢ng cao`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-orange-700 transition hover:bg-orange-100",
            open && "bg-orange-100"
          )}
        >
          {icon}
        </button>
        <button
          type="button"
          aria-label={`Đổi nhanh ${label}`}
          title={`Đổi nhanh ${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={cycleColor}
          className="mx-1 size-6 rounded-full border border-white shadow-sm ring-1 ring-stone-200 transition hover:scale-105"
          style={{ backgroundColor: activeColor }}
        />
        <button
          type="button"
          aria-label={`Mở bảng ${label}`}
          title={`Mở bảng ${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-orange-600 transition hover:bg-orange-100",
            open && "bg-orange-100"
          )}
        >
          <IconChevronDown className="size-3.5" />
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl shadow-stone-900/10">
          <ColorPickerPanel
            label={label}
            value={activeColor}
            fallback={fallback}
            swatches={swatches}
            onChange={onChange}
          />
        </div>
      ) : null}
    </div>
  )
}

function ColorPickerPanel({
  fallback,
  label,
  onChange,
  swatches,
  value,
}: {
  fallback: string
  label: string
  onChange: (value: string) => void
  swatches: string[]
  value: string
}) {
  const [draftColor, setDraftColor] = React.useState(() => normalizeHexColor(value, fallback))

  React.useEffect(() => {
    setDraftColor(normalizeHexColor(value, fallback))
  }, [fallback, value])

  const appliedColor = normalizeHexColor(draftColor, fallback)

  const applyColor = (nextColor: string) => {
    const normalizedColor = normalizeHexColor(nextColor, appliedColor)
    setDraftColor(normalizedColor)
    onChange(normalizedColor)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-stone-500">{label}</span>
        <span className="rounded-full border border-stone-200 px-2 py-1 font-mono text-[11px] uppercase text-stone-500">
          {appliedColor}
        </span>
      </div>
      <input
        type="color"
        value={appliedColor}
        onChange={(event) => applyColor(event.target.value)}
        className="h-28 w-full cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
      />
      <Input
        value={draftColor}
        onChange={(event) => {
          const nextColor = event.target.value.trim()
          setDraftColor(nextColor)
          if (HEX_COLOR_PATTERN.test(nextColor)) onChange(nextColor)
        }}
        className="h-9 font-mono text-xs uppercase"
      />
      <div className="grid grid-cols-5 gap-1.5">
        {swatches.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyColor(color)}
            className={cn(
              "size-6 rounded-full border border-white shadow-sm ring-1 ring-stone-200 transition hover:scale-105",
              appliedColor.toLowerCase() === color.toLowerCase() && "ring-2 ring-orange-400 ring-offset-2"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

function getActiveTableCellStyle(editor: Editor | null) {
  if (!editor) return ""
  const headerStyle = editor.getAttributes("tableHeader").cellStyle
  const cellStyle = editor.getAttributes("tableCell").cellStyle
  return typeof headerStyle === "string" ? headerStyle : typeof cellStyle === "string" ? cellStyle : ""
}

function setActiveTableCellStyle(
  editor: Editor | null,
  declarations: Record<string, string | null | undefined>,
  options?: { colWidth?: number | null }
) {
  if (!editor?.isActive("table")) return
  const currentStyle = getActiveTableCellStyle(editor)
  const nextStyle = writeCssDeclarations(currentStyle, declarations)
  let chain = editor.chain().focus().setCellAttribute("cellStyle", nextStyle)

  if (options && "colWidth" in options) {
    chain = chain.setCellAttribute("colwidth", options.colWidth ? [options.colWidth] : null)
  }

  chain.run()
}

function setActiveTableWidth(editor: Editor | null, widthPercent: number) {
  if (!editor?.isActive("table")) return
  const width = `${Math.min(100, Math.max(35, widthPercent))}%`
  const currentStyle =
    typeof editor.getAttributes("table").tableStyle === "string"
      ? editor.getAttributes("table").tableStyle
      : DEFAULT_BLOG_TABLE_STYLE
  const nextStyle = writeCssDeclarations(currentStyle, {
    width,
    "min-width": width,
    "table-layout": "fixed",
  })

  editor.chain().focus().updateAttributes("table", { tableStyle: nextStyle }).run()
}

function TableDropdown({ editor }: { editor: Editor | null }) {
  const isInTable = Boolean(editor?.isActive("table"))
  const activeCellStyle = getActiveTableCellStyle(editor)
  const activeCellBackground = readCssDeclaration(activeCellStyle, "background-color")
  const activeCellTextColor = readCssDeclaration(activeCellStyle, "color")
  const activeCellWidth = Number.parseInt(readCssDeclaration(activeCellStyle, "width"), 10) || 160
  const activeTableStyle =
    typeof editor?.getAttributes("table").tableStyle === "string"
      ? editor.getAttributes("table").tableStyle
      : DEFAULT_BLOG_TABLE_STYLE
  const activeTableWidth = Number.parseInt(readCssDeclaration(activeTableStyle, "width"), 10) || 100
  const tableActionClass =
    "flex h-9 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-stone-700 transition hover:bg-orange-50 hover:text-orange-700 disabled:pointer-events-none disabled:opacity-40"

  return (
    <ToolbarDropdown label="Bảng" icon={<IconTable className="size-4" />}>
      <div className="grid gap-1">
        <button
          type="button"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={tableActionClass}
        >
          <IconTable className="size-4" />
          <span>ChҨn bảng 3x3</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().addRowAfter().run()}
          className={tableActionClass}
        >
          <IconTableRow className="size-4" />
          <span>ThÒªm hÒ ng d� °á»⬺i</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().addColumnAfter().run()}
          className={tableActionClass}
        >
          <IconTableColumn className="size-4" />
          <span>Thêm cột bên phải</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().deleteRow().run()}
          className={tableActionClass}
        >
          <IconTableRow className="size-4" />
          <span>XÒ³a hÒ ng hiá»⬡n tại</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().deleteColumn().run()}
          className={tableActionClass}
        >
          <IconTableColumn className="size-4" />
          <span>Xóa cột hiện tại</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().deleteTable().run()}
          className={tableActionClass}
        >
          <IconTrash className="size-4" />
          <span>Xҳa bảng</span>
        </button>
        <div className="mt-2 border-t border-stone-200 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase text-stone-500">Kích thước</p>
          <label className="grid gap-1.5 rounded-xl bg-stone-50 p-2 text-xs text-stone-600">
            <span className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <IconResize className="size-3.5" />
                Rộng bảng
              </span>
              <span className="font-mono">{activeTableWidth}%</span>
            </span>
            <input
              type="range"
              min={35}
              max={100}
              step={5}
              disabled={!isInTable}
              value={activeTableWidth}
              onChange={(event) => setActiveTableWidth(editor, Number(event.target.value))}
              className="h-2 w-full accent-orange-600 disabled:opacity-40"
            />
          </label>
          <label className="mt-2 grid gap-1.5 rounded-xl bg-stone-50 p-2 text-xs text-stone-600">
            <span className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <IconTableColumn className="size-3.5" />
                Rộng cột/ô
              </span>
              <span className="font-mono">{activeCellWidth}px</span>
            </span>
            <input
              type="range"
              min={80}
              max={640}
              step={10}
              disabled={!isInTable}
              value={activeCellWidth}
              onChange={(event) => {
                const width = Number(event.target.value)
                setActiveTableCellStyle(
                  editor,
                  {
                    width: `${width}px`,
                    "min-width": `${width}px`,
                  },
                  { colWidth: width }
                )
              }}
              className="h-2 w-full accent-orange-600 disabled:opacity-40"
            />
          </label>
        </div>

        <div className="mt-3 border-t border-stone-200 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase text-stone-500">Màu ô</p>
          <div className="grid grid-cols-8 gap-1.5">
            {tableCellBackgroundSwatches.map((color) => (
              <button
                key={color}
                type="button"
                disabled={!isInTable}
                title={`Nền ${color}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setActiveTableCellStyle(editor, { "background-color": color })}
                className={cn(
                  "size-7 rounded-full border border-white shadow-sm ring-1 ring-stone-200 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40",
                  activeCellBackground.toLowerCase() === color.toLowerCase() &&
                    "ring-2 ring-orange-400 ring-offset-2"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {colorSwatches.slice(0, 8).map((color) => (
              <button
                key={color}
                type="button"
                disabled={!isInTable}
                title={`Chữ ${color}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setActiveTableCellStyle(editor, { color })}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border border-white bg-white text-[10px] font-bold shadow-sm ring-1 ring-stone-200 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40",
                  activeCellTextColor.toLowerCase() === color.toLowerCase() &&
                    "ring-2 ring-orange-400 ring-offset-2"
                )}
                style={{ color }}
              >
                A
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!isInTable}
            onClick={() =>
              setActiveTableCellStyle(
                editor,
                {
                  "background-color": null,
                  color: null,
                  width: null,
                  "min-width": null,
                },
                { colWidth: null }
              )
            }
            className={tableActionClass}
          >
            <IconPaint className="size-4" />
            <span>Reset style ô</span>
          </button>
        </div>
      </div>
    </ToolbarDropdown>
  )
}

function setLink(editor: Editor | null) {
  if (!editor) return

  const previousUrl = editor.getAttributes("link").href as string | undefined
  const url = window.prompt("Nhập URL liҪn kết", previousUrl ?? "")

  if (url === null) return
  if (!url.trim()) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    return
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
}

function isLikelyLegacyImageCaption(node: any) {
  const text = node?.textContent?.trim()
  if (!text || !node?.isTextblock) return false
  if (node.attrs?.textAlign === "center") return true

  let hasText = false
  let allTextIsItalic = true
  node.descendants?.((child: any) => {
    if (!child.isText || !child.text?.trim()) return
    hasText = true
    allTextIsItalic = allTextIsItalic && child.marks?.some((mark: any) => mark.type?.name === "italic")
  })

  return hasText && allTextIsItalic
}

function getAdjacentCaptionParagraph(editor: Editor | null, captionValue?: string) {
  if (!editor) return
  const caption =
    captionValue?.trim() ||
    ((editor.getAttributes("image").caption as string | undefined) ?? "").trim()
  const position = Math.min(editor.state.selection.to, editor.state.doc.content.size)
  const nodeAfter = editor.state.doc.resolve(position).nodeAfter
  const text = nodeAfter?.textContent?.trim() ?? ""

  if (
    nodeAfter?.isTextblock &&
    text &&
    ((caption && text === caption) || (!caption && isLikelyLegacyImageCaption(nodeAfter)))
  ) {
    return { position, node: nodeAfter, text }
  }
}

function getActiveImageCaption(editor: Editor | null) {
  if (!editor?.isActive("image")) return ""
  const caption = ((editor.getAttributes("image").caption as string | undefined) ?? "").trim()
  if (caption) return caption
  return getAdjacentCaptionParagraph(editor)?.text ?? ""
}

function removeAdjacentCaptionParagraph(editor: Editor | null, captionValue?: string) {
  const captionParagraph = getAdjacentCaptionParagraph(editor, captionValue)
  if (editor && captionParagraph) {
    editor.view.dispatch(
      editor.state.tr.delete(
        captionParagraph.position,
        captionParagraph.position + captionParagraph.node.nodeSize
      )
    )
    editor.commands.focus()
  }
}

function deleteActiveImageWithCaption(editor: Editor | null) {
  if (!editor?.isActive("image")) return
  const caption = getActiveImageCaption(editor)
  const imagePosition = Math.min(editor.state.selection.from, editor.state.doc.content.size)

  editor.chain().focus().deleteSelection().run()

  if (!caption) return

  const position = Math.min(imagePosition, editor.state.doc.content.size)
  const nodeAfter = editor.state.doc.resolve(position).nodeAfter

  if (nodeAfter?.isTextblock && nodeAfter.textContent.trim() === caption) {
    editor.view.dispatch(editor.state.tr.delete(position, position + nodeAfter.nodeSize))
    editor.commands.focus()
  }
}

function insertHtmlAtSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after = ""
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end)
  const nextValue = `${textarea.value.slice(0, start)}${before}${selected}${after}${textarea.value.slice(end)}`
  const nextCursor = start + before.length + selected.length + after.length

  textarea.value = nextValue
  textarea.setSelectionRange(nextCursor, nextCursor)
  textarea.focus()

  return nextValue
}

function BlogRichTextEditor({
  value,
  onChange,
  blockControls,
}: {
  value?: string | null
  onChange: (value: string) => void
  blockControls?: {
    addPostTitleBlock: () => void
    addContentBlock: () => void
    addContactFooterBlock: () => void
    addTocBlock: () => void
    moveBlock: (fromIndex: number, toIndex: number) => void
    removeBlock: (index: number) => void
    replaceBlock: (index: number, html: string, type: "title" | "content" | "footer") => void
    getAiContext: (index: number | null) => BlogAiBlockContext
    reusableBlocks: BlogReusableBlock[]
    currentTitle: string
    onSelectReusableBlock: (blockId: string) => void
    onSaveReusableBlock: (data: SaveReusableBlockRequest) => void
  }
}) {
  const [editorMode, setEditorMode] = React.useState<"visual" | "html">("visual")
  const [htmlDraft, setHtmlDraft] = React.useState(toHtmlDraftFromContent(value ?? ""))
  const [isHtmlDraftDirty, setIsHtmlDraftDirty] = React.useState(false)
  const htmlTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const isSelfUpdatingRef = React.useRef(false)
  const selfUpdateTimeoutRef = React.useRef<any | null>(null)
  const lastSelectionRef = React.useRef<{ from: number; to: number } | null>(null)
  const [isImageLibraryOpen, setIsImageLibraryOpen] = React.useState(false)
  const [imageActionMode, setImageActionMode] = React.useState<"insert" | "replace">("insert")
  const [imagePickerInitialUrl, setImagePickerInitialUrl] = React.useState<string | null>(null)
  const [imagePickerInitialDraft, setImagePickerInitialDraft] = React.useState<{
    altText?: string
    title?: string
    caption?: string
    description?: string
  } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      BlogBlockquote,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      BlogImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-2xl",
        },
      }),
      BlogTable.configure({
        resizable: true,
        HTMLAttributes: {
          class: "w-full min-w-full table-fixed border-collapse overflow-hidden rounded-xl",
          style: DEFAULT_BLOG_TABLE_STYLE,
        },
      }),
      TableRow,
      BlogTableHeader.configure({
        HTMLAttributes: {
          class: "min-w-0 border border-stone-200 bg-stone-100 px-3 py-2 text-left align-top",
        },
      }),
      BlogTableCell.configure({
        HTMLAttributes: {
          class: "min-w-0 border border-stone-200 px-3 py-2 align-top",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose space-y-2",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
      Subscript,
      Superscript,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
        HTMLAttributes: {
          class: "text-orange-700 underline underline-offset-4",
        },
      }),
      Placeholder.configure({
        placeholder: "Bắt ���ầu viết n���i dung bҠi viết...",
      }),
    ],
    content: stripFigcaptionTags(value ?? ""),
    editorProps: {
      attributes: {
        class:
          "min-h-[680px] px-7 py-6 text-[15px] leading-7 text-stone-800 outline-none prose prose-stone max-w-none prose-headings:scroll-mt-24 prose-a:text-orange-700 prose-img:rounded-2xl [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[34px] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[28px] [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:leading-snug [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1 [&_code]:font-semibold [&_code]:text-orange-500 [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:text-inherit [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-semibold [&_pre_code]:text-orange-500 [&_blockquote]:my-3 [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-stone-300 [&_blockquote]:bg-white [&_blockquote]:px-4 [&_blockquote]:pb-3 [&_blockquote]:pt-2 [&_blockquote]:shadow-sm [&_blockquote]:not-italic [&_blockquote]:text-inherit [&_blockquote]:border-l [&_blockquote]:border-l-stone-300 [&_blockquote:hover]:border-orange-300 [&_blockquote:focus-within]:border-orange-400 [&_blockquote:focus-within]:ring-2 [&_blockquote:focus-within]:ring-orange-100 [&_blockquote>p:first-child]:mb-2 [&_blockquote>p:first-child]:inline-flex [&_blockquote>p:first-child]:rounded-full [&_blockquote>p:first-child]:bg-stone-100 [&_blockquote>p:first-child]:px-2.5 [&_blockquote>p:first-child]:py-1 [&_blockquote>p:first-child]:text-[11px] [&_blockquote>p:first-child]:font-semibold [&_blockquote>p:first-child]:uppercase [&_blockquote>p:first-child]:tracking-wide [&_blockquote>p:first-child]:text-stone-500 [&_blockquote>p:first-child_strong]:font-semibold",
      },
    },
    onUpdate({ editor: currentEditor }) {
      const nextHtml = currentEditor.getHTML()
      isSelfUpdatingRef.current = true
      
      if (selfUpdateTimeoutRef.current) {
        clearTimeout(selfUpdateTimeoutRef.current)
      }
      
      selfUpdateTimeoutRef.current = setTimeout(() => {
        isSelfUpdatingRef.current = false
      }, 150)

      onChange(nextHtml)
    },
    onSelectionUpdate({ editor: currentEditor }) {
      if (currentEditor.isFocused) {
        lastSelectionRef.current = {
          from: currentEditor.state.selection.from,
          to: currentEditor.state.selection.to,
        }
      }
    },
  })

  React.useEffect(() => {
    return () => {
      if (selfUpdateTimeoutRef.current) {
        clearTimeout(selfUpdateTimeoutRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!editor) return
    const storage = editor.storage as unknown as Record<string, BlogBlockquoteStorage>
    if (!storage.blockquote) return

    storage.blockquote.onSaveReusableBlock = blockControls?.onSaveReusableBlock ?? null
    storage.blockquote.onRemoveBlock = blockControls?.removeBlock ?? null
    storage.blockquote.onReplaceBlock = blockControls?.replaceBlock ?? null
    storage.blockquote.getAiContext = blockControls?.getAiContext ?? null
    storage.blockquote.reusableBlocks = blockControls?.reusableBlocks ?? []
    storage.blockquote.currentTitle = blockControls?.currentTitle ?? ""
  }, [
    blockControls?.currentTitle,
    blockControls?.onSaveReusableBlock,
    blockControls?.removeBlock,
    blockControls?.replaceBlock,
    blockControls?.getAiContext,
    blockControls?.reusableBlocks,
    editor,
  ])

  const applyImageToEditor = React.useCallback(
    (image: {
      url: string
      mediaId?: string
      altText?: string | null
      title?: string | null
      caption?: string | null
      description?: string | null
    }, options?: { replaceCurrent?: boolean }) => {
      if (!editor || !image.url.trim()) return

      // Khôi phục lại vị trí con trỏ đã lưu trước khi Dialog chọn ảnh làm mất focus
      if (lastSelectionRef.current) {
        editor.commands.setTextSelection(lastSelectionRef.current)
      }

      const shouldReplace = options?.replaceCurrent && editor.isActive("image")
      if (shouldReplace) {
        const oldCaption = getActiveImageCaption(editor)
        const nextCaption = (image.caption ?? image.description ?? image.altText ?? "").trim()
        editor
          .chain()
          .focus()
          .updateAttributes("image", {
            src: image.url.trim(),
            alt: image.altText ?? undefined,
            title: image.title ?? undefined,
            caption: nextCaption,
          })
          .run()
        removeAdjacentCaptionParagraph(editor, oldCaption)
        removeAdjacentCaptionParagraph(editor, nextCaption)
      } else {
        const note = (image.caption ?? image.description ?? image.altText ?? "").trim()
        editor
          .chain()
          .focus()
          .insertContent([
            { type: "paragraph" },
            {
              type: "image",
              attrs: {
                src: image.url.trim(),
                alt: image.altText ?? undefined,
                title: image.title ?? undefined,
                caption: note,
              },
            },
            { type: "paragraph" },
          ])
          .run()
      }

    },
    [editor]
  )

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return

    // Nếu thay đổi xuất phát từ chính editor (trong vòng 150ms), ta bỏ qua hoàn toàn việc setContent
    if (isSelfUpdatingRef.current) {
      return
    }

    const currentHtml = stripFigcaptionTags(editor.getHTML())
    const nextHtml = stripFigcaptionTags(value ?? "")

    if (currentHtml !== nextHtml) {
      queueMicrotask(() => {
        if (!editor.isDestroyed && !isSelfUpdatingRef.current) {
          editor.commands.setContent(stripFigcaptionTags(value ?? ""), { emitUpdate: false })
        }
      })
    }
    setHtmlDraft(toHtmlDraftFromContent(value ?? ""))
    setIsHtmlDraftDirty(false)
  }, [editor, value])

  const applyHtmlToVisualEditor = React.useCallback(() => {
    if (!editor || !isHtmlDraftDirty) return
    const nextContent = stripFigcaptionTags(toContentFromHtmlDraft(htmlDraft))
    editor.commands.setContent(nextContent)
    onChange(nextContent)
    setHtmlDraft(toHtmlDraftFromContent(nextContent))
    setIsHtmlDraftDirty(false)
  }, [editor, htmlDraft, isHtmlDraftDirty, onChange])

  const formatHtmlDraft = React.useCallback(() => {
    const pretty = htmlDraft
      .split(CONTENT_BLOCK_SEPARATOR)
      .map((block) => prettyHtmlForEditor(block.trim()))
      .filter(Boolean)
      .join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
    setHtmlDraft(pretty)
    setIsHtmlDraftDirty(true)
  }, [htmlDraft])

  const insertHtmlSnippet = React.useCallback(
    (before: string, after = "") => {
      const textarea = htmlTextareaRef.current
      if (!textarea) return
      const nextValue = insertHtmlAtSelection(textarea, before, after)
      setHtmlDraft(nextValue)
      setIsHtmlDraftDirty(true)
    },
    []
  )

  const toolbarState =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) => {
        if (!currentEditor) {
          return {
            headingValue: "paragraph" as const,
            fontFamily: "",
            fontSize: "",
            textColor: undefined as string | undefined,
            highlightColor: undefined as string | undefined,
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            subscript: false,
            superscript: false,
            code: false,
            codeBlock: false,
            bulletList: false,
            orderedList: false,
            taskList: false,
            blockquote: false,
            alignLeft: false,
            alignCenter: false,
            alignRight: false,
            alignJustify: false,
            link: false,
            heading3: false,
            imageActive: false,
            imageWidth: "75%",
            imageAlign: "center" as "left" | "center" | "right",
          }
        }

        return {
          headingValue: currentEditor.isActive("heading", { level: 1 })
            ? "h1"
            : currentEditor.isActive("heading", { level: 2 })
              ? "h2"
              : currentEditor.isActive("heading", { level: 3 })
                ? "h3"
                : "paragraph",
          fontFamily:
            (currentEditor.getAttributes("textStyle").fontFamily as string | undefined) ?? "",
          fontSize:
            (currentEditor.getAttributes("textStyle").fontSize as string | undefined) ?? "",
          textColor: currentEditor.getAttributes("textStyle").color as string | undefined,
          highlightColor: currentEditor.getAttributes("highlight").color as string | undefined,
          bold: currentEditor.isActive("bold"),
          italic: currentEditor.isActive("italic"),
          underline: currentEditor.isActive("underline"),
          strike: currentEditor.isActive("strike"),
          subscript: currentEditor.isActive("subscript"),
          superscript: currentEditor.isActive("superscript"),
          code: currentEditor.isActive("code"),
          codeBlock: currentEditor.isActive("codeBlock"),
          bulletList: currentEditor.isActive("bulletList"),
          orderedList: currentEditor.isActive("orderedList"),
          taskList: currentEditor.isActive("taskList"),
          blockquote: currentEditor.isActive("blockquote"),
          alignLeft: currentEditor.isActive({ textAlign: "left" }),
          alignCenter: currentEditor.isActive({ textAlign: "center" }),
          alignRight: currentEditor.isActive({ textAlign: "right" }),
          alignJustify: currentEditor.isActive({ textAlign: "justify" }),
          link: currentEditor.isActive("link"),
          heading3: currentEditor.isActive("heading", { level: 3 }),
          imageActive: currentEditor.isActive("image"),
          imageWidth:
            (currentEditor.getAttributes("image").width as string | undefined) ?? "75%",
          imageAlign:
            ((currentEditor.getAttributes("image").align as "left" | "center" | "right" | undefined) ??
              "center"),
        }
      },
    }) ?? {
      headingValue: "paragraph",
      fontFamily: "",
      fontSize: "",
      textColor: undefined,
      highlightColor: undefined,
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      subscript: false,
      superscript: false,
      code: false,
      codeBlock: false,
      bulletList: false,
      orderedList: false,
      taskList: false,
      blockquote: false,
      alignLeft: false,
      alignCenter: false,
      alignRight: false,
      alignJustify: false,
      link: false,
      heading3: false,
      imageActive: false,
      imageWidth: "75%",
      imageAlign: "center" as "left" | "center" | "right",
    }

  const setImageAlign = React.useCallback(
    (align: "left" | "center" | "right") => {
      if (!editor || !toolbarState.imageActive) return
      const caption = getActiveImageCaption(editor)
      editor
        .chain()
        .focus()
        .updateAttributes("image", caption ? { align, caption } : { align })
        .run()
      removeAdjacentCaptionParagraph(editor, caption)
    },
    [editor, toolbarState.imageActive]
  )

  const setImageWidthPercent = React.useCallback(
    (percent: number) => {
      if (!editor || !toolbarState.imageActive) return
      const safe = Math.min(100, Math.max(20, percent))
      const caption = getActiveImageCaption(editor)
      editor
        .chain()
        .focus()
        .updateAttributes("image", caption ? { width: `${safe}%`, caption } : { width: `${safe}%` })
        .run()
      removeAdjacentCaptionParagraph(editor, caption)
    },
    [editor, toolbarState.imageActive]
  )

  const activeTextColor = normalizeHexColor(toolbarState.textColor, colorSwatches[0])
  const activeHighlightColor = normalizeHexColor(
    toolbarState.highlightColor,
    highlightSwatches[0]
  )
  const isInlineCodeActive = toolbarState.code
  const isCodeBlockActive = toolbarState.codeBlock

  return (
    <div className="overflow-visible rounded-b-2xl border-x border-b border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-end border-b border-stone-200 bg-stone-50 px-3 py-2">
        <Tabs
          value={editorMode}
          onValueChange={(nextMode) => {
            const mode = nextMode as "visual" | "html"
            if (mode === "visual") {
              applyHtmlToVisualEditor()
            } else if (mode === "html") {
              const sourceHtml = editor?.getHTML() ?? htmlDraft
              setHtmlDraft(toHtmlDraftFromContent(sourceHtml))
              setIsHtmlDraftDirty(false)
            }
            setEditorMode(mode)
          }}
          className="gap-0"
        >
          <TabsList variant="line" className="h-8 rounded-lg bg-white p-0.5">
            <TabsTrigger value="visual" className="h-7 min-w-[88px] rounded-md text-xs">
              Trực quan
            </TabsTrigger>
            <TabsTrigger value="html" className="h-7 min-w-[88px] rounded-md text-xs">
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {editorMode === "visual" ? (
      <>
      {blockControls ? (
        <div className=" px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-orange-500 bg-orange-300/30"
              onClick={blockControls.addPostTitleBlock}
            >
              Đồng bộ H1 đầu bài
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-orange-500 bg-orange-300/30"
              onClick={blockControls.addContentBlock}
            >
              Block Nội Dung
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-orange-500 bg-orange-300/30"
              onClick={blockControls.addContactFooterBlock}
            >
              Block Footer Liên Hệ
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-orange-500 bg-orange-300/30"
              onClick={blockControls.addTocBlock}
            >
              Block Mục Lục
            </Button>
            <select
              defaultValue=""
              onChange={(event) => {
                const blockId = event.target.value
                if (!blockId) return
                blockControls.onSelectReusableBlock(blockId)
                event.currentTarget.value = ""
              }}
              className="h-9 min-w-[230px] rounded-full border border-orange-500 bg-orange-300/30 bg-white px-3 text-sm text-stone-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Reusable block (toàn cục)</option>
              {blockControls.reusableBlocks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      ) : null}

      <div className="sticky top-[76px] z-30 flex flex-wrap items-center gap-1 border-b border-stone-200 bg-white/95 px-3 py-2 backdrop-blur-sm">
        <select
          value={toolbarState.headingValue}
          onChange={(event) => {
            const value = event.target.value
            if (value === "h1") editor?.chain().focus().toggleHeading({ level: 1 }).run()
            if (value === "h2") editor?.chain().focus().toggleHeading({ level: 2 }).run()
            if (value === "h3") editor?.chain().focus().toggleHeading({ level: 3 }).run()
            if (value === "paragraph") editor?.chain().focus().setParagraph().run()
          }}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        >
          <option value="paragraph">Đoạn văn</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <select
          value={toolbarState.fontFamily}
          onChange={(event) => {
            const fontFamily = event.target.value
            if (!fontFamily) {
              editor?.chain().focus().unsetFontFamily().run()
              return
            }

            editor?.chain().focus().setFontFamily(fontFamily).run()
          }}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        >
          {fontFamilies.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <select
          value={toolbarState.fontSize}
          onChange={(event) => {
            const fontSize = event.target.value
            if (!fontSize) {
              editor?.chain().focus().unsetFontSize().run()
              return
            }

            editor?.chain().focus().setFontSize(fontSize).run()
          }}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Cỡ chữ</option>
          {fontSizes.map((fontSize) => (
            <option key={fontSize} value={fontSize}>
              {fontSize.replace("px", "")}
            </option>
          ))}
        </select>

        <EditorDivider />
        <EditorButton
          label="HoÒ n tÒ¡c"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <IconArrowBackUp className="size-4" />
        </EditorButton>
        <EditorButton
          label="LҠm lại"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <IconArrowForwardUp className="size-4" />
        </EditorButton>

        <EditorDivider />
        <EditorButton
          label="In đậm"
          active={toolbarState.bold}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <IconBold className="size-4" />
        </EditorButton>
        <EditorButton
          label="In nghiÒªng"
          active={toolbarState.italic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <IconItalic className="size-4" />
        </EditorButton>
        <EditorButton
          label="Gạch chҢn"
          active={toolbarState.underline}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <IconTextSpellcheck className="size-4" />
        </EditorButton>
        <EditorButton
          label="Gạch ngang"
          active={toolbarState.strike}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <IconStrikethrough className="size-4" />
        </EditorButton>
        <EditorButton
          label="Chá»⬰ sá»�� d� °á»⬺i"
          active={toolbarState.subscript}
          onClick={() => editor?.chain().focus().toggleSubscript().run()}
        >
          <IconSubscript className="size-4" />
        </EditorButton>
        <EditorButton
          label="Chá»⬰ sá»�� trÒªn"
          active={toolbarState.superscript}
          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
        >
          <IconSuperscript className="size-4" />
        </EditorButton>
        <EditorButton
          label="Code inline"
          active={isInlineCodeActive || isCodeBlockActive}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <IconCode className="size-4" />
        </EditorButton>

        <EditorDivider />
        <EditorButton
          label="Danh sÒ¡ch"
          active={toolbarState.bulletList}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <IconList className="size-4" />
        </EditorButton>
        <EditorButton
          label="Danh sách số"
          active={toolbarState.orderedList}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <IconListNumbers className="size-4" />
        </EditorButton>
        <EditorButton
          label="Checklist"
          active={toolbarState.taskList}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <IconCheckupList className="size-4" />
        </EditorButton>
        <EditorButton
          label="Trҭch dẫn"
          active={toolbarState.blockquote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <IconBlockquote className="size-4" />
        </EditorButton>
        <EditorButton
          label="Code block"
          active={isCodeBlockActive}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <IconCode className="size-4" />
        </EditorButton>

        <EditorDivider />
        <EditorButton
          label="Căn trái"
          active={toolbarState.alignLeft}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <IconTextWrap className="size-4" />
        </EditorButton>
        <EditorButton
          label="Căn giữa"
          active={toolbarState.alignCenter}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <IconTextSize className="size-4" />
        </EditorButton>
        <EditorButton
          label="Căn phải"
          active={toolbarState.alignRight}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <IconTextDirectionRtl className="size-4" />
        </EditorButton>
        <EditorButton
          label="Căn đều"
          active={toolbarState.alignJustify}
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
        >
          <IconTextWrapDisabled className="size-4" />
        </EditorButton>

        <EditorDivider />
        <ColorToolbarControl
          label="MҠu chữ"
          icon={<IconTextColor className="size-4" />}
          value={activeTextColor}
          fallback={colorSwatches[0]}
          swatches={colorSwatches}
          onChange={(color) => editor?.chain().focus().setColor(color).run()}
        />
        <ColorToolbarControl
          label="MҠu nền"
          icon={<IconHighlight className="size-4" />}
          value={activeHighlightColor}
          fallback={highlightSwatches[0]}
          swatches={highlightSwatches}
          onChange={(color) => editor?.chain().focus().setHighlight({ color }).run()}
        />

        <EditorDivider />
        <EditorButton
          label="ThÒªm link"
          active={toolbarState.link}
          onClick={() => setLink(editor)}
        >
          <IconLink className="size-4" />
        </EditorButton>
        <EditorButton label="ThҪm ảnh" onClick={() => setIsImageLibraryOpen(true)}>
          <IconPhoto className="size-4" />
        </EditorButton>
        {toolbarState.imageActive ? (
          <EditorButton
            label="Sửa ảnh ���ang chọn"
            onClick={() => {
              setImageActionMode("replace")
              const imageAttrs = editor?.getAttributes("image") as
                | { src?: string; alt?: string; title?: string; caption?: string }
                | undefined
              setImagePickerInitialUrl(imageAttrs?.src ?? null)
              setImagePickerInitialDraft({
                altText: imageAttrs?.alt ?? "",
                title: imageAttrs?.title ?? "",
                caption: getActiveImageCaption(editor),
              })
              setIsImageLibraryOpen(true)
            }}
          >
            <IconPhoto className="size-4" />
          </EditorButton>
        ) : null}

        <EditorDivider />
        <TableDropdown editor={editor} />

        <EditorDivider />
        <EditorButton
          label="TiҪu ���ề nhỏ"
          active={toolbarState.heading3}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <IconH3 className="size-4" />
        </EditorButton>
        <EditorButton
          label="Xuống dòng"
          onClick={() => editor?.chain().focus().setHardBreak().run()}
        >
          <IconCornerDownLeft className="size-4" />
        </EditorButton>
        <EditorButton
          label="Xóa định dạng"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <IconClearFormatting className="size-4" />
        </EditorButton>
      </div>

      {editor ? (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: currentEditor }) =>
            !currentEditor.isActive("image") && !currentEditor.state.selection.empty
          }
        >
          <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 shadow-xl">
            <EditorButton
              label="In đậm"
              active={toolbarState.bold}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <IconBold className="size-4" />
            </EditorButton>
            <EditorButton
              label="In nghiÒªng"
              active={toolbarState.italic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <IconItalic className="size-4" />
            </EditorButton>
            <EditorButton
              label="ThÒªm link"
              active={toolbarState.link}
              onClick={() => setLink(editor)}
            >
              <IconLink className="size-4" />
            </EditorButton>
          </div>
        </BubbleMenu>
      ) : null}

 {editor ? (
        <BubbleMenu editor={editor} shouldShow={({ editor: currentEditor }) => currentEditor.isActive("image")}>
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-2 py-1 shadow-xl">
            <EditorButton
              label="Canh trÒ¡i"
              active={toolbarState.imageAlign === "left"}
              onClick={() => setImageAlign("left")}
            >
              <IconLayoutAlignLeft className="size-4" />
            </EditorButton>
            <EditorButton
              label="Canh giữa"
              active={toolbarState.imageAlign === "center"}
              onClick={() => setImageAlign("center")}
            >
              <IconLayoutAlignCenter className="size-4" />
            </EditorButton>
            <EditorButton
              label="Canh phải"
              active={toolbarState.imageAlign === "right"}
              onClick={() => setImageAlign("right")}
            >
              <IconLayoutAlignRight className="size-4" />
            </EditorButton>
            <input
              type="range"
              min={20}
              max={100}
              step={1}
              value={Number.parseInt(toolbarState.imageWidth.replace("%", ""), 10) || 75}
              onChange={(event) => setImageWidthPercent(Number(event.target.value))}
              className="h-2 w-28 accent-orange-600"
              aria-label="Resize ảnh"
            />
            <span className="w-10 text-center text-xs text-stone-600">
              {Number.parseInt(toolbarState.imageWidth.replace("%", ""), 10) || 75}%
            </span>
            <EditorButton
              label="Sửa ảnh"
              onClick={() => {
                setImageActionMode("replace")
                const imageAttrs = editor?.getAttributes("image") as
                  | { src?: string; alt?: string; title?: string; caption?: string }
                  | undefined
                setImagePickerInitialUrl(imageAttrs?.src ?? null)
                setImagePickerInitialDraft({
                  altText: imageAttrs?.alt ?? "",
                  title: imageAttrs?.title ?? "",
                  caption: getActiveImageCaption(editor),
                })
                setIsImageLibraryOpen(true)
              }}
            >
              <IconPhoto className="size-4" />
            </EditorButton>
            <EditorButton
              label="Xҳa ảnh"
              onClick={() => deleteActiveImageWithCaption(editor)}
            >
              <IconTrash className="size-4" />
            </EditorButton>
          </div>
        </BubbleMenu>
      ) : null}

      <EditorContent editor={editor} />
      <MediaPickerDialog
        open={isImageLibraryOpen}
        onOpenChange={(nextOpen) => {
          setIsImageLibraryOpen(nextOpen)
          if (!nextOpen) {
            setImageActionMode("insert")
            setImagePickerInitialUrl(null)
            setImagePickerInitialDraft(null)
          }
        }}
        initialSelectedUrl={imagePickerInitialUrl}
        initialDraft={imagePickerInitialDraft}
        captionOnly
        lockDraftOnSelection={imageActionMode === "replace"}
        onSelect={(media) =>
          applyImageToEditor({
            url: media.url,
            mediaId: media.id,
            altText: media.altText,
            title: media.title,
            caption: (media as any).caption ?? null,
            description: (media as any).description ?? null,
          }, { replaceCurrent: imageActionMode === "replace" })
        }
        onSelectUrl={async (url) => {
          try {
            const external = await mediaService.createExternalMedia({ url })
            applyImageToEditor({
              url: external.url,
              mediaId: external.id,
              altText: external.altText,
              title: external.title,
            })
          } catch (error) {
            console.error("Failed to create external media", error)
            applyImageToEditor({ url })
          }
        }}
        title="Ảnh từ thư viện"
      />
      </>
      ) : (
        <div className="border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-white px-3 py-2">
            {[
              { label: "b", onClick: () => insertHtmlSnippet("<strong>", "</strong>") },
              { label: "i", onClick: () => insertHtmlSnippet("<em>", "</em>") },
              { label: "link", onClick: () => insertHtmlSnippet('<a href="">', "</a>") },
              { label: "img", onClick: () => insertHtmlSnippet('<img src="" alt="" />') },
              { label: "ul", onClick: () => insertHtmlSnippet("<ul>\n  <li>", "</li>\n</ul>") },
              { label: "ol", onClick: () => insertHtmlSnippet("<ol>\n  <li>", "</li>\n</ol>") },
              { label: "li", onClick: () => insertHtmlSnippet("<li>", "</li>") },
              { label: "h2", onClick: () => insertHtmlSnippet("<h2>", "</h2>") },
              { label: "h3", onClick: () => insertHtmlSnippet("<h3>", "</h3>") },
              { label: "code", onClick: () => insertHtmlSnippet("<code>", "</code>") },
              { label: "quote", onClick: () => insertHtmlSnippet("<blockquote>", "</blockquote>") },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                {action.label}
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-stone-200" />
            <button
              type="button"
              onClick={formatHtmlDraft}
              className="h-8 rounded-md border border-orange-300 bg-orange-50 px-2.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              Làm đẹp HTML
            </button>
          </div>
          <Textarea
            ref={htmlTextareaRef}
            value={htmlDraft}
            onChange={(event) => {
              setHtmlDraft(event.target.value)
              setIsHtmlDraftDirty(true)
            }}
            className="min-h-[680px] rounded-none border-0 px-4 py-3 font-mono text-[13px] leading-6 focus-visible:ring-0"
          />
        </div>

      )}
    </div>
  )
}

export default function BlogPostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = postId === "new"

  const [post, setPost] = React.useState<BlogPost | null>(null)
  const [categories, setCategories] = React.useState<BlogCategory[]>([])
  const [tags, setTags] = React.useState<Tag[]>([])
  const [isLoading, setIsLoading] = React.useState(!isNew)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isAiPreviewOpen, setIsAiPreviewOpen] = React.useState(false)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [coverUrl, setCoverUrl] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [autoDraftPostId, setAutoDraftPostId] = React.useState<string | null>(null)
  const draftUuidRef = React.useRef(createDraftUuid())
  const isAutoSavingRef = React.useRef(false)
  const lastAutoSaveSignatureRef = React.useRef<string | null>(null)
  const lastAutoSeoFieldsRef = React.useRef<ReturnType<typeof buildAutoSeoFields> | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<CreateBlogPostPayload>({
    resolver: zodResolver(CreateBlogPostPayloadSchema),
    defaultValues: {
      title: isNew ? EMPTY_NEW_BLOG_TITLE : "",
      slug: "",
      excerpt: "",
      content: isNew
        ? mergeBlocksToContent([createTitleBlock(EMPTY_NEW_BLOG_TITLE)])
        : "",
      coverMediaId: "",
      status: ContentStatus.DRAFT,
      categoryIds: [],
      tagIds: [],
      seo: {
        metaTitle: "",
        metaDescription: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImageMediaId: "",
        twitterTitle: "",
        twitterDescription: "",
        noIndex: false,
        noFollow: false,
      },
    },
  })

  const preview = useWatch({ control })
  const selectedTagIds = preview.tagIds ?? []
  const contentBlocks = React.useMemo(
    () => splitContentToBlocks(preview.content),
    [preview.content]
  )
  React.useEffect(() => {
    const ensuredContent = ensureTitleBlockContent(preview.content, preview.title)
    if (ensuredContent === (preview.content ?? "")) return
    setValue("content", ensuredContent, { shouldDirty: true, shouldValidate: true })
  }, [preview.content, preview.title, setValue])
  const publishPreviewHtml = React.useMemo(
    () => toPublishableBlogHtml(preview.content),
    [preview.content]
  )
  const [reusableBlocks, setReusableBlocks] = React.useState<BlogReusableBlock[]>([])
  const [saveBlockDialog, setSaveBlockDialog] = React.useState<{
    open: boolean
    type: "title" | "content" | "footer"
    html: string
    name: string
    description: string
    isSaving: boolean
  }>({
    open: false,
    type: "content",
    html: "",
    name: "",
    description: "",
    isSaving: false,
  })

  const fetchReusableBlocks = React.useCallback(async () => {
    try {
      const response = await blogService.getReusableBlocks({
        limit: 200,
        isActive: true,
      })
      setReusableBlocks(response.data)
    } catch (error) {
      console.error("Failed to fetch reusable blog blocks", error)
      setFeedback({
        message: "Không tải được reusable block toàn cục.",
        tone: "error",
      })
    }
  }, [])

  const insertContentBlock = React.useCallback(
    (html: string, type: "title" | "content" | "footer" = "content") => {
      const nextBlocks = [...splitContentToBlocks(preview.content), wrapHtmlAsBlock(html, type)]
      const nextContent = mergeBlocksToContent(nextBlocks)
      setValue("content", nextContent, { shouldDirty: true, shouldValidate: true })
    },
    [preview.content, setValue]
  )

  const moveBlock = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const blocks = [...splitContentToBlocks(preview.content)]
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= blocks.length ||
        toIndex >= blocks.length ||
        fromIndex === toIndex ||
        fromIndex === 0 ||
        toIndex === 0
      ) {
        return
      }
      const [moved] = blocks.splice(fromIndex, 1)
      blocks.splice(toIndex, 0, moved)
      setValue("content", mergeBlocksToContent(blocks), { shouldDirty: true, shouldValidate: true })
    },
    [preview.content, setValue]
  )

  const removeBlock = React.useCallback(
    (index: number) => {
      const blocks = [...splitContentToBlocks(preview.content)]
      if (index < 0 || index >= blocks.length) return
      if (index === 0 && isTitleBlockHtml(blocks[index])) return
      blocks.splice(index, 1)
      setValue("content", mergeBlocksToContent(blocks), { shouldDirty: true, shouldValidate: true })
    },
    [preview.content, setValue]
  )

  const replaceBlock = React.useCallback(
    (index: number, html: string, type: "title" | "content" | "footer") => {
      const blocks = [...splitContentToBlocks(preview.content)]
      if (index < 0 || index >= blocks.length) return

      if (index === 0 && isTitleBlockHtml(blocks[index])) {
        const nextTitle = extractBlockTitleFromHtml(html)
        if (!nextTitle) return
        setValue("title", nextTitle, { shouldDirty: true, shouldValidate: true })
        return
      }

      const nextHtml = normalizeBlockAiReplacementHtml(html, type)
      if (!nextHtml) return
      blocks[index] = wrapHtmlAsBlock(nextHtml, type)
      setValue("content", mergeBlocksToContent(blocks), { shouldDirty: true, shouldValidate: true })
    },
    [preview.content, setValue]
  )

  const addPostTitleBlock = React.useCallback(() => {
    const nextContent = ensureTitleBlockContent(preview.content, preview.title)
    setValue("content", nextContent, { shouldDirty: true, shouldValidate: true })
  }, [preview.content, preview.title, setValue])

  const addContactFooterBlock = React.useCallback(() => {
    insertContentBlock(
      `<hr /><h3>ThÒ´ng tin liÒªn há»⬡</h3><p><strong>Duky Store</strong><br />Hotline: 0900 000 000<br />Email: contact@duky.store<br />Website: https://duky.store</p>`,
      "footer"
    )
  }, [insertContentBlock])

  const addTocBlock = React.useCallback(() => {
    const toc = generateTableOfContents(preview.content || "")
    if (toc.length === 0) {
      insertContentBlock("<p><em>Chưa có heading (h2/h3) trong nội dung để tạo mục lục.</em></p>", "content")
      return
    }
    let h2Counter = 0
    const tocHtml = `<p><strong>📋 Mục lục</strong></p>${toc.map((item) => {
      if (item.level === 2) {
        h2Counter++
        return `<p style="margin:2px 0;padding:4px 8px;background:#f9fafb;border-radius:6px;"><a href="#${item.id}" style="color:#c2410c;text-decoration:none;font-weight:500;">${h2Counter}. ${item.text}</a></p>`
      }
      return `<p style="margin:2px 0;padding:4px 8px 4px 24px;"><a href="#${item.id}" style="color:#78716c;text-decoration:none;">• ${item.text}</a></p>`
    }).join("")}`
    insertContentBlock(tocHtml, "content")
  }, [insertContentBlock, preview.content])

  const openSaveReusableBlockDialog = React.useCallback((data: SaveReusableBlockRequest) => {
    setSaveBlockDialog({
      open: true,
      type: data.type,
      html: wrapHtmlAsBlock(data.html, data.type),
      name: blockTypeLabel(data.type),
      description: "",
      isSaving: false,
    })
  }, [])

  const closeSaveReusableBlockDialog = React.useCallback(() => {
    setSaveBlockDialog((current) => ({
      ...current,
      open: false,
      isSaving: false,
    }))
  }, [])

  const submitReusableBlock = React.useCallback(async () => {
    const name = saveBlockDialog.name.trim()
    if (!name || !saveBlockDialog.html.trim()) {
      setFeedback({
        message: "Nhập tên block trước khi lưu.",
        tone: "error",
      })
      return
    }

    try {
      setSaveBlockDialog((current) => ({ ...current, isSaving: true }))
      const created = await blogService.createReusableBlock({
        name,
        description: saveBlockDialog.description.trim() || null,
        html: saveBlockDialog.html,
        type: toReusableBlockType(saveBlockDialog.type),
        isActive: true,
      })
      setReusableBlocks((current) => [created, ...current])
      setFeedback({
        message: "Đã lưu reusable block toàn cục.",
        tone: "success",
      })
      closeSaveReusableBlockDialog()
      void fetchReusableBlocks()
    } catch (error) {
      console.error("Failed to save reusable block", error)
      setFeedback({
        message: "Không lưu được reusable block.",
        tone: "error",
      })
      setSaveBlockDialog((current) => ({ ...current, isSaving: false }))
    }
  }, [closeSaveReusableBlockDialog, fetchReusableBlocks, saveBlockDialog])

  const selectedStatus = preview.status ?? ContentStatus.DRAFT
  const generatedSlug = slugify(preview.title || "bai-viet")
  const activePostId = isNew ? autoDraftPostId : postId

  const [focusKeyword, setFocusKeyword] = React.useState(
    post?.seo?.focusKeyword ?? ""
  )
  const [seoKeywordInput, setSeoKeywordInput] = React.useState("")
  const [isSeoDrawerOpen, setIsSeoDrawerOpen] = React.useState(false)
  const [lastAutoSaved, setLastAutoSaved] = React.useState<Date | null>(null)
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null)
  const [aiTask, setAiTask] = React.useState<BlogAiTask>("SEO")
  const [aiTone, setAiTone] = React.useState("Tư vấn thân thiện, chuyên nghiệp")
  const [aiArticleType, setAiArticleType] = React.useState("Hướng dẫn SEO bán hàng")
  const [isAiLoading, setIsAiLoading] = React.useState(false)
  const [isKeywordAiLoading, setIsKeywordAiLoading] = React.useState(false)
  const [aiResult, setAiResult] = React.useState<BlogAiAssistResult | null>(null)
  const [aiMediaLibrary, setAiMediaLibrary] = React.useState<Media[]>([])
  const aiAllowsFullContent =
    aiTask === "FULL_DRAFT" || aiTask === "SEO" || aiTask === "OPTIMIZE"
  const aiContentHtml = aiAllowsFullContent ? aiResult?.contentHtml : null
  const aiPreviewHtml = React.useMemo(() => {
    const mediaById = new Map(aiMediaLibrary.map((media) => [media.id, media]))
    return toPublishableBlogHtml(
      insertAiSelectedImagesIntoHtml(aiContentHtml ?? "", aiResult?.selectedMedia, mediaById)
    )
  }, [aiContentHtml, aiMediaLibrary, aiResult?.selectedMedia])
  const aiSelectedCoverUrl = React.useMemo(() => {
    const selectedCoverId = aiResult?.selectedMedia?.coverMediaId
    if (!selectedCoverId) return ""
    const media = aiMediaLibrary.find((item) => item.id === selectedCoverId)
    return getMediaAssetUrl(media)
  }, [aiMediaLibrary, aiResult?.selectedMedia?.coverMediaId])

  const seoInput: SeoInput | null = React.useMemo(() => {
    // Use first keyword from comma-separated list as primary focus keyword
    const keywords = focusKeyword.split(",").map((k) => k.trim()).filter(Boolean)
    const primaryKeyword = keywords[0] || ""
    if (!primaryKeyword) return null
    return {
      focusKeyword: primaryKeyword,
      secondaryKeywords: keywords.slice(1),
      seoTitle: preview.seo?.metaTitle || preview.title || "",
      metaDescription: preview.seo?.metaDescription || preview.excerpt || "",
      slug: preview.slug || generatedSlug || "",
      htmlContent: preview.content || "",
      siteUrl: typeof window !== "undefined" ? window.location.origin : "",
    }
  }, [focusKeyword, preview.seo?.metaTitle, preview.title, preview.seo?.metaDescription, preview.excerpt, preview.slug, generatedSlug, preview.content])

  const seoResult = useSeoAnalysis(seoInput)
  const seoKeywords = React.useMemo(
    () => focusKeyword.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    [focusKeyword]
  )
  const primaryKeywordWarning = getPrimaryKeywordWarning(seoKeywords[0], preview.title)

  const updateFocusKeyword = React.useCallback(
    (value: string) => {
      const normalized = normalizeKeywordList(value)
      setFocusKeyword(normalized)
      setValue("seo.focusKeyword", normalized, { shouldDirty: true })
    },
    [setValue]
  )

  const addSeoKeyword = React.useCallback(() => {
    const nextKeyword = seoKeywordInput.trim()
    if (!nextKeyword) return
    const exists = seoKeywords.some(
      (keyword) => keyword.toLowerCase() === nextKeyword.toLowerCase()
    )
    if (!exists) {
      updateFocusKeyword([...seoKeywords, nextKeyword].join(", "))
    }
    setSeoKeywordInput("")
  }, [seoKeywordInput, seoKeywords, updateFocusKeyword])

  const handleSeoKeywordKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        addSeoKeyword()
      }
      if (event.key === "Backspace" && !seoKeywordInput && seoKeywords.length > 0) {
        event.preventDefault()
        updateFocusKeyword(seoKeywords.slice(0, -1).join(", "))
      }
    },
    [addSeoKeyword, seoKeywordInput, seoKeywords, updateFocusKeyword]
  )

  const removeSeoKeyword = React.useCallback(
    (index: number) => {
      updateFocusKeyword(seoKeywords.filter((_, keywordIndex) => keywordIndex !== index).join(", "))
    },
    [seoKeywords, updateFocusKeyword]
  )

  // Table of Contents auto-generation
  const tocItems = React.useMemo(
    () => generateTableOfContents(preview.content || ''),
    [preview.content]
  )
  const getBlockAiContext = React.useCallback(
    (index: number | null): BlogAiBlockContext => {
      const blocks = splitContentToBlocks(preview.content)
      const previousBlock = index !== null && index > 0 ? blocks[index - 1] : undefined
      const nextBlock =
        index !== null && index >= 0 && index < blocks.length - 1
          ? blocks[index + 1]
          : undefined

      return {
        articleExcerpt: (preview.excerpt ?? "").trim().slice(0, 500) || undefined,
        focusKeyword: focusKeyword.trim().slice(0, 500) || undefined,
        articleType: aiArticleType.trim().slice(0, 200) || undefined,
        tone: aiTone.trim().slice(0, 200) || undefined,
        outline: tocItems
          .slice(0, 30)
          .map((item) => `${item.level === 2 ? "H2" : "H3"}: ${item.text}`.slice(0, 300)),
        previousBlockHtml: previousBlock
          ? unwrapBlockHtml(previousBlock).slice(0, 6000)
          : undefined,
        nextBlockHtml: nextBlock
          ? unwrapBlockHtml(nextBlock).slice(0, 6000)
          : undefined,
        seoScore: seoResult?.score,
        seoFailedChecks: seoResult?.checks
          .filter((check) => !check.passed)
          .slice(0, 20)
          .map((check) =>
            `${check.label}${check.description ? `: ${check.description}` : ""}`.slice(0, 300)
          ),
      }
    },
    [aiArticleType, aiTone, focusKeyword, preview.content, preview.excerpt, seoResult, tocItems]
  )

  // Internal link suggestions
  const [allOtherPosts, setAllOtherPosts] = React.useState<{ title: string; slug: string }[]>([])
  const internalLinkSuggestions = React.useMemo(
    () => suggestInternalLinks(preview.content || '', allOtherPosts),
    [preview.content, allOtherPosts]
  )

  // Product suggestions for CTA links
  const [allProducts, setAllProducts] = React.useState<{ title: string; slug: string }[]>([])
  const productSuggestions = React.useMemo(
    () => suggestInternalLinks(preview.content || '', allProducts),
    [preview.content, allProducts]
  )

  const autoSaveDraft = React.useCallback(async () => {
    if (isAutoSavingRef.current) return

    const currentValues = getValues()
    if (!isDirty) return
    if (currentValues.status !== ContentStatus.DRAFT) return

    const signature = JSON.stringify({
      title: currentValues.title,
      excerpt: currentValues.excerpt,
      content: currentValues.content,
      coverMediaId: currentValues.coverMediaId,
      categoryIds: currentValues.categoryIds,
      tagIds: currentValues.tagIds,
      seo: currentValues.seo,
      focusKeyword,
      seoScore: seoResult?.score ?? null,
    })
    if (lastAutoSaveSignatureRef.current === signature) return

    const title = isNew && isDefaultNewBlogTitle(currentValues.title)
      ? `Bài viết nháp-${draftUuidRef.current}`
      : currentValues.title
    const content = currentValues.content?.trim()
      ? currentValues.content
      : "<p>Bản nháp tự động.</p>"

    try {
      isAutoSavingRef.current = true
      const payload = normalizePayload(
        {
          ...currentValues,
          title,
          slug: currentValues.slug || uniqueSlug(title, draftUuidRef.current),
          content,
          status: ContentStatus.DRAFT,
        },
        {
          focusKeyword: focusKeyword.trim(),
          seoScore: seoResult?.score ?? null,
          analysisJson: seoResult ?? null,
        }
      )

      if (activePostId) {
        try {
          await blogService.updatePost(activePostId, payload)
        } catch (error) {
          if (!isSlugConflictError(error)) throw error
          const retryPayload = {
            ...payload,
            slug: uniqueSlug(payload.slug || payload.title, draftUuidRef.current),
          }
          setValue("slug", retryPayload.slug ?? "", { shouldDirty: true })
          await blogService.updatePost(activePostId, retryPayload)
        }
      } else if (isNew) {
        let created: BlogPost
        try {
          created = await blogService.createPost(payload)
        } catch (error) {
          if (!isSlugConflictError(error)) throw error
          created = await blogService.createPost({
            ...payload,
            slug: uniqueSlug(payload.slug || payload.title, draftUuidRef.current),
          })
        }
        setAutoDraftPostId(created.id)
        setValue("slug", created.slug, { shouldDirty: false })
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `/blog/${created.id}`)
        }
      }

      lastAutoSaveSignatureRef.current = signature
      setLastAutoSaved(new Date())
    } catch (error) {
      console.error("Auto-save failed", error)
    } finally {
      isAutoSavingRef.current = false
    }
  }, [activePostId, focusKeyword, getValues, isDirty, isNew, seoResult])

  // Auto-save draft quickly so a new post is not lost when closing the tab.
  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      void autoSaveDraft()
    }, isNew && !autoDraftPostId ? 2500 : 8000)

    return () => window.clearTimeout(timeout)
  }, [autoSaveDraft, autoDraftPostId, isNew, preview])

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      void autoSaveDraft()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [autoSaveDraft])

  React.useEffect(() => {
    const nextSlug = slugify(preview.title ?? "")
    if ((preview.slug ?? "") === nextSlug) return

    setValue("slug", nextSlug, {
      shouldDirty: false,
      shouldValidate: Boolean(nextSlug),
    })
  }, [preview.slug, preview.title, setValue])

  React.useEffect(() => {
    const autoSeo = buildAutoSeoFields({
      title: preview.title,
      excerpt: preview.excerpt,
      content: preview.content,
      slug: generatedSlug,
      focusKeyword,
    })
    const previousAutoSeo = lastAutoSeoFieldsRef.current
    const seo = preview.seo ?? {}
    const fields = [
      "metaTitle",
      "metaDescription",
      "ogTitle",
      "ogDescription",
      "twitterTitle",
      "twitterDescription",
      "canonicalUrl",
    ] as const

    fields.forEach((field) => {
      const currentValue = (seo[field] ?? "").trim()
      const previousValue = previousAutoSeo?.[field] ?? ""
      const nextValue = autoSeo[field]

      if (!nextValue) return
      if (currentValue === nextValue) return
      if (currentValue && currentValue !== previousValue) return

      setValue(`seo.${field}`, nextValue, {
        shouldDirty: Boolean(currentValue),
        shouldValidate: false,
      })
    })

    lastAutoSeoFieldsRef.current = autoSeo
  }, [
    focusKeyword,
    generatedSlug,
    preview.content,
    preview.excerpt,
    preview.seo,
    preview.title,
    setValue,
  ])

  const fetchOptions = React.useCallback(async () => {
    try {
      const [categoryResponse, tagResponse, reusableBlockResponse] = await Promise.all([
        blogService.getCategories({ limit: 100 }),
        tagService.getTags({ limit: 100 }),
        blogService.getReusableBlocks({ limit: 200, isActive: true }),
      ])

      setCategories(categoryResponse.data)
      setTags(tagResponse.data.filter((tag) => tag.type !== TagType.PRODUCT))
      setReusableBlocks(reusableBlockResponse.data)
      // Fetch other posts for internal link suggestions
      try {
        const postsResponse = await blogService.getPosts({ limit: 50 })
        setAllOtherPosts(
          postsResponse.data
            .filter((p) => p.id !== postId)
            .map((p) => ({ title: p.title, slug: p.slug }))
        )
      } catch {
        // Non-critical: silently ignore if posts fetch fails
      }

      // Fetch products for product link suggestions
      try {
        const { apiClient } = await import("@/lib/api/axios-client")
        const productsResponse = await apiClient.get("/admin/products", { params: { limit: 50 } }) as any
        const products = productsResponse?.DT?.data || productsResponse?.data || []
        setAllProducts(
          products
            .filter((p: any) => (p.title || p.name) && p.slug)
            .map((p: any) => ({ title: p.title || p.name, slug: p.slug }))
        )
      } catch {
        // Non-critical: silently ignore if products fetch fails
      }
    } catch (error) {
      console.error("Failed to fetch blog options", error)
      setFeedback({
        message: "KhҴng tải ���� �ợc danh mục hoặc tag blog.",
        tone: "error",
      })
    }
  }, [])

  const fetchPost = React.useCallback(async () => {
    if (isNew || !postId) return

    try {
      setIsLoading(true)
      const data = await blogService.getPost(postId)

      setPost(data)
      setCoverUrl(data.coverMedia?.secureUrl || data.coverMedia?.url || "")
      reset({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        coverMediaId: data.coverMediaId ?? "",
        status: data.status ?? ContentStatus.DRAFT,
        categoryIds: data.categories.map((category) => category.id),
        tagIds: data.tags.map((tag) => tag.id),
        seo: {
          metaTitle: data.seo?.metaTitle ?? "",
          metaDescription: data.seo?.metaDescription ?? "",
          canonicalUrl: data.seo?.canonicalUrl ?? "",
          ogTitle: data.seo?.ogTitle ?? "",
          ogDescription: data.seo?.ogDescription ?? "",
          ogImageMediaId: data.seo?.ogImageMediaId ?? "",
          twitterTitle: data.seo?.twitterTitle ?? "",
          twitterDescription: data.seo?.twitterDescription ?? "",
          focusKeyword: data.seo?.focusKeyword ?? "",
          seoScore: data.seo?.seoScore ?? null,
          analysisJson: data.seo?.analysisJson ?? null,
          noIndex: data.seo?.noIndex ?? false,
          noFollow: data.seo?.noFollow ?? false,
        },
      })
      setFocusKeyword(data.seo?.focusKeyword ?? "")
    } catch (error) {
      console.error("Failed to fetch blog post", error)
      setFeedback({
        message: "KhҴng tải ���� �ợc chi tiết bҠi viết.",
        tone: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isNew, postId, reset])

  React.useEffect(() => {
    const timeout = window.setTimeout(fetchOptions, 0)
    return () => window.clearTimeout(timeout)
  }, [fetchOptions])

  React.useEffect(() => {
    const timeout = window.setTimeout(fetchPost, 0)
    return () => window.clearTimeout(timeout)
  }, [fetchPost])

  React.useEffect(() => {
    if (!feedback) return

    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 5000)

    return () => window.clearTimeout(timeout)
  }, [feedback])

  const toggleTag = (tagId: string, checked: boolean) => {
    setValue(
      "tagIds",
      checked
        ? [...new Set([...selectedTagIds, tagId])]
        : selectedTagIds.filter((id) => id !== tagId),
      { shouldDirty: true }
    )
  }

  const suggestSeoKeywords = async () => {
    try {
      setIsKeywordAiLoading(true)
      setFeedback(null)

      const selectedCategories = categories
        .filter((category) => (preview.categoryIds ?? []).includes(category.id))
        .map((category) => ({
          title: category.name,
          slug: category.slug,
          url: `/blog?category=${category.slug}`,
        }))
      const selectedTags = tags
        .filter((tag) => (preview.tagIds ?? []).includes(tag.id))
        .map((tag) => ({
          title: tag.name,
          slug: tag.slug,
          url: `/blog?tag=${tag.slug}`,
        }))

      const result = await blogService.assistWithAi({
        task: "SEO",
        title: preview.title || "",
        slug: generatedSlug,
        excerpt: preview.excerpt || "",
        content: preview.content || "",
        focusKeyword: focusKeyword.trim(),
        articleType: aiArticleType || "Gợi ý từ khóa SEO",
        tone: "Ngắn gọn, thực tế, ưu tiên intent tìm kiếm của khách hàng Việt Nam",
        categories: selectedCategories,
        tags: selectedTags,
        products: allProducts.slice(0, 30).map((product) => ({
          title: product.title,
          slug: product.slug,
          url: storefrontPath(`/products/${product.slug}`),
        })),
        relatedPosts: allOtherPosts.slice(0, 30).map((item) => ({
          title: item.title,
          slug: item.slug,
          url: storefrontPath(`/blog/${item.slug}`),
        })),
        extraContext: {
          mode: "SEO_KEYWORD_SUGGESTION",
          instruction:
            "Tra ve seo.focusKeyword dang danh sach ngan cach bang dau phay. Tu khoa dau tien la key chinh: phai la cum search ngan 2-6 tu, khong copy nguyen tieu de, khong viet hoa kieu title, khong dung dau cau. Neu title co nam 2026 thi chi giu nam khi no thuc su la search intent. Sau key chinh la 3-5 key phu/long-tail de mo rong ngu nghia. Neu focusKeyword hien tai qua dai hoac giong title thi hay rut gon key chinh thay vi giu nguyen.",
          currentKeywords: seoKeywords,
          examples: {
            badPrimary: "Xu Hướng Áo Blazer Nữ 2026",
            goodPrimary: "áo blazer nữ 2026",
            secondary: [
              "xu hướng áo blazer nữ",
              "cách phối áo blazer nữ",
              "blazer nữ công sở",
              "áo blazer nữ đẹp",
            ],
          },
        },
      })

      const suggestedKeywords = normalizeKeywordList(result.seo?.focusKeyword ?? "")
      if (!suggestedKeywords) {
        setFeedback({
          message: "AI chưa gợi ý được từ khóa. Hãy nhập tiêu đề hoặc mô tả bài trước.",
          tone: "error",
        })
        return
      }

      updateFocusKeyword(suggestedKeywords)
      setFeedback({
        message: "Đã gợi ý từ khóa SEO. Keyword đầu tiên là từ khóa chính.",
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to suggest SEO keywords", error)
      setFeedback({
        message: "AI chưa gợi ý được từ khóa. Kiểm tra backend/API rồi thử lại.",
        tone: "error",
      })
    } finally {
      setIsKeywordAiLoading(false)
    }
  }

  const runBlogAi = async () => {
    try {
      setIsAiLoading(true)
      setAiResult(null)
      setFeedback(null)
      setAiMediaLibrary([])

      const selectedCategories = categories
        .filter((category) => (preview.categoryIds ?? []).includes(category.id))
        .map((category) => ({
          title: category.name,
          slug: category.slug,
          url: `/blog?category=${category.slug}`,
        }))
      const selectedTags = tags
        .filter((tag) => (preview.tagIds ?? []).includes(tag.id))
        .map((tag) => ({
          title: tag.name,
          slug: tag.slug,
          url: `/blog?tag=${tag.slug}`,
        }))
      const result = await blogService.assistWithAi({
        task: aiTask,
        title: preview.title || "",
        slug: generatedSlug,
        excerpt: preview.excerpt || "",
        content: preview.content || "",
        focusKeyword: focusKeyword.trim(),
        articleType: aiArticleType,
        tone: aiTone,
        categories: selectedCategories,
        tags: selectedTags,
        products: allProducts.slice(0, 50).map((product) => ({
          title: product.title,
          slug: product.slug,
          url: storefrontPath(`/products/${product.slug}`),
        })),
        relatedPosts: allOtherPosts.slice(0, 50).map((item) => ({
          title: item.title,
          slug: item.slug,
          url: storefrontPath(`/blog/${item.slug}`),
        })),
        extraContext: {
          coverUrl,
          currentSeoScore: seoResult?.score ?? null,
          seoAnalysis: buildSeoAnalysisForAi(seoResult),
          metadataManagedByFrontend: true,
          lockedFocusKeyword: focusKeyword.trim() || null,
        },
      })

      setAiResult(result)
      setAiMediaLibrary(await fetchAiSelectedMedia(result))
      setFeedback({
        message: "AI đã tạo gợi ý. Kiểm tra rồi chọn phần muốn áp dụng.",
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to generate blog AI suggestions", error)
      const message =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "ECONNABORTED"
          ? "AI xử lý quá lâu và bị timeout. Đã tăng timeout, thử lại sau vài giây."
          : "AI chưa tạo được gợi ý. Kiểm tra API key/backend rồi thử lại."
      setFeedback({
        message,
        tone: "error",
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const applyAiSeo = () => {
    if (!aiResult?.seo) return
    const seo = aiResult.seo

    if (!focusKeyword.trim() && seo.focusKeyword) {
      updateFocusKeyword(seo.focusKeyword)
    }

    setFeedback({ message: "Đã áp dụng gợi ý SEO từ AI.", tone: "success" })
  }

  const applyAiOptimization = () => {
    const isSeoTask = aiTask === "SEO"
    const mediaById = new Map(aiMediaLibrary.map((media) => [media.id, media]))
    const selectedCoverMedia = aiResult?.selectedMedia?.coverMediaId
      ? mediaById.get(aiResult.selectedMedia.coverMediaId)
      : null
    const selectedOgMedia = aiResult?.selectedMedia?.ogImageMediaId
      ? mediaById.get(aiResult.selectedMedia.ogImageMediaId)
      : selectedCoverMedia

    if (!isSeoTask && aiResult?.title) {
      setValue("title", aiResult.title, { shouldDirty: true, shouldValidate: true })
    }
    if (!isSeoTask && aiResult?.slug) {
      setValue("slug", slugify(aiResult.slug), { shouldDirty: true, shouldValidate: true })
    }
    if (!isSeoTask && aiResult?.excerpt) {
      setValue("excerpt", aiResult.excerpt, { shouldDirty: true })
    }
    if (selectedCoverMedia) {
      setValue("coverMediaId", selectedCoverMedia.id, { shouldDirty: true, shouldValidate: true })
      setCoverUrl(getMediaAssetUrl(selectedCoverMedia))
    }
    if (selectedOgMedia) {
      setValue("seo.ogImageMediaId", selectedOgMedia.id, { shouldDirty: true })
    }
    if (aiContentHtml) {
      const contentHtmlWithImages = insertAiSelectedImagesIntoHtml(
        aiContentHtml,
        aiResult?.selectedMedia,
        mediaById
      )
      setValue("content", isSeoTask
        ? composeAiSeoContentBlocks(contentHtmlWithImages)
        : composeAiContentBlocks(
            contentHtmlWithImages,
            aiResult?.title || preview.title
          ), {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    applyAiSeo()
    setFeedback({
      message: isSeoTask
        ? aiContentHtml
          ? "Đã áp dụng phần sửa điểm SEO vào nội dung."
          : "Đã áp dụng gợi ý SEO từ AI."
        : aiContentHtml
          ? "Đã áp dụng bản tối ưu bài viết và ảnh AI."
          : "Đã áp dụng gợi ý tối ưu bài viết.",
      tone: "success",
    })
  }

  const appendAiContent = () => {
    const nextBlocks = splitContentToBlocks(preview.content)
    const initialBlockCount = nextBlocks.length

    if (aiResult?.outline?.length) {
      nextBlocks.push(...splitOutlineIntoContentBlocks(aiResult.outline))
    }

    if (aiResult?.faqs?.length) {
      nextBlocks.push(wrapHtmlAsBlock(
        `<h2>Câu hỏi thường gặp</h2>${aiResult.faqs
          .map((faq) => `<h3>${faq.question}</h3><p>${faq.answer}</p>`)
          .join("")}`,
        "content"
      ))
    }

    if (aiResult?.internalLinks?.length) {
      nextBlocks.push(wrapHtmlAsBlock(
        `<h2>Gợi ý liên quan</h2><ul>${aiResult.internalLinks
          .map((link) => `<li><a href="${link.url}">${link.label}</a></li>`)
          .join("")}</ul>`,
        "content"
      ))
    }

    if (nextBlocks.length === initialBlockCount) return

    setValue("content", mergeBlocksToContent(nextBlocks), { shouldDirty: true, shouldValidate: true })
    setFeedback({ message: "Đã chèn phần gợi ý AI vào cuối bài.", tone: "success" })
  }

  const savePostWithStatus = async (status: ContentStatusType) => {
    const currentValues = getValues()
    const payload = normalizePayload(
      {
        ...currentValues,
        status,
      },
      {
        focusKeyword: focusKeyword.trim(),
        seoScore: seoResult?.score ?? null,
        analysisJson: seoResult ?? null,
      }
    )

    if (activePostId) {
      const updated = await blogService.updatePost(activePostId, payload)
      setPost(updated)
      setLastAutoSaved(new Date())
      return updated
    }

    const created = await blogService.createPost(payload)
    setPost(created)
    setAutoDraftPostId(created.id)
    setLastAutoSaved(new Date())
    router.replace(`/blog/${created.id}`)
    return created
  }

  const togglePublishStatus = async () => {
    const nextStatus =
      selectedStatus === ContentStatus.PUBLISHED
        ? ContentStatus.DRAFT
        : ContentStatus.PUBLISHED

    try {
      setIsSaving(true)
      setFeedback(null)
      setValue("status", nextStatus, { shouldDirty: true })
      await savePostWithStatus(nextStatus)
      setFeedback({
        message:
          nextStatus === ContentStatus.PUBLISHED
            ? "Bài viết đã được công khai."
            : "Bài viết đã chuyển về nháp.",
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to update publish status", error)
      setFeedback({
        message: "Chưa đổi được trạng thái bài viết.",
        tone: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmit = async (data: CreateBlogPostPayload) => {
    try {
      setIsSaving(true)
      setFeedback(null)

      const payload = normalizePayload(data, {
        focusKeyword: focusKeyword.trim(),
        seoScore: seoResult?.score ?? null,
        analysisJson: seoResult ?? null,
      })

      const saved = activePostId
        ? await blogService.updatePost(activePostId, payload)
        : await blogService.createPost(payload)

      setPost(saved)
      setLastAutoSaved(new Date())

      if (!activePostId) {
        setAutoDraftPostId(saved.id)
        router.replace(`/blog/${saved.id}`)
      }

      setFeedback({
        message: "Đã lưu bài viết.",
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to save blog post", error)
      setFeedback({
        message: "Chưa lưu được bài viết. Kiểm tra nội dung/API rồi thử lại.",
        tone: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.defaultPrevented || event.nativeEvent.isComposing) {
      return
    }

    const target = event.target as HTMLElement | null
    if (!target) return

    const tagName = target.tagName
    const inputType = target instanceof HTMLInputElement ? target.type : ""
    const allowsEnter =
      tagName === "TEXTAREA" ||
      tagName === "BUTTON" ||
      inputType === "submit" ||
      target.isContentEditable ||
      Boolean(target.closest('[contenteditable="true"], .ProseMirror, [role="textbox"]'))

    if (allowsEnter) {
      return
    }

    event.preventDefault()
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 p-10 text-muted-foreground">
        <IconLoader2 className="animate-spin" />
        <span>Đang tải bài viết...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="min-h-full ">
      {feedback ? (
        <div className="fixed right-4 top-4 z-[80] w-[min(420px,calc(100vw-32px))]">
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur",
              feedbackToastClassName(feedback.tone)
            )}
            role="status"
            aria-live="polite"
          >
            <span className="min-w-0 flex-1 leading-6">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-white/70 hover:text-current"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <div className="sticky top-0 z-30 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-stone-500 hover:bg-orange-50 hover:text-orange-700"
              asChild
              aria-label="Quay lại"
            >
              <Link href="/blog">
                <IconArrowLeft />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <Link href="/blog" className="hover:text-orange-700">
                  Blog
                </Link>
                <span>/</span>
                <span>{isNew ? "Bài viết mới" : "Chỉnh sửa"}</span>
              </div>
              <h1 className="mt-1 truncate text-base font-semibold text-stone-950">
                {isNew ? "Tạo bài viết" : "Chỉnh sửa bài viết"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              onClick={() => setIsPreviewOpen(true)}
            >
              <IconEye className="size-4" />
              Xem trước
            </Button>
            {!isNew ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                onClick={fetchPost}
                disabled={isSaving}
              >
                <IconRefresh className="size-4" />
                Tải lại
              </Button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsSeoDrawerOpen(true)}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-full"
              aria-label="Mở bảng SEO"
            >
            {seoResult ? (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                seoResult.color === "green" && "bg-green-50 text-green-700",
                seoResult.color === "orange" && "bg-orange-50 text-orange-700",
                seoResult.color === "red" && "bg-red-50 text-red-700",
              )}>
                SEO {seoResult.score}/100
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                SEO —
              </span>
            )}
            </button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              className={cn(
                "gap-2 rounded-full",
                selectedStatus === ContentStatus.PUBLISHED
                  ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
              )}
              onClick={togglePublishStatus}
            >
              <IconCheck className="size-4" />
              {selectedStatus === ContentStatus.PUBLISHED ? "Đang công khai" : "Công khai"}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="gap-2 rounded-full bg-orange-600 text-white hover:bg-orange-700"
            >
              {isSaving ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconDeviceFloppy className="size-4" />
              )}
              {isSaving ? "Đang lưu" : "Cập nhật"}
            </Button>
            {lastAutoSaved && (
              <span className="text-xs text-stone-400">
                Đã tự động lưu lúc {lastAutoSaved.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <section className="mx-auto max-w-[1060px]">
            {/* <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-800 shadow-sm">
              Bản đang soạn sẽ lưu vào hệ thống Blog Duky. Khi chuyển trạng thái công khai, bài viết sẽ có thể hiển thị trên storefront.
            </div> */}

            <div className="rounded-t-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                <div>
                  <Input
                    {...register("title")}
                    placeholder="Nhập tiêu đề bài viết"
                    className="h-12 rounded-xl border-stone-300 bg-white px-3 text-xl font-semibold tracking-tight shadow-none focus-visible:border-orange-400 focus-visible:ring-orange-200 md:text-[18px]"
                    aria-invalid={Boolean(errors.title)}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <Textarea
                    {...register("excerpt")}
                    placeholder="Nhập mô tả ngắn để hiển thị ở danh sách bài viết và SEO..."
                    className="min-h-16 resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-6 text-stone-700 shadow-none focus-visible:ring-0"
                  />
                </div>

                <input type="hidden" {...register("slug")} />
                <div className="flex min-w-0 items-center gap-2 rounded-xl px-3  text-sm">
                  <span className="shrink-0 text-stone-500">Slug:/</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-orange-500">
                    {generatedSlug || "bai-viet"}
                  </span>
                </div>
                <FieldError message={errors.slug?.message} />
              </div>
            </div>

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <BlogRichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  blockControls={{
                    addPostTitleBlock,
                    addContentBlock: () => insertContentBlock("<p>Nội dung block mới...</p>"),
                    addContactFooterBlock,
                    addTocBlock,
                    moveBlock,
                    removeBlock,
                    replaceBlock,
                    getAiContext: getBlockAiContext,
                    reusableBlocks,
                    currentTitle: preview.title ?? "",
                    onSelectReusableBlock: (blockId) => {
                      const selected = reusableBlocks.find((item) => item.id === blockId)
                      if (!selected) return
                      const nextBlocks = [
                        ...splitContentToBlocks(preview.content),
                        ...splitContentToBlocks(
                          isBlockWrapperHtml(selected.html)
                            ? selected.html
                            : wrapHtmlAsBlock(
                                selected.html,
                                toEditorBlockType(selected.type)
                              )
                        ),
                      ]
                      setValue("content", mergeBlocksToContent(nextBlocks), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    },
                    onSaveReusableBlock: openSaveReusableBlockDialog,
                  }}
                />
              )}
            />
            <FieldError message={errors.content?.message} />
          </section>

          <section className="mx-auto mt-5 flex max-w-[1060px] flex-col gap-3">
            {/* <MetaBox title="Tóm tắt nhanh">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase text-stone-500">Tiêu đề</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {preview.title?.length ?? 0} kí tự
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase text-stone-500">Mô tả</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {preview.excerpt?.length ?? 0} kí tự
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase text-stone-500">Tags</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {selectedTagIds.length} tag đã chọn
                  </p>
                </div>
              </div>
            </MetaBox> */}

            <MetaBox title="Rank Math SEO">
              <div className="space-y-4">
                <SeoScoringPanel result={seoResult} />

                <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Xem trước kết quả tìm kiếm</p>
                  <p className="truncate text-xs text-green-700">
                    {storefrontPath(`/blog/${generatedSlug}`)}
                  </p>
                  <p className="mt-0.5 truncate text-lg font-medium text-blue-700 hover:underline">
                    {preview.seo?.metaTitle || preview.title || "Tiêu đề SEO sẽ hiển thị ở đây"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                    {preview.seo?.metaDescription || preview.excerpt || "Mô tả SEO sẽ hiển thị ở đây. Google thường hiển thị 150-160 ký tự."}
                  </p>
                </div>

                {/* Facebook Share Preview */}
                <div className="rounded-2xl border border-stone-200 bg-white text-sm overflow-hidden">
                  <p className="px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-stone-400">Xem trước khi share Facebook</p>
                  <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-stone-200">
                    {coverUrl ? (
                      <div className="h-40 w-full bg-stone-100">
                        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-xs text-stone-400">
                        Chưa có ảnh đại diện
                      </div>
                    )}
                    <div className="border-t border-stone-200 bg-stone-50 px-3 py-2">
                      <p className="text-[11px] uppercase text-stone-400">dukystore.com</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-stone-900">
                        {preview.seo?.ogTitle || preview.seo?.metaTitle || preview.title || "Tiêu đề bài viết"}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                        {preview.seo?.ogDescription || preview.seo?.metaDescription || preview.excerpt || "Mô tả bài viết sẽ hiển thị ở đây"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SEO Length Indicators */}
                <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  {(() => {
                    const titleLen = (preview.seo?.metaTitle || preview.title || "").length
                    const slugLen = generatedSlug.length
                    const descLen = (preview.seo?.metaDescription || preview.excerpt || "").length
                    const titleMax = 60
                    const slugMax = 75
                    const descMax = 160
                    const getColor = (len: number, max: number) => len <= max ? "bg-green-500" : "bg-red-500"
                    const getTextColor = (len: number, max: number) => len <= max ? "text-green-700" : "text-red-600"
                    return (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-stone-700">Tiêu đề</span>
                            <span className={getTextColor(titleLen, titleMax)}>{titleLen} / {titleMax}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                            <div className={`h-full rounded-full transition-all ${getColor(titleLen, titleMax)}`} style={{ width: `${Math.min((titleLen / titleMax) * 100, 100)}%` }} />
                          </div>
                          {titleLen > titleMax && <p className="text-xs text-red-600">⚠ Tiêu đề quá dài, Google sẽ cắt bớt. Nên ≤ 60 ký tự.</p>}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-stone-700">URL slug</span>
                            <span className={getTextColor(slugLen, slugMax)}>{slugLen} / {slugMax}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                            <div className={`h-full rounded-full transition-all ${getColor(slugLen, slugMax)}`} style={{ width: `${Math.min((slugLen / slugMax) * 100, 100)}%` }} />
                          </div>
                          {slugLen > slugMax && <p className="text-xs text-red-600">⚠ URL quá dài. Nên ≤ 75 ký tự.</p>}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-stone-700">Mô tả</span>
                            <span className={getTextColor(descLen, descMax)}>{descLen} / {descMax}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                            <div className={`h-full rounded-full transition-all ${getColor(descLen, descMax)}`} style={{ width: `${Math.min((descLen / descMax) * 100, 100)}%` }} />
                          </div>
                          {descLen > descMax && <p className="text-xs text-red-600">⚠ Mô tả quá dài, Google sẽ cắt bớt. Nên ≤ 160 ký tự.</p>}
                          {descLen > 0 && descLen < 120 && <p className="text-xs text-orange-600">⚠ Mô tả hơi ngắn. Nên viết 120-160 ký tự để tối ưu CTR.</p>}
                        </div>
                      </>
                    )
                  })()}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Tiêu đề SEO</Label>
                      <span className="text-xs text-stone-400">{(preview.seo?.metaTitle || preview.title || "").length} / 60</span>
                    </div>
                    <Input
                      {...register("seo.metaTitle")}
                      placeholder={preview.title || "Tự động lấy tiêu đề bài viết"}
                      className="rounded-xl border-stone-300 focus-visible:ring-orange-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL chuẩn (Canonical)</Label>
                    <Input
                      {...register("seo.canonicalUrl")}
                      placeholder="https://..."
                      className="rounded-xl border-stone-300 font-mono text-xs focus-visible:ring-orange-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mô tả SEO</Label>
                    <span className="text-xs text-stone-400">{(preview.seo?.metaDescription || preview.excerpt || "").length} / 160</span>
                  </div>
                  <Textarea
                    {...register("seo.metaDescription")}
                    placeholder={preview.excerpt || "Tự động lấy mô tả ngắn của bài viết"}
                    className="min-h-20 rounded-xl border-stone-300 focus-visible:ring-orange-200"
                  />
                </div>
              </div>
            </MetaBox>

          
          </section>
        </main>

        <aside className="flex min-w-0 flex-col gap-3">
          <Panel title="Ảnh đại diện" icon={<IconPhoto className="size-4" />}>
            <input type="hidden" {...register("coverMediaId")} />
            {coverUrl ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                <img
                  src={coverUrl}
                  alt={preview.title || "Ảnh ���ại di�!n bҠi viết"}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                <IconPlus className="size-5" />
                Chọn ảnh bài viết
              </button>
            )}
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-stone-300 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => setIsMediaPickerOpen(true)}
              >
                Chọn ảnh
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => {
                  setCoverUrl("")
                  setValue("coverMediaId", "", { shouldDirty: true })
                  setValue("seo.ogImageMediaId", "", { shouldDirty: true })
                }}
                aria-label="Xҳa ảnh ���ại di�!n"
              >
                <IconTrash />
              </Button>
            </div>
          </Panel>

          <Panel title="Từ khóa SEO" icon={<IconSearch className="size-4" />}>
            <div className="space-y-3">
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-green-100">
                {seoKeywords.map((keyword, index) => {
                  const isPrimary = index === 0
                  return (
                    <span
                      key={`${keyword}-${index}`}
                      className={cn(
                        "inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        isPrimary
                          ? "bg-green-300 text-green-800"
                          : "bg-orange-200/80 text-orange-700"
                      )}
                    >
                      <span className="truncate">{keyword}</span>
                      {isPrimary && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] uppercase bg-green-200 text-green-900"
                          )}
                        >
                          {isPrimary ? "Chính" : ""}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSeoKeyword(index)}
                        className={cn(
                          "inline-flex size-4 shrink-0 items-center justify-center rounded-full",
                          isPrimary ? "hover:bg-green-200" : "hover:bg-stone-200"
                        )}
                        aria-label={`Xoa tu khoa ${keyword}`}
                      >
                        <IconX className="size-3" />
                      </button>
                    </span>
                  )
                })}
                <input
                  value={seoKeywordInput}
                  onChange={(event) => setSeoKeywordInput(event.target.value)}
                  onKeyDown={handleSeoKeywordKeyDown}
                  onBlur={addSeoKeyword}
                  placeholder={seoKeywords.length ? "Thêm từ khóa phụ..." : "Nhập từ khóa chính + Enter"}
                  className="min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 rounded-lg bg-orange-50 text-orange-700 ring-1 ring-orange-100 hover:bg-orange-100 hover:text-orange-800"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={suggestSeoKeywords}
                  disabled={isKeywordAiLoading}
                  aria-label="AI gợi ý từ khóa SEO"
                  title="AI gợi ý từ khóa SEO"
                >
                  {isKeywordAiLoading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconWand className="size-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs leading-5 text-stone-500">
                Nên có 1 từ khóa chính. Thêm 2-5 từ khóa phụ nếu bài cần mở rộng ngữ nghĩa.
              </p>

              {primaryKeywordWarning ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  {primaryKeywordWarning}
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Trợ lý AI" icon={<IconSeo className="size-4" />}>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tác vụ</Label>
                <Select value={aiTask} onValueChange={(value) => setAiTask(value as BlogAiTask)}>
                  <SelectTrigger className="w-full rounded-xl border-stone-300 focus:ring-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(Object.keys(BLOG_AI_TASK_LABELS) as BlogAiTask[]).map((task) => (
                        <SelectItem key={task} value={task}>
                          {BLOG_AI_TASK_LABELS[task]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-stone-500">{BLOG_AI_TASK_HINTS[aiTask]}</p>
              </div>

              <div className="grid gap-2">
                <Input
                  value={aiArticleType}
                  onChange={(event) => setAiArticleType(event.target.value)}
                  placeholder="Loại bài: review, hướng dẫn, so sánh..."
                  className="h-9 rounded-xl border-stone-300 text-sm focus-visible:ring-orange-200"
                />
                <Input
                  value={aiTone}
                  onChange={(event) => setAiTone(event.target.value)}
                  placeholder="Tone bài viết"
                  className="h-9 rounded-xl border-stone-300 text-sm focus-visible:ring-orange-200"
                />
              </div>

              <Button
                type="button"
                className="w-full gap-2 rounded-xl bg-stone-950 text-white hover:bg-stone-800"
                onClick={runBlogAi}
                disabled={isAiLoading}
              >
                {isAiLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconSeo className="size-4" />}
                {isAiLoading ? "AI đang xử lý" : "Tạo gợi ý AI"}
              </Button>

              {aiResult ? (
                <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-900">Kết quả AI</p>
                    {aiResult.summary ? (
                      <p className="text-xs leading-5 text-stone-600">{aiResult.summary}</p>
                    ) : null}
                  </div>

                  {aiResult.improvements?.length ? (
                    <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-stone-700">
                      {aiResult.improvements.slice(0, 4).map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}

                  {aiResult.outline?.length ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-stone-500">Dàn ý</p>
                      <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-stone-700">
                        {aiResult.outline.slice(0, 8).map((item, index) => (
                          <li key={`${item}-${index}`}>{getOutlineDisplayText(item)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {aiContentHtml ? (
                    <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs leading-5 text-green-800">
                      AI đã tạo bản nội dung tối ưu để thay vào bài hiện tại.
                    </div>
                  ) : null}

                  {aiResult.internalLinks?.length ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-stone-500">Internal link</p>
                      {aiResult.internalLinks.slice(0, 4).map((link, index) => (
                        <a
                          key={`${link.url}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg px-2 py-1 text-xs text-stone-700 transition hover:bg-white hover:text-orange-700"
                        >
                          <span className="font-medium">{link.label}</span>
                          <span className="block truncate text-stone-400">{link.url}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {aiResult.imageAlts?.length ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-stone-500">Alt ảnh</p>
                      {aiResult.imageAlts.slice(0, 3).map((image, index) => (
                        <p key={`${image.alt}-${index}`} className="text-xs text-stone-700">
                          {image.alt}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl bg-white text-xs"
                      onClick={() => setIsAiPreviewOpen(true)}
                      disabled={!aiContentHtml}
                    >
                      Xem bài AI
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-orange-600 text-xs text-white hover:bg-orange-700"
                      onClick={aiTask === "OUTLINE" ? appendAiContent : applyAiOptimization}
                      disabled={
                        aiTask === "OUTLINE"
                          ? !aiResult.outline?.length
                          : !aiResult.title && !aiResult.excerpt && !aiContentHtml && !aiResult.seo
                      }
                    >
                      {aiTask === "OUTLINE" ? "Chèn dàn ý" : aiContentHtml ? "Tối ưu" : "Áp dụng"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Xuất bản" icon={<IconFileText className="size-4" />}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chuyên mục</Label>
                <Controller
                  name="categoryIds"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.[0] ?? NO_CATEGORY}
                      onValueChange={(value) =>
                        field.onChange(value === NO_CATEGORY ? [] : [value])
                      }
                    >
                  <SelectTrigger className="w-full rounded-xl border-stone-300 focus:ring-orange-200">
                        <SelectValue placeholder="Chọn chuyên mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={NO_CATEGORY}>Chọn phân loại</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl border-stone-300 focus:ring-orange-200">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={ContentStatus.DRAFT}>Tin nháp</SelectItem>
                          <SelectItem value={ContentStatus.PUBLISHED}>Công khai</SelectItem>
                          <SelectItem value={ContentStatus.HIDDEN}>Ẩn</SelectItem>
                          <SelectItem value={ContentStatus.ARCHIVED}>Lưu trữ</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {/* <Badge className={cn("border font-medium", statusBadgeClassName(selectedStatus))}>
                  {statusLabels[selectedStatus]}
                </Badge> */}
                <p className="text-xs text-orange-500">{statusHints[selectedStatus]}</p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-500">Ngày đăng</span>
                  <span className="text-right font-medium text-stone-800">
                    {formatDate(post?.publishedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-500">Tác giả</span>
                  <span className="truncate text-right font-medium text-stone-800">
                    {post?.author?.fullName || post?.author?.email || "admin"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-500">Cập nhật</span>
                  <span className="text-right font-medium text-stone-800">
                    {formatDate(post?.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* <Panel title="Thảo luận" icon={<IconFileText className="size-4" />} defaultOpen={false}>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                <input type="checkbox" defaultChecked className="accent-orange-600" />
                Cho pho phép bình luận
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                <input type="checkbox" defaultChecked className="accent-orange-600" />
                Hiển thị bài viết liên quan
              </label>
            </div>
          </Panel> */}

          <Panel title="Tags" icon={<IconSearch className="size-4" />} defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  id="new-tag-input"
                  placeholder="Tạo tag mới..."
                  className="h-8 rounded-lg text-xs"
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return
                    e.preventDefault()
                    e.stopPropagation()
                    const input = e.currentTarget
                    const name = input.value.trim()
                    if (!name) return
                    try {
                      const newTag = await tagService.createTag({ name, slug: slugify(name), type: "BLOG" })
                      setTags((prev) => [...prev, newTag])
                      toggleTag(newTag.id, true)
                      input.value = ""
                    } catch {
                      // Tag may already exist
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-lg px-2"
                  onClick={async () => {
                    const input = document.getElementById("new-tag-input") as HTMLInputElement
                    if (!input) return
                    const name = input.value.trim()
                    if (!name) return
                    try {
                      const newTag = await tagService.createTag({ name, slug: slugify(name), type: "BLOG" })
                      setTags((prev) => [...prev, newTag])
                      toggleTag(newTag.id, true)
                      input.value = ""
                    } catch {
                      // Tag may already exist
                    }
                  }}
                >
                  <IconPlus className="size-3.5" />
                </Button>
              </div>
              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {tags.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có tag blog.</p>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm transition hover:border-orange-200 hover:bg-orange-50"
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => toggleTag(tag.id, Boolean(checked))}
                      />
                      <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-stone-400">Nhập tên tag + Enter để tạo mới</p>
            </div>
          </Panel>
        </aside>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Xem trước bài viết</DialogTitle>
            <DialogDescription>
              Preview nhanh nội dung trước khi lưu lên backend.
            </DialogDescription>
          </DialogHeader>
          <article className="mx-auto flex max-w-3xl flex-col gap-6">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={preview.title || "Ảnh đại diện bài viết"}
                className="aspect-[16/8] w-full rounded-2xl object-cover"
              />
            ) : null}
            <header className="flex flex-col gap-3">
              <Badge
                variant="secondary"
                className={cn("w-fit border", statusBadgeClassName(selectedStatus))}
              >
                {statusLabels[selectedStatus]}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                {preview.title || "Tiêu đề bài viết"}
              </h2>
              <p className="text-muted-foreground">
                {preview.excerpt || "Mô tả ngắn sẽ hiển thị ở đây."}
              </p>
            </header>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Google preview</p>
              <p className="mt-2 text-base text-primary">
                {preview.seo?.metaTitle || preview.title || "Meta title"}
              </p>
              <p className="text-sm text-slate-500">
                {preview.seo?.metaDescription || preview.excerpt || "Meta description"}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">/blog/{generatedSlug}</p>
            </div>

            <div
              className="prose prose-sm max-w-none rounded-2xl border bg-white p-6 leading-7 [&_code]:font-semibold [&_code]:text-orange-500 [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:text-inherit [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-semibold [&_pre_code]:text-orange-500"
              dangerouslySetInnerHTML={{
                __html: publishPreviewHtml || "<p>Nội dung bài viết sẽ hiển thị ở đây.</p>",
              }}
            />
          </article>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiPreviewOpen} onOpenChange={setIsAiPreviewOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Xem bài viết AI tạo</DialogTitle>
            <DialogDescription>
              Xem bản AI đề xuất trước khi áp dụng vào bài viết hiện tại.
            </DialogDescription>
          </DialogHeader>
          <article className="mx-auto flex max-w-3xl flex-col gap-6">
            {aiSelectedCoverUrl || coverUrl ? (
              <img
                src={aiSelectedCoverUrl || coverUrl}
                alt={aiResult?.title || preview.title || "Ảnh đại diện bài viết"}
                className="aspect-[16/8] w-full rounded-2xl object-cover"
              />
            ) : null}
            <header className="flex flex-col gap-3">
              <Badge variant="secondary" className="w-fit border border-orange-200 bg-orange-50 text-orange-700">
                AI preview
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                {aiResult?.title || preview.title || "Tiêu đề bài viết AI"}
              </h2>
              <p className="text-muted-foreground">
                {aiResult?.excerpt || preview.excerpt || "Mô tả ngắn AI đề xuất sẽ hiển thị ở đây."}
              </p>
            </header>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Google preview AI</p>
              <p className="mt-2 text-base text-primary">
                {aiResult?.seo?.metaTitle || aiResult?.title || preview.seo?.metaTitle || preview.title || "Meta title"}
              </p>
              <p className="text-sm text-slate-500">
                {aiResult?.seo?.metaDescription || aiResult?.excerpt || preview.seo?.metaDescription || preview.excerpt || "Meta description"}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                /blog/{slugify(aiResult?.slug || aiResult?.title || preview.title || "bai-viet")}
              </p>
            </div>

            <div
              className="prose prose-sm max-w-none rounded-2xl border bg-white p-6 leading-7 [&_code]:font-semibold [&_code]:text-orange-500 [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:text-inherit [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-semibold [&_pre_code]:text-orange-500"
              dangerouslySetInnerHTML={{
                __html: aiPreviewHtml || "<p>AI chưa tạo nội dung bài viết mới.</p>",
              }}
            />

            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white/95 py-3 backdrop-blur">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsAiPreviewOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => {
                  applyAiOptimization()
                  setIsAiPreviewOpen(false)
                }}
                disabled={!aiResult?.title && !aiResult?.excerpt && !aiResult?.contentHtml && !aiResult?.seo}
              >
                Áp dụng bài AI
              </Button>
            </div>
          </article>
        </DialogContent>
      </Dialog>

      <Dialog
        open={saveBlockDialog.open}
        onOpenChange={(open) => {
          if (!open) closeSaveReusableBlockDialog()
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Lưu reusable block</DialogTitle>
            <DialogDescription>
              Block sẽ được lưu toàn cục để các bài viết khác có thể chèn lại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              Loại block: {blockTypeLabel(saveBlockDialog.type)}
            </div>
            <div className="space-y-2">
              <Label>Tên block</Label>
              <Input
                value={saveBlockDialog.name}
                onChange={(event) =>
                  setSaveBlockDialog((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="rounded-xl border-stone-300 focus-visible:ring-orange-200"
                placeholder="VD: Footer liên hệ Duky"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={saveBlockDialog.description}
                onChange={(event) =>
                  setSaveBlockDialog((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-28 rounded-xl border-stone-300 focus-visible:ring-orange-200"
                placeholder="Ghi chú ngắn để admin biết block này dùng cho trường hợp nào."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={closeSaveReusableBlockDialog}
                disabled={saveBlockDialog.isSaving}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className="rounded-full bg-orange-600 hover:bg-orange-700"
                onClick={submitReusableBlock}
                disabled={saveBlockDialog.isSaving}
              >
                {saveBlockDialog.isSaving ? "Đang lưu..." : "Lưu block"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(media) => {
          setValue("coverMediaId", media.id, { shouldDirty: true })
          setValue("seo.ogImageMediaId", media.id, { shouldDirty: true })
          setCoverUrl(media.url)
        }}
        title="Chọn ảnh đại diện bài viết"
      />

      {/* SEO Slide-over Drawer */}
      {isSeoDrawerOpen && (
        <div
          className="fixed top-0 right-0 z-50 h-full w-[420px] max-w-[90vw] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto border-l border-stone-200"
          role="complementary"
          aria-label="SEO Panel"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsSeoDrawerOpen(false)
          }}
        >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
              <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                <IconSeo className="size-5 text-orange-600" />
                SEO
              </h2>
              <button
                type="button"
                onClick={() => setIsSeoDrawerOpen(false)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label="Đóng bảng SEO"
                autoFocus
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-5">
              <SeoScoringPanel result={seoResult} />

              {/* Snippet Preview */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Xem trước kết quả tìm kiếm</p>
                <p className="truncate text-xs text-green-700">
                  {storefrontPath(`/blog/${generatedSlug}`)}
                </p>
                <p className="mt-0.5 truncate text-lg font-medium text-blue-700 hover:underline">
                  {preview.seo?.metaTitle || preview.title || "Tiêu đề SEO sẽ hiển thị ở đây"}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                  {preview.seo?.metaDescription || preview.excerpt || "Mô tả SEO sẽ hiển thị ở đây. Google thường hiển thị 150-160 ký tự."}
                </p>
              </div>

              {/* Facebook Share Preview */}
              <div className="rounded-2xl border border-stone-200 bg-white text-sm overflow-hidden">
                <p className="px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-stone-400">Xem trước khi share Facebook</p>
                <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-stone-200">
                  {coverUrl ? (
                    <div className="h-36 w-full bg-stone-100">
                      <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-stone-100 text-xs text-stone-400">
                      Chưa có ảnh đại diện
                    </div>
                  )}
                  <div className="border-t border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-[11px] uppercase text-stone-400">dukystore.com</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-stone-900">
                      {preview.seo?.ogTitle || preview.seo?.metaTitle || preview.title || "Tiêu đề bài viết"}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                      {preview.seo?.ogDescription || preview.seo?.metaDescription || preview.excerpt || "Mô tả bài viết"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SEO Length Indicators */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                {(() => {
                  const titleLen = (preview.seo?.metaTitle || preview.title || "").length
                  const slugLen = generatedSlug.length
                  const descLen = (preview.seo?.metaDescription || preview.excerpt || "").length
                  const titleMax = 60
                  const slugMax = 75
                  const descMax = 160
                  const getColor = (len: number, max: number) => len <= max ? "bg-green-500" : "bg-red-500"
                  const getTextColor = (len: number, max: number) => len <= max ? "text-green-700" : "text-red-600"
                  return (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-700">Tiêu đề</span>
                          <span className={getTextColor(titleLen, titleMax)}>{titleLen} / {titleMax}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                          <div className={`h-full rounded-full transition-all ${getColor(titleLen, titleMax)}`} style={{ width: `${Math.min((titleLen / titleMax) * 100, 100)}%` }} />
                        </div>
                        {titleLen > titleMax && <p className="text-xs text-red-600">⚠ Tiêu đề quá dài, Google sẽ cắt bớt. Nên ≤ 60 ký tự.</p>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-700">URL slug</span>
                          <span className={getTextColor(slugLen, slugMax)}>{slugLen} / {slugMax}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                          <div className={`h-full rounded-full transition-all ${getColor(slugLen, slugMax)}`} style={{ width: `${Math.min((slugLen / slugMax) * 100, 100)}%` }} />
                        </div>
                        {slugLen > slugMax && <p className="text-xs text-red-600">⚠ URL quá dài. Nên ≤ 75 ký tự.</p>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-700">Mô tả</span>
                          <span className={getTextColor(descLen, descMax)}>{descLen} / {descMax}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                          <div className={`h-full rounded-full transition-all ${getColor(descLen, descMax)}`} style={{ width: `${Math.min((descLen / descMax) * 100, 100)}%` }} />
                        </div>
                        {descLen > descMax && <p className="text-xs text-red-600">⚠ Mô tả quá dài, Google sẽ cắt bớt. Nên ≤ 160 ký tự.</p>}
                        {descLen > 0 && descLen < 120 && <p className="text-xs text-orange-600">⚠ Mô tả hơi ngắn. Nên viết 120-160 ký tự để tối ưu CTR.</p>}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Meta Inputs */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tiêu đề SEO</Label>
                    <span className="text-xs text-stone-400">{(preview.seo?.metaTitle || preview.title || "").length} / 60</span>
                  </div>
                  <Input
                    {...register("seo.metaTitle")}
                    placeholder={preview.title || "Tự động lấy tiêu đề bài viết"}
                    className="rounded-xl border-stone-300 focus-visible:ring-orange-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL chuẩn (Canonical)</Label>
                  <Input
                    {...register("seo.canonicalUrl")}
                    placeholder="https://..."
                    className="rounded-xl border-stone-300 font-mono text-xs focus-visible:ring-orange-200"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mô tả SEO</Label>
                    <span className="text-xs text-stone-400">{(preview.seo?.metaDescription || preview.excerpt || "").length} / 160</span>
                  </div>
                  <Textarea
                    {...register("seo.metaDescription")}
                    placeholder={preview.excerpt || "Tự động lấy mô tả ngắn của bài viết"}
                    className="min-h-20 rounded-xl border-stone-300 focus-visible:ring-orange-200"
                  />
                </div>
              </div>

              {/* Table of Contents Preview */}
              {tocItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Mục lục</p>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <ul className="space-y-1">
                      {tocItems.map((item, index) => (
                        <li
                          key={`${item.id}-${index}`}
                          className="text-sm text-stone-700"
                          style={{ paddingLeft: item.level === 3 ? '16px' : '0' }}
                        >
                          <span className="text-stone-400 mr-1.5">{item.level === 2 ? '●' : '○'}</span>
                          <span className={item.level === 2 ? 'font-medium' : ''}>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-stone-400">{tocItems.length} heading được phát hiện</p>
                  </div>
                </div>
              )}

              {/* Internal Link Suggestions */}
              {internalLinkSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Gợi ý liên kết nội bộ</p>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <ul className="space-y-2">
                      {internalLinkSuggestions.map((suggestion) => (
                        <li key={suggestion.slug} className="flex items-center justify-between gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const link = storefrontPath(`/blog/${suggestion.slug}`)
                              navigator.clipboard.writeText(link)
                              setCopiedLink(link)
                              setTimeout(() => setCopiedLink(null), 3000)
                            }}
                            className="min-w-0 truncate text-left text-orange-700 hover:underline"
                            title="Click để copy link"
                          >
                            📋 {suggestion.title}
                          </button>
                          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                            {Math.round(suggestion.relevance * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-stone-400">Click để copy link • Dán vào nội dung bài viết</p>
                    {copiedLink && copiedLink.includes("/blog/") && (
                      <p className="mt-1 rounded-lg bg-green-50 px-2 py-1 text-xs text-green-700">✓ Đã copy</p>
                    )}
                  </div>
                </div>
              )}

              {/* Gợi ý sản phẩm liên quan */}
              {productSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Gợi ý sản phẩm</p>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <ul className="space-y-2">
                      {productSuggestions.map((product) => (
                        <li key={product.slug} className="flex items-center justify-between gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const link = storefrontPath(`/products/${product.slug}`)
                              navigator.clipboard.writeText(link)
                              setCopiedLink(link)
                              setTimeout(() => setCopiedLink(null), 3000)
                            }}
                            className="min-w-0 truncate text-left text-green-700 hover:underline"
                            title="Click để copy link sản phẩm"
                          >
                            🛒 {product.title}
                          </button>
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            {Math.round(product.relevance * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-stone-400">Click để copy link SP • Chèn vào bài để kêu gọi mua hàng</p>
                    {copiedLink && copiedLink.includes("/san-pham/") && (
                      <p className="mt-1 rounded-lg bg-green-50 px-2 py-1 text-xs text-green-700">✓ Đã copy</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </form>
  )
}
