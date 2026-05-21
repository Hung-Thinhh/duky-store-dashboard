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
  type BlogCategory,
  type BlogReusableBlock,
  type BlogReusableBlockType,
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
  const raw = (content ?? "").trim()
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
    fromIndex === toIndex
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

  const pos = props.getPos()
  if (typeof pos !== "number") return
  props.editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + props.node.nodeSize })
    .run()
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

type BlogBlockquoteStorage = {
  onSaveReusableBlock?: ((data: SaveReusableBlockRequest) => void) | null
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
  const isLast = info ? info.currentIndex === info.siblings.length - 1 : false
  const isDukyBlock = Boolean(props.node.attrs.dukyBlock || props.node.attrs.dukyBlockType)
  const [insertMenuOpen, setInsertMenuOpen] = React.useState(false)
  const blockquoteStorage = (props.editor.storage as unknown as Record<string, unknown>)
    .blockquote as BlogBlockquoteStorage | undefined
  const reusableBlocks = blockquoteStorage?.reusableBlocks ?? []
  const currentTitle = blockquoteStorage?.currentTitle?.trim() || "Tiêu đề bài viết"

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    const currentInfo = getTopLevelNodeInfo(props)
    if (!currentInfo) return

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
        className="mb-3 flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 "
      >
        <span className="rounded-full bg-orange-500/80 px-3.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
          {props.node.textContent.includes("Mục lục") ? "Block Mục Lục" : blockTypeLabel(type)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            draggable
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
            disabled={isFirst}
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
            disabled={isLast}
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
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => removeBlockNode(props)}
            className="flex size-7 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Xóa block"
            aria-label="Xóa block"
          >
            <IconTrash className="size-4" />
          </button>
        </div>
      </div>
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
              onClick={() => insertBlockAfterCurrent(`<h2>${currentTitle}</h2>`, "title")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-stone-700 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>Block Tiêu Đề</span>
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

function flattenNestedBlockWrappers(html: string) {
  let next = html.trim()
  const nestedPattern =
    /<blockquote[^>]*>\s*<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>\s*(<blockquote[^>]*>[\s\S]*<\/blockquote>)\s*<\/blockquote>/i

  while (nestedPattern.test(next)) {
    next = next.replace(nestedPattern, "$1").trim()
  }

  // Cleanup legacy action text rows accidentally persisted in old block markup.
  next = stripLegacyBlockLabel(next.replace(/<p>\s*[↑↓×\s]+\s*<\/p>/gi, ""))

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

function toPublishableBlogHtml(content?: string | null) {
  return decorateBlogHtmlForPublish(stripBlockWrappersForHtml(content))
}

function toHtmlDraftFromContent(content?: string | null) {
  const blocks = splitContentToBlocks(content)
  if (blocks.length <= 1) {
    const singleHtml = blocks.length === 1 ? unwrapBlockHtml(blocks[0]) : ""
    return prettyHtmlForEditor(decorateBlogHtmlForPublish(singleHtml))
  }
  const formattedBlocks = blocks.map((block) => {
    const unwrapped = unwrapBlockHtml(block)
    return prettyHtmlForEditor(decorateBlogHtmlForPublish(unwrapped))
  })
  return formattedBlocks.filter(Boolean).join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
}

function toContentFromHtmlDraft(htmlDraft: string) {
  const rawBlocks = htmlDraft
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

function normalizePayload(data: CreateBlogPostPayload): CreateBlogPostPayload {
  const generatedSlug = slugify(data.title)
  const contentWithHeadingIds = injectHeadingIds(data.content.trim())

  return {
    title: data.title.trim(),
    slug: generatedSlug || emptyToNull(data.slug),
    excerpt: emptyToNull(data.excerpt),
    content: minifyHtmlForStorage(contentWithHeadingIds),
    coverMediaId: emptyToNull(data.coverMediaId),
    status: data.status ?? ContentStatus.DRAFT,
    categoryIds: data.categoryIds ?? [],
    tagIds: data.tagIds ?? [],
    seo: cleanSeo(data.seo),
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
      setIsHtmlDraftDirty(false)
      onChange(nextHtml)
    },
  })

  React.useEffect(() => {
    if (!editor) return
    const storage = editor.storage as unknown as Record<string, BlogBlockquoteStorage>
    if (!storage.blockquote) return

    storage.blockquote.onSaveReusableBlock = blockControls?.onSaveReusableBlock ?? null
    storage.blockquote.reusableBlocks = blockControls?.reusableBlocks ?? []
    storage.blockquote.currentTitle = blockControls?.currentTitle ?? ""
  }, [
    blockControls?.currentTitle,
    blockControls?.onSaveReusableBlock,
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
    if (!editor) return
    const currentHtml = editor.getHTML()
    const nextHtml = value ?? ""

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false })
    }
    setHtmlDraft(toHtmlDraftFromContent(nextHtml))
    setIsHtmlDraftDirty(false)
  }, [editor, value])

  const applyHtmlToVisualEditor = React.useCallback(() => {
    if (!editor || !isHtmlDraftDirty) return
    const nextContent = toContentFromHtmlDraft(htmlDraft)
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
              Block Tiêu Đề
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
          label="�� °á»ng phÒ¢n cÒ¡ch"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <IconLineDashed className="size-4" />
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
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [coverUrl, setCoverUrl] = React.useState("")
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)

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
        fromIndex === toIndex
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
      blocks.splice(index, 1)
      setValue("content", mergeBlocksToContent(blocks), { shouldDirty: true, shouldValidate: true })
    },
    [preview.content, setValue]
  )

  const addPostTitleBlock = React.useCallback(() => {
    const title = (preview.title ?? "").trim() || "TiҪu ���ề bҠi viết"
    insertContentBlock(`<h2>${title}</h2>`, "title")
  }, [insertContentBlock, preview.title])

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

  const [focusKeyword, setFocusKeyword] = React.useState(
    post?.seo?.focusKeyword ?? ""
  )
  const [isSeoDrawerOpen, setIsSeoDrawerOpen] = React.useState(false)
  const [lastAutoSaved, setLastAutoSaved] = React.useState<Date | null>(null)
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null)

  const seoInput: SeoInput | null = React.useMemo(() => {
    // Use first keyword from comma-separated list as primary focus keyword
    const primaryKeyword = focusKeyword.split(",").map((k) => k.trim()).filter(Boolean)[0] || ""
    if (!primaryKeyword) return null
    return {
      focusKeyword: primaryKeyword,
      seoTitle: preview.seo?.metaTitle || preview.title || "",
      metaDescription: preview.seo?.metaDescription || preview.excerpt || "",
      slug: generatedSlug,
      htmlContent: preview.content || "",
      siteUrl: typeof window !== "undefined" ? window.location.origin : "",
    }
  }, [focusKeyword, preview.seo?.metaTitle, preview.title, preview.seo?.metaDescription, preview.excerpt, generatedSlug, preview.content])

  const seoResult = useSeoAnalysis(seoInput)

  // Table of Contents auto-generation
  const tocItems = React.useMemo(
    () => generateTableOfContents(preview.content || ''),
    [preview.content]
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

  // Auto-save draft every 30 seconds
  React.useEffect(() => {
    if (isNew) return // Don't auto-save new posts that haven't been created yet

    const interval = window.setInterval(async () => {
      const currentValues = getValues()
      if (!isDirty) return
      if (currentValues.status !== ContentStatus.DRAFT) return

      try {
        const payload = normalizePayload(currentValues)
        if (postId) {
          await blogService.updatePost(postId, payload)
          setLastAutoSaved(new Date())
        }
      } catch (error) {
        console.error("Auto-save failed", error)
      }
    }, 30000)

    return () => window.clearInterval(interval)
  }, [isNew, postId, isDirty, getValues])

  React.useEffect(() => {
    const nextSlug = slugify(preview.title ?? "")
    if ((preview.slug ?? "") === nextSlug) return

    setValue("slug", nextSlug, {
      shouldDirty: false,
      shouldValidate: Boolean(nextSlug),
    })
  }, [preview.slug, preview.title, setValue])

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
            .filter((p: any) => p.title && p.slug)
            .map((p: any) => ({ title: p.title, slug: p.slug }))
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
          noIndex: data.seo?.noIndex ?? false,
          noFollow: data.seo?.noFollow ?? false,
        },
      })
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
        message: "Chưa lưu được bài viết. Kiểm tra nội dung/API rồi thử lại.",
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
        <span>Đang tải bài viết...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-full ">
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
                <span>{isNew ? "Bài viết mới" : "Chỉnh sửa"}</span>
              </div>
              <h1 className="mt-1 truncate text-base font-semibold text-stone-950">
                {isNew ? "Tạo bài viết" : "Chỉnh sửa bài viết"}
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
              className="gap-2 rounded-full border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
              onClick={() => {
                setValue("status", ContentStatus.PUBLISHED, { shouldDirty: true })
              }}
            >
              <IconCheck className="size-4" />
              Công khai
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
                <SeoScoringPanel
                  result={seoResult}
                  focusKeyword={focusKeyword}
                  onFocusKeywordChange={setFocusKeyword}
                />

                <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Xem trước kết quả tìm kiếm</p>
                  <p className="truncate text-xs text-green-700">
                    https://dukystore.com/blog/{generatedSlug}
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
              <SeoScoringPanel
                result={seoResult}
                focusKeyword={focusKeyword}
                onFocusKeywordChange={setFocusKeyword}
              />

              {/* Snippet Preview */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">Xem trước kết quả tìm kiếm</p>
                <p className="truncate text-xs text-green-700">
                  https://dukystore.com/blog/{generatedSlug}
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
                              const link = `https://dukystore.com/blog/${suggestion.slug}`
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
                              const link = `https://dukystore.com/san-pham/${product.slug}`
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
