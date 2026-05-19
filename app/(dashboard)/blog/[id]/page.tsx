"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Extension, mergeAttributes } from "@tiptap/core"
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
  IconPlus,
  IconRefresh,
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
  IconArrowBackUp,
  IconArrowForwardUp,
  IconLayoutAlignLeft,
  IconLayoutAlignCenter,
  IconLayoutAlignRight,
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
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
import { InlineFeedback } from "@/components/ui/inline-feedback"
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
  type BlogCategory,
  type BlogPostContentImage,
  type BlogPost,
} from "@/lib/api/schemas/blog.schema"
import { ContentStatus, TagType } from "@/lib/api/schemas/enums"
import type { Tag } from "@/lib/api/schemas/tag.schema"
import { blogService } from "@/lib/api/services/blog.service"
import { mediaService } from "@/lib/api/services/media.service"
import { tagService } from "@/lib/api/services/tag.service"
import { cn } from "@/lib/utils"

const NO_CATEGORY = "NO_CATEGORY"

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
        parseHTML: (element) => element.getAttribute("data-width") || element.style.width || "75%",
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") || "",
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const width = (HTMLAttributes.width as string | undefined) || "75%"
    const align = (HTMLAttributes.align as string | undefined) || "center"
    const marginStyle =
      align === "left"
        ? "margin-left:0;margin-right:auto;"
        : align === "right"
          ? "margin-left:auto;margin-right:0;"
          : "margin-left:auto;margin-right:auto;"

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-width": width,
        "data-align": align,
        "data-caption": (HTMLAttributes.caption as string | undefined) ?? "",
        style: `${marginStyle}width:${width};height:auto;display:block;`,
      }),
    ]
  },
})

