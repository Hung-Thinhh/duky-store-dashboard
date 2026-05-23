"use client"

import * as React from "react"
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
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

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconItalic,
  IconTextSpellcheck,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconCode,
  IconList,
  IconListNumbers,
  IconCheckupList,
  IconBlockquote,
  IconTextWrap,
  IconTextSize,
  IconTextDirectionRtl,
  IconTextWrapDisabled,
  IconTextColor,
  IconHighlight,
  IconLink,
  IconPhoto,
  IconTable,
  IconTableRow,
  IconTableColumn,
  IconTrash,
  IconH3,
  IconCornerDownLeft,
  IconClearFormatting,
  IconChevronDown,
  IconResize,
  IconPaint,
  IconLayoutAlignLeft,
  IconLayoutAlignCenter,
  IconLayoutAlignRight,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { mediaService } from "@/lib/api/services/media.service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// ----------------------------------------------------------------------
// Custom Extensions y hệt như bên Blog
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// Helper Components cho Toolbar y hệt như bên Blog
// ----------------------------------------------------------------------

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
          aria-label={`${label} nâng cao`}
          title={`${label} nâng cao`}
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
          <span>Chèn bảng 3x3</span>
        </button>
        <button
          type="button"
          disabled={!isInTable}
          onClick={() => editor?.chain().focus().addRowAfter().run()}
          className={tableActionClass}
        >
          <IconTableRow className="size-4" />
          <span>Thêm hàng dưới</span>
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
          <span>Xóa hàng hiện tại</span>
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
          <span>Xóa bảng</span>
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
  const url = window.prompt("Nhập URL liên kết", previousUrl ?? "")

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

// Hàm làm đẹp HTML đơn giản và nhẹ nhàng
function prettyHtmlForEditor(html: string) {
  let formatted = ""
  const reg = /(<[^>]+>)/g
  const parts = html.split(reg)
  let pad = 0
  parts.forEach((part) => {
    if (!part.trim()) return
    if (part.match(/^<\/\w/)) {
      pad -= 1
    }
    formatted += "  ".repeat(Math.max(0, pad)) + part + "\n"
    if (part.match(/^<\w[^>]*[^\/]>$/) && !part.match(/^<(input|br|img|hr|meta|link)/)) {
      pad += 1
    }
  })
  return formatted.trim()
}