const fontFamilies = [
  { label: "MÃ¡ÂºÂ·c Ã„â€˜Ã¡Â»â€¹nh", value: "" },
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

type Feedback = {
  message: string
  tone: "info" | "success" | "error"
}

type ReusableContentBlock = {
  id: string
  name: string
  html: string
  createdAt: string
}

const REUSABLE_BLOCKS_STORAGE_KEY = "duky_blog_reusable_blocks_v1"
const CONTENT_BLOCK_SEPARATOR = "<!-- duky-block -->"

const statusLabels: Record<string, string> = {
  [ContentStatus.PUBLISHED]: "CÒ´ng khai",
  [ContentStatus.DRAFT]: "Tin nhÒ¡p",
  [ContentStatus.HIDDEN]: "Ẩn",
  [ContentStatus.ARCHIVED]: "L� °u trá»¯",
}

const statusHints: Record<string, string> = {
  [ContentStatus.PUBLISHED]: "BÒ i viáº¿t hiá»�n thá»⬹ trÒªn website",
  [ContentStatus.DRAFT]: "Chá»⬰ l� °u trong há»⬡ thá»��ng quáº£n trá»⬹",
  [ContentStatus.HIDDEN]: "KhÒ´ng hiá»�n thá»⬹ ngoÒ i storefront",
  [ContentStatus.ARCHIVED]: "Giữ dữ li�!u, khҴng xuất bản",
}

const DEFAULT_NEW_BLOG_MOCK_TITLE = "Xu H� ��:ng ҁo Blazer Nữ 2026: Mặc Sao Cho Sang MҠ Vẫn D�& Ứng Dụng"
const DEFAULT_NEW_BLOG_MOCK_EXCERPT =
  "Tá»⬢ng há»£p xu h� °á»⬺ng blazer ná»¯ má»⬺i nháº¥t 2026, cÒ¡ch chá»n form theo dÒ¡ng ng� °á»i vÒ  gá»£i Ò½ phá»��i ���á»�S nhanh cho ���i lÒ m, ���i ch� ¡i, dá»± sá»± kiá»⬡n."
const DEFAULT_NEW_BLOG_MOCK_BODY_CONTENT = `<p>Òo blazer ná»¯ ���ang lÒ  item â���must-haveâ�� trong tá»§ ���á»�S cÒ´ng sá»Ÿ láº«n dáº¡o phá»��. N��m 2026, blazer khÒ´ng chá»⬰ dá»«ng á»Ÿ sá»± thanh lá»⬹ch mÒ  cÒ²n thiÒªn vá» tÒ­nh linh hoáº¡t: dá»⬦ phá»��i, dá»⬦ layer vÒ  há»£p nhiá»u hoÒ n cáº£nh.</p>
<h3>1. VҬ Sao Blazer Vẫn LҠ Item Chủ ��ạo?</h3>
<ul><li><strong>DÃ¡Â»â€¦ phÃ¡Â»â€˜i:</strong> Ã„â€˜i lÃƒÂ m, Ã„â€˜i gÃ¡ÂºÂ·p khÃƒÂ¡ch, Ã„â€˜i cafe Ã„â€˜Ã¡Â»Âu hÃ¡Â»Â£p.</li><li><strong>TÃƒÂ´n dÃƒÂ¡ng:</strong> tÃ¡ÂºÂ¡o khung vai gÃ¡Â»Ân, tÃ¡Â»â€¢ng thÃ¡Â»Æ’ chÃ¡Â»â€°n chu hÃ†Â¡n.</li><li><strong>Ã„Âa mÃƒÂ¹a:</strong> phÃ¡Â»â€˜i Ã„â€˜Ã†Â°Ã¡Â»Â£c cÃ¡ÂºÂ£ xuÃƒÂ¢n, thu, Ã„â€˜ÃƒÂ´ng nhÃ¡ÂºÂ¹.</li></ul>
<h3>2. 5 KiÃ¡Â»Æ’u Blazer Ã„ÂÃƒÂ¡ng Mua NhÃ¡ÂºÂ¥t</h3>
<ol><li><strong>Blazer form suҴng:</strong> hợp nhiều vҳc dҡng, d�& mặc hằng ngҠy.</li><li><strong>Blazer chiết eo:</strong> tҴn vҲng eo, hợp phong cҡch nữ tҭnh.</li><li><strong>Blazer oversize:</strong> trẻ trung, hợp style n��ng ������ng.</li><li><strong>Blazer tay lửng:</strong> nhẹ nhҠng, phҹ hợp mҹa nҳng.</li><li><strong>Blazer mҠu trung tҭnh:</strong> ���en, be, xҡm, navy d�& ph���i �����S.</li></ol>
<h3>3. GÃ¡Â»Â£i ÃƒÂ PhÃ¡Â»â€˜i Ã„ÂÃ¡Â»â€œ Nhanh</h3>
<p><strong>�i lÒ m:</strong> blazer + Ò¡o thun tr� ¡n + quáº§n tÒ¢y + loafer.</p>
<p><strong>�i ch� ¡i:</strong> blazer oversize + Ò¡o hai dÒ¢y + quáº§n jeans + sneaker.</p>
<p><strong>�i sá»± kiá»⬡n:</strong> blazer chiáº¿t eo + chÒ¢n vÒ¡y midi + giÒ y cao gÒ³t.</p>
<h3>4. Cҡch Chọn Blazer Theo Dҡng Ng� �ời</h3>
<ul><li><strong>Dҡng nhỏ:</strong> � �u tiҪn blazer vừa vai, chiều dҠi trҪn hҴng.</li><li><strong>Dҡng ���ầy ���ặn:</strong> chọn form suҴng, mҠu t���i, chất vải ���ứng.</li><li><strong>Dҡng cao:</strong> cҳ th�� thử oversize hoặc blazer dҠi.</li></ul>
<h3>5. Máº¹o Báº£o Quáº£n �á»� Blazer LuÒ´n �áº¹p</h3>
<ul><li>Dҹng mҳc treo cҳ ����!m ����� giữ phom vai.</li><li>Hạn chế giặt mҡy; � �u tiҪn giặt hấp hoặc giặt tay nhẹ.</li><li>Ủi h� �i �x nhi�!t ������ thấp ����� trҡnh bҳng mặt vải.</li></ul>
<h3>Kết Luận</h3>
<p>Blazer lҠ khoản ���ầu t� � thời trang thҴng minh vҬ tҭnh ứng dụng cao vҠ bền xu h� ��:ng. Ch�0 cần chọn ���Һng form, mҠu vҠ chất li�!u, anh/ch�9 cҳ th�� dҹng m���t chiếc blazer cho rất nhiều hoҠn cảnh khҡc nhau.</p>`

const DEFAULT_NEW_BLOG_MOCK_FOOTER_CONTENT = `<div style="margin-top:20px; border:1px solid #e5e7eb; border-radius:14px; padding:16px 18px; background:#fafaf9;">
  <h3 style="margin:0 0 10px 0; font-size:20px; font-weight:700; color:#1f2937;">ThÒ´ng Tin LiÒªn Há»⬡</h3>
  <p style="margin:0 0 8px 0; font-size:17px; font-weight:700; color:#111827;">Duky Store</p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">Ã°Å¸â€œÅ¾ Hotline: <a href="tel:0900000000" style="color:#ea580c; text-decoration:none;">0900 000 000</a></p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">â�⬰ï¸ Email: <a href="mailto:contact@duky.store" style="color:#ea580c; text-decoration:none;">contact@duky.store</a></p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">Ã°Å¸Å’Â Website: <a href="https://duky.store" target="_blank" rel="noopener noreferrer" style="color:#ea580c; text-decoration:none;">https://duky.store</a></p>
  <p style="margin:6px 0; color:#374151; line-height:1.7;">ðŸ�S �á»⬹a chá»⬰: 123 �� °á»ng ABC, Quáº­n XYZ, TP. Há»�S ChÒ­ Minh</p>
  <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #d6d3d1; color:#6b7280; font-size:13px;">CÃ¡ÂºÂ£m Ã†Â¡n bÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ theo dÃƒÂµi bÃƒÂ i viÃ¡ÂºÂ¿t. LiÃƒÂªn hÃ¡Â»â€¡ ngay Ã„â€˜Ã¡Â»Æ’ Ã„â€˜Ã†Â°Ã¡Â»Â£c tÃ†Â° vÃ¡ÂºÂ¥n nhanh vÃƒÂ  nhÃ¡ÂºÂ­n Ã†Â°u Ã„â€˜ÃƒÂ£i mÃ¡Â»â€ºi nhÃ¡ÂºÂ¥t.</div>
</div>`

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ã„â€˜/g, "d")
    .replace(/Ã„Â/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
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

function splitContentToBlocks(content?: string | null) {
  const raw = (content ?? "").trim()
  if (!raw) return []

  const bySeparator = raw
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean)
  if (bySeparator.length > 1) return bySeparator

  const wrappedBlocks = raw.match(
    /<blockquote[^>]*(?:data-duky-block="true"|data-duky-block)[^>]*>[\s\S]*?<\/blockquote>/gi
  )
  if (wrappedBlocks?.length) {
    return wrappedBlocks.map((block) => block.trim())
  }

  const labeledBlocks = raw.match(
    /<blockquote[^>]*>[\s\S]*?<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>[\s\S]*?<\/blockquote>/gi
  )
  if (labeledBlocks?.length) {
    return labeledBlocks.map((block) => block.trim())
  }

  return [raw]
}

function inferBlockTypeFromHtml(html: string): "title" | "content" | "footer" {
  const normalized = html.toLowerCase()
  if (normalized.includes("thÒ´ng tin liÒªn há»⬡") || normalized.includes("hotline:")) {
    return "footer"
  }
  if (normalized.startsWith("<h1") || normalized.startsWith("<h2") || normalized.startsWith("<h3")) {
    return "title"
  }
  return "content"
}

function blockTypeLabel(type: "title" | "content" | "footer") {
  if (type === "title") return "Block TiÒªu �á»"
  if (type === "footer") return "Block Footer"
  return "Block NÃ¡Â»â„¢i Dung"
}

function wrapHtmlAsBlock(html: string, type: "title" | "content" | "footer") {
  return `<blockquote data-duky-block="true" data-duky-block-type="${type}"><p><strong>${blockTypeLabel(type)}</strong></p>${html}</blockquote>`
}

function unwrapBlockHtml(blockHtml: string) {
  const normalized = blockHtml.trim()
  const matched = normalized.match(
    /^<blockquote[^>]*>\s*<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>\s*([\s\S]*?)\s*<\/blockquote>$/i
  )
  return matched ? matched[1].trim() : normalized
}

function flattenNestedBlockWrappers(html: string) {
  let next = html.trim()
  const nestedPattern =
    /<blockquote[^>]*>\s*<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>\s*(<blockquote[^>]*>[\s\S]*<\/blockquote>)\s*<\/blockquote>/i

  while (nestedPattern.test(next)) {
    next = next.replace(nestedPattern, "$1").trim()
  }

  return next
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

function mergeBlocksToContent(blocks: string[]) {
  return blocks
    .map((block) => flattenNestedBlockWrappers(block))
    .filter(Boolean)
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

function toHtmlDraftFromContent(content?: string | null) {
  const blocks = splitContentToBlocks(content).map((block) => prettyHtmlForEditor(unwrapBlockHtml(block)))
  return blocks.join(`\n${CONTENT_BLOCK_SEPARATOR}\n`).trim()
}

function toContentFromHtmlDraft(htmlDraft: string) {
  const rawBlocks = htmlDraft
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean)
  return mergeBlocksToContent(rawBlocks)
}

function prettyHtmlForEditor(html: string) {
  const minified = minifyHtmlForStorage(html)
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
    noIndex: seo.noIndex ?? false,
    noFollow: seo.noFollow ?? false,
  }

  const hasValue = Object.values(cleaned).some((value) =>
    typeof value === "boolean" ? value : Boolean(value)
  )

  return hasValue ? cleaned : undefined
}

function cleanContentImages(images?: CreateBlogPostPayload["contentImages"]) {
  if (!images?.length) return []

  return images
    .map((item, index) => ({
      mediaId: item.mediaId,
      sortOrder: item.sortOrder ?? index,
      altText: emptyToNull(item.altText),
      title: emptyToNull(item.title),
      caption: emptyToNull(item.caption),
      description: emptyToNull(item.description),
      credit: emptyToNull(item.credit),
      linkUrl: emptyToNull(item.linkUrl),
      isFeatured: item.isFeatured ?? index === 0,
    }))
    .filter((item) => Boolean(item.mediaId))
}