// ----------------------------------------------------------------------
// Main TiptapEditor Component
// ----------------------------------------------------------------------

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeightClass?: string
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Nhập mô tả chi tiết sản phẩm...",
  minHeightClass = "min-h-[500px]",
}: TiptapEditorProps) {
  const [editorMode, setEditorMode] = React.useState<"visual" | "html">("visual")
  const [htmlDraft, setHtmlDraft] = React.useState(value ?? "")
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
      Blockquote,
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
        placeholder,
      }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class: `px-7 py-6 text-[15px] leading-7 text-stone-800 outline-none prose prose-stone max-w-none prose-headings:scroll-mt-24 prose-a:text-orange-700 prose-img:rounded-2xl [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[34px] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[28px] [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:leading-snug [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1 [&_code]:font-semibold [&_code]:text-orange-500 [&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:text-inherit [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-semibold [&_pre_code]:text-orange-500 [&_blockquote]:my-3 [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-stone-300 [&_blockquote]:bg-white [&_blockquote]:px-4 [&_blockquote]:pb-3 [&_blockquote]:pt-2 [&_blockquote]:shadow-sm [&_blockquote]:not-italic [&_blockquote]:text-inherit [&_blockquote]:border-l [&_blockquote]:border-l-stone-300 [&_blockquote:hover]:border-orange-300 [&_blockquote:focus-within]:border-orange-400 [&_blockquote:focus-within]:ring-2 [&_blockquote:focus-within]:ring-orange-100 [&_blockquote>p:first-child]:mb-2 [&_blockquote>p:first-child]:inline-flex [&_blockquote>p:first-child]:rounded-full [&_blockquote>p:first-child]:bg-stone-100 [&_blockquote>p:first-child]:px-2.5 [&_blockquote>p:first-child]:py-1 [&_blockquote>p:first-child]:text-[11px] [&_blockquote>p:first-child]:font-semibold [&_blockquote>p:first-child]:uppercase [&_blockquote>p:first-child]:tracking-wide [&_blockquote>p:first-child]:text-stone-500 ${minHeightClass}`,
      },
    },
    onUpdate({ editor: currentEditor }) {
      const nextHtml = currentEditor.getHTML()
      setHtmlDraft(nextHtml)
      setIsHtmlDraftDirty(false)
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
      queueMicrotask(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(nextHtml, { emitUpdate: false })
        }
      })
    }
    setHtmlDraft(nextHtml)
    setIsHtmlDraftDirty(false)
  }, [editor, value])

  const applyHtmlToVisualEditor = React.useCallback(() => {
    if (!editor || !isHtmlDraftDirty) return
    editor.commands.setContent(htmlDraft)
    onChange(htmlDraft)
    setIsHtmlDraftDirty(false)
  }, [editor, htmlDraft, isHtmlDraftDirty, onChange])

  const formatHtmlDraft = React.useCallback(() => {
    const pretty = prettyHtmlForEditor(htmlDraft.trim())
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

  if (!editor) return null

  return (
    <div className="overflow-visible rounded-b-2xl border-x border-b border-stone-200 bg-white shadow-sm">
      {/* Nút Tabs chuyển đổi Visual / HTML y hệt như bên Blog */}
      <div className="flex items-center justify-end border-b border-stone-200 bg-stone-50 px-3 py-2">
        <Tabs
          value={editorMode}
          onValueChange={(nextMode) => {
            const mode = nextMode as "visual" | "html"
            if (mode === "visual") {
              applyHtmlToVisualEditor()
            } else if (mode === "html") {
              const sourceHtml = editor?.getHTML() ?? htmlDraft
              setHtmlDraft(sourceHtml)
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
          {/* Thanh công cụ (Toolbar) y hệt 100% bên Blog */}
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
              label="Hoàn tác"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <IconArrowBackUp className="size-4" />
            </EditorButton>
            <EditorButton
              label="Làm lại"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
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
              label="In nghiêng"
              active={toolbarState.italic}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <IconItalic className="size-4" />
            </EditorButton>
            <EditorButton
              label="Gạch chân"
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
              label="Chữ số dưới"
              active={toolbarState.subscript}
              onClick={() => editor?.chain().focus().toggleSubscript().run()}
            >
              <IconSubscript className="size-4" />
            </EditorButton>
            <EditorButton
              label="Chữ số trên"
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
              label="Danh sách"
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
              label="Trích dẫn"
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
              label="Màu chữ"
              icon={<IconTextColor className="size-4" />}
              value={activeTextColor}
              fallback={colorSwatches[0]}
              swatches={colorSwatches}
              onChange={(color) => editor?.chain().focus().setColor(color).run()}
            />
            <ColorToolbarControl
              label="Màu nền"
              icon={<IconHighlight className="size-4" />}
              value={activeHighlightColor}
              fallback={highlightSwatches[0]}
              swatches={highlightSwatches}
              onChange={(color) => editor?.chain().focus().setHighlight({ color }).run()}
            />

            <EditorDivider />
            <EditorButton
              label="Thêm link"
              active={toolbarState.link}
              onClick={() => setLink(editor)}
            >
              <IconLink className="size-4" />
            </EditorButton>
            <EditorButton label="Thêm ảnh" onClick={() => setIsImageLibraryOpen(true)}>
              <IconPhoto className="size-4" />
            </EditorButton>
            {toolbarState.imageActive ? (
              <EditorButton
                label="Sửa ảnh đang chọn"
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
              label="Tiêu đề nhỏ"
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

          {/* Bubble Menu khi bôi đen chữ */}
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
                label="In nghiêng"
                active={toolbarState.italic}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <IconItalic className="size-4" />
              </EditorButton>
              <EditorButton
                label="Thêm link"
                active={toolbarState.link}
                onClick={() => setLink(editor)}
              >
                <IconLink className="size-4" />
              </EditorButton>
            </div>
          </BubbleMenu>

          {/* Bubble Menu khi click chọn ảnh */}
          <BubbleMenu editor={editor} shouldShow={({ editor: currentEditor }) => currentEditor.isActive("image")}>
            <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-2 py-1 shadow-xl">
              <EditorButton
                label="Canh trái"
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
                label="Xóa ảnh"
                onClick={() => deleteActiveImageWithCaption(editor)}
              >
                <IconTrash className="size-4" />
              </EditorButton>
            </div>
          </BubbleMenu>

          {/* Vùng soạn thảo Trực quan */}
          <div className="bg-white">
            <EditorContent editor={editor} />
          </div>

          {/* Dialog chọn ảnh từ thư viện y hệt như bên Blog */}
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
        /* Tab soạn thảo mã HTML y hệt như bên Blog */
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
            className="min-h-[500px] rounded-none border-0 px-4 py-3 font-mono text-[13px] leading-6 focus-visible:ring-0"
          />
        </div>
      )}
    </div>
  )
}