function normalizePayload(data: CreateBlogPostPayload): CreateBlogPostPayload {
  return {
    title: data.title.trim(),
    slug: emptyToNull(data.slug),
    excerpt: emptyToNull(data.excerpt),
    content: minifyHtmlForStorage(data.content.trim()),
    coverMediaId: emptyToNull(data.coverMediaId),
    status: data.status ?? ContentStatus.DRAFT,
    categoryIds: data.categoryIds ?? [],
    tagIds: data.tagIds ?? [],
    contentImages: cleanContentImages(data.contentImages),
    seo: cleanSeo(data.seo),
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Ch� °a cÒ³"

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
      className="group rounded-2xl border border-stone-200 bg-white shadow-sm"
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
  children,
  label,
  onClick,
}: {
  active?: boolean
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
      className={cn(
        "flex size-9 items-center justify-center rounded-xl text-stone-600 transition hover:bg-orange-50 hover:text-orange-700",
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
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl shadow-stone-900/10">
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
          aria-label={`Ã„ÂÃ¡Â»â€¢i nhanh ${label}`}
          title={`Ã„ÂÃ¡Â»â€¢i nhanh ${label}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={cycleColor}
          className="mx-1 size-6 rounded-full border border-white shadow-sm ring-1 ring-stone-200 transition hover:scale-105"
          style={{ backgroundColor: activeColor }}
        />
        <button
          type="button"
          aria-label={`Má»Ÿ báº£ng ${label}`}
          title={`Má»Ÿ báº£ng ${label}`}
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

function TableDropdown({ editor }: { editor: Editor | null }) {
  const isInTable = Boolean(editor?.isActive("table"))
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
          <span>ThÃƒÂªm cÃ¡Â»â„¢t bÃƒÂªn phÃ¡ÂºÂ£i</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().deleteRow().run()}
          className={tableActionClass}
        >
          <IconTableRow className="size-4" />
          <span>XÒ³a hÒ ng hiá»⬡n táº¡i</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().deleteColumn().run()}
          className={tableActionClass}
        >
          <IconTableColumn className="size-4" />
          <span>XÃƒÂ³a cÃ¡Â»â„¢t hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i</span>
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
  onInsertContentImage,
}: {
  value?: string | null
  onChange: (value: string) => void
  onInsertContentImage?: (image: BlogPostContentImage) => void
  blockControls?: {
    addPostTitleBlock: () => void
    addContentBlock: () => void
    addContactFooterBlock: () => void
    reusableBlocks: ReusableContentBlock[]
    onSelectReusableBlock: (blockId: string) => void
  }
}) {
  const [editorMode, setEditorMode] = React.useState<"visual" | "html" | "preview">("visual")
  const [htmlDraft, setHtmlDraft] = React.useState(toHtmlDraftFromContent(value ?? ""))
  const htmlTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)
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
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "w-full border-collapse overflow-hidden rounded-xl",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-stone-200 bg-stone-100 px-3 py-2 text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-stone-200 px-3 py-2",
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
        placeholder: "Bắt ���ầu viết n���i dung bҠi viết...",
      }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class:
          "min-h-[680px] px-7 py-6 text-[15px] leading-7 text-stone-800 outline-none prose prose-stone max-w-none prose-headings:scroll-mt-24 prose-a:text-orange-700 prose-img:rounded-2xl [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[34px] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[28px] [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:leading-snug [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1 [&_code]:font-semibold [&_code]:text-orange-500 [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:text-inherit [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-semibold [&_pre_code]:text-orange-500 [&_blockquote]:my-3 [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-stone-300 [&_blockquote]:bg-white [&_blockquote]:px-4 [&_blockquote]:pb-3 [&_blockquote]:pt-2 [&_blockquote]:shadow-sm [&_blockquote]:not-italic [&_blockquote]:text-inherit [&_blockquote]:border-l [&_blockquote]:border-l-stone-300 [&_blockquote:hover]:border-orange-300 [&_blockquote:focus-within]:border-orange-400 [&_blockquote:focus-within]:ring-2 [&_blockquote:focus-within]:ring-orange-100 [&_blockquote>p:first-child]:mb-2 [&_blockquote>p:first-child]:inline-flex [&_blockquote>p:first-child]:rounded-full [&_blockquote>p:first-child]:bg-stone-100 [&_blockquote>p:first-child]:px-2.5 [&_blockquote>p:first-child]:py-1 [&_blockquote>p:first-child]:text-[11px] [&_blockquote>p:first-child]:font-semibold [&_blockquote>p:first-child]:uppercase [&_blockquote>p:first-child]:tracking-wide [&_blockquote>p:first-child]:text-stone-500 [&_blockquote>p:first-child_strong]:font-semibold",
      },
    },
    onUpdate({ editor: currentEditor }) {
      const nextHtml = currentEditor.getHTML()
      setHtmlDraft(toHtmlDraftFromContent(nextHtml))
      onChange(nextHtml)
    },
  })

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
      const shouldReplace = options?.replaceCurrent && editor.isActive("image")
      if (shouldReplace) {
        editor
          .chain()
          .focus()
          .updateAttributes("image", {
            src: image.url.trim(),
            alt: image.altText ?? undefined,
            title: image.title ?? undefined,
            caption: (image.caption ?? image.description ?? image.altText ?? "").trim(),
          })
          .run()
      } else {
        const note = (image.caption ?? image.description ?? image.altText ?? "").trim()
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "image",
              attrs: {
                src: image.url.trim(),
                alt: image.altText ?? undefined,
                title: image.title ?? undefined,
                caption: note,
              },
            },
            ...(note
              ? [
                  {
                    type: "paragraph",
                    attrs: { textAlign: "center" },
                    content: [
                      {
                        type: "text",
                        text: note,
                        marks: [{ type: "italic" }],
                      },
                    ],
                  },
                ]
              : []),
            { type: "paragraph" },
          ])
          .run()
      }

      if (image.mediaId && onInsertContentImage) {
        onInsertContentImage({
          mediaId: image.mediaId,
          sortOrder: 0,
          altText: image.altText ?? null,
          title: image.title ?? null,
          caption: image.caption ?? null,
          description: image.description ?? null,
          credit: null,
          linkUrl: null,
          isFeatured: false,
        })
      }
    },
    [editor, onInsertContentImage]
  )

  React.useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    const nextHtml = value ?? ""

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false })
    }
    setHtmlDraft(toHtmlDraftFromContent(nextHtml))
  }, [editor, value])

  const applyHtmlToVisualEditor = React.useCallback(() => {
    if (!editor) return
    const nextContent = toContentFromHtmlDraft(htmlDraft)
    editor.commands.setContent(nextContent)
  }, [editor, htmlDraft])

  const formatHtmlDraft = React.useCallback(() => {
    const pretty = htmlDraft
      .split(CONTENT_BLOCK_SEPARATOR)
      .map((block) => prettyHtmlForEditor(block.trim()))
      .filter(Boolean)
      .join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
    setHtmlDraft(pretty)
  }, [htmlDraft])

  const insertHtmlSnippet = React.useCallback(
    (before: string, after = "") => {
      const textarea = htmlTextareaRef.current
      if (!textarea) return
      const nextValue = insertHtmlAtSelection(textarea, before, after)
      setHtmlDraft(nextValue)
      onChange(nextValue)
    },
    [onChange]
  )

  const previewHtml = React.useMemo(
    () => prettyHtmlForEditor(stripBlockWrappersForHtml(editor?.getHTML() ?? value ?? "")),
    [editor, value, htmlDraft]
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
      editor.chain().focus().updateAttributes("image", { align }).run()
    },
    [editor, toolbarState.imageActive]
  )

  const setImageWidthPercent = React.useCallback(
    (percent: number) => {
      if (!editor || !toolbarState.imageActive) return
      const safe = Math.min(100, Math.max(20, percent))
      editor.chain().focus().updateAttributes("image", { width: `${safe}%` }).run()
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
    <div className="overflow-hidden rounded-b-2xl border-x border-b border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-end border-b border-stone-200 bg-stone-50 px-3 py-2">
        <Tabs
          value={editorMode}
          onValueChange={(nextMode) => {
            const mode = nextMode as "visual" | "html" | "preview"
            if (mode === "visual") {
              applyHtmlToVisualEditor()
            } else if (mode === "html") {
              const sourceHtml = editor?.getHTML() ?? htmlDraft
              setHtmlDraft(toHtmlDraftFromContent(sourceHtml))
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
            <TabsTrigger value="preview" className="h-7 min-w-[88px] rounded-md text-xs">
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {editorMode === "visual" ? (
      <>
      {blockControls ? (
        <div className="border-b border-stone-200 bg-stone-50/70 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-stone-300"
              onClick={blockControls.addPostTitleBlock}
            >
              + Block TiÒªu �á»
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-stone-300"
              onClick={blockControls.addContentBlock}
            >
              + Block NÃ¡Â»â„¢i Dung
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-stone-300"
              onClick={blockControls.addContactFooterBlock}
            >
              + Block Footer LiÒªn Há»⬡
            </Button>
            <select
              defaultValue=""
              onChange={(event) => {
                const blockId = event.target.value
                if (!blockId) return
                blockControls.onSelectReusableBlock(blockId)
                event.currentTarget.value = ""
              }}
              className="h-9 min-w-[230px] rounded-full border border-stone-300 bg-white px-3 text-sm text-stone-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
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

      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-white px-3 py-2">
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
          <option value="paragraph">Ã„ÂoÃ¡ÂºÂ¡n vÃ„Æ’n</option>
          <option value="h1">TiÃƒÂªu Ã„â€˜Ã¡Â»Â 1</option>
          <option value="h2">TiÃƒÂªu Ã„â€˜Ã¡Â»Â 2</option>
          <option value="h3">TiÃƒÂªu Ã„â€˜Ã¡Â»Â 3</option>
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
          label="In Ã„â€˜Ã¡ÂºÂ­m"
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
          label="Danh sÃƒÂ¡ch sÃ¡Â»â€˜"
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
          label="CÃ„Æ’n trÃƒÂ¡i"
          active={toolbarState.alignLeft}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <IconTextWrap className="size-4" />
        </EditorButton>
        <EditorButton
          label="CÃ„Æ’n giÃ¡Â»Â¯a"
          active={toolbarState.alignCenter}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <IconTextSize className="size-4" />
        </EditorButton>
        <EditorButton
          label="CÃ„Æ’n phÃ¡ÂºÂ£i"
          active={toolbarState.alignRight}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <IconTextDirectionRtl className="size-4" />
        </EditorButton>
        <EditorButton
          label="CÃ„Æ’n Ã„â€˜Ã¡Â»Âu"
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
            label="Sửa ảnh ���ang chọn"
            onClick={() => {
              setImageActionMode("replace")
              const imageAttrs = editor?.getAttributes("image") as
                | { src?: string; alt?: string; title?: string; caption?: string }
                | undefined
              setImagePickerInitialUrl(imageAttrs?.src ?? null)
              setImagePickerInitialDraft({
                altText: imageAttrs?.alt ?? "",
                title: imageAttrs?.title ?? "",
                caption: imageAttrs?.caption ?? "",
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
          label="TiҪu ���ề nhỏ"
          active={toolbarState.heading3}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <IconH3 className="size-4" />
        </EditorButton>
        <EditorButton
          label="�� °á»ng phÒ¢n cÒ¡ch"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <IconLineDashed className="size-4" />
        </EditorButton>
        <EditorButton
          label="XuÃ¡Â»â€˜ng dÃƒÂ²ng"
          onClick={() => editor?.chain().focus().setHardBreak().run()}
        >
          <IconCornerDownLeft className="size-4" />
        </EditorButton>
        <EditorButton
          label="XÃƒÂ³a Ã„â€˜Ã¡Â»â€¹nh dÃ¡ÂºÂ¡ng"
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
              label="In Ã„â€˜Ã¡ÂºÂ­m"
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
                  caption: imageAttrs?.caption ?? "",
                })
                setIsImageLibraryOpen(true)
              }}
            >
              <IconPhoto className="size-4" />
            </EditorButton>
            <EditorButton
              label="Xҳa ảnh"
              onClick={() => editor.chain().focus().deleteSelection().run()}
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
        title="Chọn ảnh chҨn vҠo n���i dung bҠi viết"
      />
      </>
      ) : editorMode === "html" ? (
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
              LÃƒÂ m Ã„â€˜Ã¡ÂºÂ¹p HTML
            </button>
          </div>
          <Textarea
            ref={htmlTextareaRef}
            value={htmlDraft}
            onChange={(event) => {
              setHtmlDraft(event.target.value)
              onChange(event.target.value)
            }}
            className="min-h-[680px] rounded-none border-0 px-4 py-3 font-mono text-[13px] leading-6 focus-visible:ring-0"
          />
        </div>
      ) : (
        <div className="min-h-[680px] border-b border-stone-200 bg-white p-6">
          <article
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{
              __html: previewHtml || "<p>ChÃ†Â°a cÃƒÂ³ nÃ¡Â»â„¢i dung Ã„â€˜Ã¡Â»Æ’ preview.</p>",
            }}
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
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [coverUrl, setCoverUrl] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [isSlugEdited, setIsSlugEdited] = React.useState(!isNew)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateBlogPostPayload>({
    resolver: zodResolver(CreateBlogPostPayloadSchema),
    defaultValues: {
      title: isNew ? DEFAULT_NEW_BLOG_MOCK_TITLE : "",
      slug: "",
      excerpt: isNew ? DEFAULT_NEW_BLOG_MOCK_EXCERPT : "",
      content: isNew
        ? mergeBlocksToContent([
            `<h2>${DEFAULT_NEW_BLOG_MOCK_TITLE}</h2>`,
            DEFAULT_NEW_BLOG_MOCK_BODY_CONTENT,
            DEFAULT_NEW_BLOG_MOCK_FOOTER_CONTENT,
          ])
        : "",
      coverMediaId: "",
      status: ContentStatus.DRAFT,
      categoryIds: [],
      tagIds: [],
      contentImages: [],
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
  const [reusableBlocks, setReusableBlocks] = React.useState<ReusableContentBlock[]>([])

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REUSABLE_BLOCKS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as ReusableContentBlock[]
      if (Array.isArray(parsed)) {
        setReusableBlocks(parsed)
      }
    } catch (error) {
      console.error("Failed to load reusable blocks", error)
    }
  }, [])

  const persistReusableBlocks = React.useCallback((items: ReusableContentBlock[]) => {
    setReusableBlocks(items)
    window.localStorage.setItem(REUSABLE_BLOCKS_STORAGE_KEY, JSON.stringify(items))
  }, [])

  const insertContentBlock = React.useCallback(
    (html: string, type: "title" | "content" | "footer" = "content") => {
      const nextBlocks = [...splitContentToBlocks(preview.content), wrapHtmlAsBlock(html, type)]
      const nextContent = mergeBlocksToContent(nextBlocks)
      setValue("content", nextContent, { shouldDirty: true, shouldValidate: true })
    },
    [preview.content, setValue]
  )

  const addPostTitleBlock = React.useCallback(() => {
    const title = (preview.title ?? "").trim() || "TiҪu ���ề bҠi viết"
    insertContentBlock(`<h2>${title}</h2>`, "title")
  }, [insertContentBlock, preview.title])

  const addContactFooterBlock = React.useCallback(() => {
    insertContentBlock(
      `<hr /><h3>ThÒ´ng tin liÒªn há»⬡</h3><p><strong>Duky Store</strong><br />Hotline: 0900 000 000<br />Email: contact@duky.store<br />Website: https://duky.store</p>`,
      "footer"
    )
  }, [insertContentBlock])

  const selectedStatus = preview.status ?? ContentStatus.DRAFT
  const generatedSlug = preview.slug || slugify(preview.title || "bai-viet")

  React.useEffect(() => {
    if (isSlugEdited) return

    const nextSlug = slugify(preview.title ?? "")
    setValue("slug", nextSlug, {
      shouldDirty: Boolean(nextSlug),
      shouldValidate: Boolean(nextSlug),
    })
  }, [isSlugEdited, preview.title, setValue])

  const fetchOptions = React.useCallback(async () => {
    try {
      const [categoryResponse, tagResponse] = await Promise.all([
        blogService.getCategories({ limit: 100 }),
        tagService.getTags({ limit: 100 }),
      ])

      setCategories(categoryResponse.data)
      setTags(tagResponse.data.filter((tag) => tag.type !== TagType.PRODUCT))
    } catch (error) {
      console.error("Failed to fetch blog options", error)
      setFeedback({
        message: "KhҴng tải ���� �ợc danh mục hoặc tag blog.",
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
      setIsSlugEdited(true)
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
        contentImages: (data.contentImages ?? []).map((item, index) => ({
          mediaId: item.mediaId,
          sortOrder: item.sortOrder ?? index,
          altText: item.altText ?? "",
          title: item.title ?? "",
          caption: item.caption ?? "",
          description: item.description ?? "",
          credit: item.credit ?? "",
          linkUrl: item.linkUrl ?? "",
          isFeatured: item.isFeatured ?? index === 0,
        })),
        seo: {
          metaTitle: data.seo?.metaTitle ?? "",
          metaDescription: data.seo?.metaDescription ?? "",
          canonicalUrl: data.seo?.canonicalUrl ?? "",
          ogTitle: data.seo?.ogTitle ?? "",
          ogDescription: data.seo?.ogDescription ?? "",
          ogImageMediaId: data.seo?.ogImageMediaId ?? "",
          twitterTitle: data.seo?.twitterTitle ?? "",
          twitterDescription: data.seo?.twitterDescription ?? "",
          noIndex: data.seo?.noIndex ?? false,
          noFollow: data.seo?.noFollow ?? false,
        },
      })
    } catch (error) {
      console.error("Failed to fetch blog post", error)
      setFeedback({
        message: "KhҴng tải ���� �ợc chi tiết bҠi viết.",
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

  const handleGenerateSlug = () => {
    const title = preview.title?.trim()
    if (!title) return
    setIsSlugEdited(false)
    setValue("slug", slugify(title), { shouldDirty: true, shouldValidate: true })
  }

  const toggleTag = (tagId: string, checked: boolean) => {
    setValue(
      "tagIds",
      checked
        ? [...new Set([...selectedTagIds, tagId])]
        : selectedTagIds.filter((id) => id !== tagId),
      { shouldDirty: true }
    )
  }

  const onSubmit = async (data: CreateBlogPostPayload) => {
    try {
      setIsSaving(true)
      setFeedback(null)

      const payload = normalizePayload(data)

      if (isNew) {
        await blogService.createPost(payload)
      } else if (postId) {
        await blogService.updatePost(postId, payload)
      }

      router.push("/blog")
    } catch (error) {
      console.error("Failed to save blog post", error)
      setFeedback({
        message: "ChÃ†Â°a lÃ†Â°u Ã„â€˜Ã†Â°Ã¡Â»Â£c bÃƒÂ i viÃ¡ÂºÂ¿t. KiÃ¡Â»Æ’m tra nÃ¡Â»â„¢i dung/API rÃ¡Â»â€œi thÃ¡Â»Â­ lÃ¡ÂºÂ¡i.",
        tone: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 p-10 text-muted-foreground">
        <IconLoader2 className="animate-spin" />
        <span>��ang tải bҠi viết...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-full bg-[#f7f7f5]">
      <div className="sticky top-0 z-30 rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                <span>{isNew ? "BÒ i viáº¿t má»⬺i" : "Chá»⬰nh sá»­a"}</span>
              </div>
              <h1 className="mt-1 truncate text-base font-semibold text-stone-950">
                {isNew ? "Tạo bҠi viết" : "Ch�0nh sửa bҠi viết"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              onClick={() => setIsPreviewOpen(true)}
            >
              <IconEye className="size-4" />
              Xem tr� °á»⬺c
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              asChild
            >
              <Link href="/blog">SEO</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
              onClick={() => {
                setValue("status", ContentStatus.PUBLISHED, { shouldDirty: true })
              }}
            >
              <IconCheck className="size-4" />
              CÒ´ng khai
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
              {isSaving ? "�ang l� °u" : "Cáº­p nháº­t"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <InlineFeedback message={feedback?.message ?? null} tone={feedback?.tone} />

          <section className="mx-auto max-w-[1060px]">
            <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-800 shadow-sm">
              Báº£n ���ang soáº¡n sáº½ l� °u vÒ o há»⬡ thá»��ng Blog Duky. Khi chuyá»�n tráº¡ng thÒ¡i cÒ´ng khai, bÒ i viáº¿t sáº½ cÒ³ thá»� hiá»�n thá»⬹ trÒªn storefront.
            </div>

            <div className="rounded-t-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                <div>
                  <Input
                    {...register("title")}
                    placeholder="Nhập tiҪu ���ề bҠi viết"
                    className="h-12 rounded-xl border-stone-300 bg-white px-3 text-xl font-semibold tracking-tight shadow-none focus-visible:border-orange-400 focus-visible:ring-orange-200 md:text-[20px]"
                    aria-invalid={Boolean(errors.title)}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <Textarea
                    {...register("excerpt")}
                    placeholder="Nháº­p mÒ´ táº£ ngáº¯n ���á»� hiá»�n thá»⬹ á»Ÿ danh sÒ¡ch bÒ i viáº¿t vÒ  SEO..."
                    className="min-h-16 resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-6 text-stone-700 shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">
                    <span className="shrink-0 text-stone-500">Slug</span>
                    <input
                      {...register("slug")}
                      placeholder="tu-dong-tao-neu-bo-trong"
                      className="min-w-0 flex-1 bg-transparent font-mono text-stone-700 outline-none"
                      aria-invalid={Boolean(errors.slug)}
                      onChange={(event) => {
                        setIsSlugEdited(true)
                        setValue("slug", event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-stone-300 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    onClick={handleGenerateSlug}
                  >
                    Tạo slug
                  </Button>
                </div>
              </div>
            </div>

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <BlogRichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onInsertContentImage={(image) => {
                    const current = (preview.contentImages ?? []).filter(
                      (item): item is NonNullable<typeof item> & { mediaId: string } =>
                        Boolean(item?.mediaId)
                    )
                    const existingIndex = current.findIndex((item) => item.mediaId === image.mediaId)
                    const next =
                      existingIndex >= 0
                        ? current.map((item, index) =>
                            index === existingIndex
                              ? {
                                  ...item,
                                  ...image,
                                  sortOrder: item.sortOrder ?? index,
                                }
                              : item
                          )
                        : [
                            ...current,
                            {
                              ...image,
                              sortOrder: current.length,
                              isFeatured: current.length === 0,
                            },
                          ]
                    setValue("contentImages", next, { shouldDirty: true })
                  }}
                  blockControls={{
                    addPostTitleBlock,
                    addContentBlock: () => insertContentBlock("<p>Ná»™i dung block má»›i...</p>"),
                    addContactFooterBlock,
                    reusableBlocks,
                    onSelectReusableBlock: (blockId) => {
                      const selected = reusableBlocks.find((item) => item.id === blockId)
                      if (!selected) return
                      const nextBlocks = [
                        ...splitContentToBlocks(preview.content),
                        ...splitContentToBlocks(selected.html),
                      ]
                      setValue("content", mergeBlocksToContent(nextBlocks), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    },
                  }}
                />
              )}
            />
            <FieldError message={errors.content?.message} />
          </section>

          <section className="mx-auto mt-5 flex max-w-[1060px] flex-col gap-3">
            <MetaBox title="Tҳm tắt nhanh">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase text-stone-500">TiÃƒÂªu Ã„â€˜Ã¡Â»Â</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {preview.title?.length ?? 0} kҽ tự
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase text-stone-500">MҴ tả</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {preview.excerpt?.length ?? 0} kҽ tự
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs uppercase text-stone-500">Tags</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {selectedTagIds.length} tag Ã„â€˜ÃƒÂ£ chÃ¡Â»Ân
                  </p>
                </div>
              </div>
            </MetaBox>

            <MetaBox title="Rank Math SEO">
              <div className="space-y-4">
                <div className="rounded-2xl border border-orange-200 border-l-4 border-l-orange-400 bg-orange-50 p-3 text-sm text-orange-800">
                  <p className="font-semibold">Snippet preview</p>
                  <p className="mt-1 text-orange-700">
                    {preview.seo?.metaTitle || preview.title || "TiÃƒÂªu Ã„â€˜Ã¡Â»Â SEO sÃ¡ÂºÂ½ hiÃ¡Â»Æ’n thÃ¡Â»â€¹ Ã¡Â»Å¸ Ã„â€˜ÃƒÂ¢y"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-orange-700">
                    /blog/{generatedSlug}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Meta title</Label>
                    <Input
                      {...register("seo.metaTitle")}
                      placeholder="Mặc ����9nh lấy tiҪu ���ề bҠi viết"
                      className="rounded-xl border-stone-300 focus-visible:ring-orange-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Canonical URL</Label>
                    <Input
                      {...register("seo.canonicalUrl")}
                      placeholder="https://..."
                      className="rounded-xl border-stone-300 font-mono text-xs focus-visible:ring-orange-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Meta description</Label>
                  <Textarea
                    {...register("seo.metaDescription")}
                    placeholder="Mặc ����9nh lấy mҴ tả ngắn"
                    className="min-h-20 rounded-xl border-stone-300 focus-visible:ring-orange-200"
                  />
                </div>
              </div>
            </MetaBox>

            <MetaBox title="Thiết lập hi��n th�9 bҠi viết">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                  <input type="radio" defaultChecked className="accent-orange-600" />
                  Sidebar phải
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-500">
                  <input type="radio" disabled />
                  Full width
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                  <input type="checkbox" defaultChecked className="accent-orange-600" />
                  HiÃ¡Â»Æ’n thÃ¡Â»â€¹ Ã¡ÂºÂ£nh Ã„â€˜Ã¡ÂºÂ¡i diÃ¡Â»â€¡n
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                  <input type="checkbox" defaultChecked className="accent-orange-600" />
                  HiÃ¡Â»Æ’n thÃ¡Â»â€¹ ngÃƒÂ y Ã„â€˜Ã„Æ’ng
                </label>
              </div>
            </MetaBox>
          </section>
        </main>

        <aside className="flex min-w-0 flex-col gap-3 rounded-3xl border border-stone-200 bg-white/70 p-3 shadow-sm backdrop-blur lg:self-start">
          <Panel title="Ã¡ÂºÂ¢nh Ã„â€˜Ã¡ÂºÂ¡i diÃ¡Â»â€¡n" icon={<IconPhoto className="size-4" />}>
            <input type="hidden" {...register("coverMediaId")} />
            {coverUrl ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                <img
                  src={coverUrl}
                  alt={preview.title || "Ảnh ���ại di�!n bҠi viết"}
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
                Chọn ảnh bҠi viết
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
                aria-label="Xҳa ảnh ���ại di�!n"
              >
                <IconTrash />
              </Button>
            </div>
          </Panel>

          <Panel title="Xuất bản" icon={<IconFileText className="size-4" />}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ChuyҪn mục</Label>
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
                        <SelectValue placeholder="Chọn chuyҪn mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={NO_CATEGORY}>Ch� °a phÒ¢n loáº¡i</SelectItem>
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
                <Label>Trạng thҡi</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl border-stone-300 focus:ring-orange-200">
                        <SelectValue placeholder="Chọn trạng thҡi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={ContentStatus.DRAFT}>Tin nhÒ¡p</SelectItem>
                          <SelectItem value={ContentStatus.PUBLISHED}>CÒ´ng khai</SelectItem>
                          <SelectItem value={ContentStatus.HIDDEN}>Ẩn</SelectItem>
                          <SelectItem value={ContentStatus.ARCHIVED}>L� °u trá»¯</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Badge className={cn("border font-medium", statusBadgeClassName(selectedStatus))}>
                  {statusLabels[selectedStatus]}
                </Badge>
                <p className="text-xs text-slate-500">{statusHints[selectedStatus]}</p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-500">NgÃƒÂ y Ã„â€˜Ã„Æ’ng</span>
                  <span className="text-right font-medium text-stone-800">
                    {formatDate(post?.publishedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-500">Tҡc giả</span>
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

          <Panel title="NgҴn ngữ" icon={<IconGlobe className="size-4" />}>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-3 py-2 text-sm font-medium text-orange-700">
                  <input type="radio" defaultChecked className="accent-orange-600" />
                  VIE
                </label>
                <label className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600">
                  <input type="radio" disabled />
                  ENG
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full rounded-xl border-stone-300"
                disabled
              >
                Dá»⬹ch sang tiáº¿ng Anh
              </Button>
            </div>
          </Panel>

          <Panel title="NÒ¢ng cao" icon={<IconSeo className="size-4" />} defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Meta title</Label>
                <Input
                  {...register("seo.metaTitle")}
                  placeholder="MÃ¡ÂºÂ·c Ã„â€˜Ã¡Â»â€¹nh lÃ¡ÂºÂ¥y tiÃƒÂªu Ã„â€˜Ã¡Â»Â"
                  className="rounded-xl border-stone-300 focus-visible:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta description</Label>
                <Textarea
                  {...register("seo.metaDescription")}
                  placeholder="Mặc ����9nh lấy mҴ tả ngắn"
                  className="min-h-24 rounded-xl border-stone-300 focus-visible:ring-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input
                  {...register("seo.canonicalUrl")}
                  className="rounded-xl border-stone-300 font-mono text-xs focus-visible:ring-orange-200"
                  placeholder="https://..."
                />
              </div>
              <Separator />
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2 text-sm">
                <Controller
                  name="seo.noIndex"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  )}
                />
                KhÒ´ng index bÒ i nÒ y
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2 text-sm">
                <Controller
                  name="seo.noFollow"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  )}
                />
                KhÒ´ng follow link trong bÒ i
              </label>
            </div>
          </Panel>

          <Panel title="B��� cục bҠi viết" icon={<IconFileText className="size-4" />} defaultOpen={false}>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                <input type="radio" defaultChecked className="accent-orange-600" />
                Sidebar phải
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-600">
                <input type="radio" disabled />
                KhÒ´ng sidebar
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-600">
                <input type="checkbox" defaultChecked className="accent-orange-600" />
                Hiá»�n thá»⬹ breadcrumb
              </label>
            </div>
          </Panel>

          <Panel title="Thảo luận" icon={<IconFileText className="size-4" />} defaultOpen={false}>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                <input type="checkbox" defaultChecked className="accent-orange-600" />
                Cho phҩp bҬnh luận
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                <input type="checkbox" defaultChecked className="accent-orange-600" />
                Hiá»�n thá»⬹ bÒ i viáº¿t liÒªn quan
              </label>
            </div>
          </Panel>

          <Panel title="Tags" icon={<IconSearch className="size-4" />} defaultOpen={false}>
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {tags.length === 0 ? (
                <p className="text-sm text-slate-500">Ch� °a cÒ³ tag blog.</p>
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
          </Panel>
        </aside>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Xem tr� °á»⬺c bÒ i viáº¿t</DialogTitle>
            <DialogDescription>
              Preview nhanh nÃ¡Â»â„¢i dung trÃ†Â°Ã¡Â»â€ºc khi lÃ†Â°u lÃƒÂªn backend.
            </DialogDescription>
          </DialogHeader>
          <article className="mx-auto flex max-w-3xl flex-col gap-6">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={preview.title || "Ảnh ���ại di�!n bҠi viết"}
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
                {preview.title || "TiҪu ���ề bҠi viết"}
              </h2>
              <p className="text-muted-foreground">
                {preview.excerpt || "MÒ´ táº£ ngáº¯n sáº½ hiá»�n thá»⬹ á»Ÿ ���Ò¢y."}
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
                __html: preview.content || "<p>NÃ¡Â»â„¢i dung bÃƒÂ i viÃ¡ÂºÂ¿t sÃ¡ÂºÂ½ hiÃ¡Â»Æ’n thÃ¡Â»â€¹ Ã¡Â»Å¸ Ã„â€˜ÃƒÂ¢y.</p>",
              }}
            />
          </article>
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
    </form>
  )
}



