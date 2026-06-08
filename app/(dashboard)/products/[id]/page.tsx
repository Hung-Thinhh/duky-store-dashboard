"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconAdjustmentsHorizontal,
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconBox,
  IconBuildingStore,
  IconCalendar,
  IconCurrencyDong,
  IconDeviceFloppy,
  IconEye,
  IconExternalLink,
  IconLibraryPhoto,
  IconLink,
  IconLoader2,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconSeo,
  IconSettings,
  IconShoppingBag,
  IconTruck,
  IconTrash,
  IconUpload,
  IconWand,
  IconX,
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { InlineFeedback } from "@/components/ui/inline-feedback"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { ProductType } from "@/lib/api/schemas/enums"
import type { Category } from "@/lib/api/schemas/category.schema"
import type { Media } from "@/lib/api/schemas/media.schema"
import type {
  ProductAttribute,
  ProductAttributeTerm,
} from "@/lib/api/schemas/product-attribute.schema"
import {
  CreateProductPayloadSchema,
  ProductAiTask,
  type ProductDetailItem,
  type ProductListItem,
  type ProductAiAssistResult,
  type ProductAiTaskType,
} from "@/lib/api/schemas/product.schema"
import { categoryService } from "@/lib/api/services/category.service"
import { mediaService } from "@/lib/api/services/media.service"
import { productAttributeService } from "@/lib/api/services/product-attribute.service"
import { productService } from "@/lib/api/services/product.service"
import { variantService } from "@/lib/api/services/variant.service"
import { gscService } from "@/lib/api/services/gsc.service"
import { cn } from "@/lib/utils"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import {
  analyzeProductSeo,
  type ProductSeoAnalysis,
  type SeoCheckStatus,
} from "@/lib/seo/product-seo-analyzer"

const ReactQuill = dynamic(
  async () => {
    const [
      { default: Quill },
      { default: QuillResize },
      { default: ReactQuillComponent },
    ] = await Promise.all([
      import("quill"),
      import("quill-resize-module"),
      import("react-quill-new"),
    ])

    if (!Quill.imports["modules/resize"]) {
      Quill.register("modules/resize", QuillResize)
    }

    return ReactQuillComponent
  },
  { ssr: false }
)
import "react-quill-new/dist/quill.snow.css"
import "quill-resize-module/dist/resize.css"

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
  resize: {
    modules: ["Resize", "DisplaySize", "Toolbar"],
    keyboardSelect: false,
    tools: [
      "left",
      "center",
      "right",
      "full",
      {
        text: "✎",
        attrs: {
          title: "Sửa chi tiết ảnh",
          class: "duky-quill-image-edit",
        },
        verify(activeElement: HTMLElement | null) {
          return activeElement?.tagName === "IMG"
        },
        handler(
          _event: Event,
          _button: HTMLElement,
          activeElement: HTMLElement | null
        ) {
          if (activeElement instanceof HTMLImageElement) {
            window.dispatchEvent(
              new CustomEvent("duky:edit-editor-image", {
                detail: { image: activeElement },
              })
            )
          }
        },
      },
    ],
    parchment: {
      image: {
        attribute: ["width"],
        limit: {
          minWidth: 80,
        },
      },
    },
  },
}

const optionalNumber = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? null : value),
  z.number().min(0).nullable().optional()
)

const ProductFormSchema = CreateProductPayloadSchema.extend({
  catalogVisibility: z
    .enum(["VISIBLE", "CATALOG", "SEARCH", "HIDDEN"])
    .default("VISIBLE"),
  manageStock: z.boolean().default(false),
  stockQuantity: optionalNumber,
  lowStockThreshold: optionalNumber,
  stockStatus: z
    .enum(["IN_STOCK", "OUT_OF_STOCK", "ON_BACKORDER"])
    .default("IN_STOCK"),
  soldIndividually: z.boolean().default(false),
  weight: optionalNumber,
  length: optionalNumber,
  width: optionalNumber,
  height: optionalNumber,
  shippingClass: z.string().optional().nullable(),
  upsellIds: z.string().optional().nullable(),
  crossSellIds: z.string().optional().nullable(),
  purchaseNote: z.string().optional().nullable(),
  menuOrder: optionalNumber,
  enableReviews: z.boolean().default(true),
  featuredImageAlt: z.string().optional().nullable(),
  galleryMediaIds: z.array(z.string()).default([]),
  brandIds: z.array(z.string()).default([]),
  groupedProductIds: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  externalButtonText: z.string().optional().nullable(),
  externalButtonAssetType: z
    .enum(["none", "icon", "svg", "image"])
    .default("none"),
  externalButtonAssetValue: z.string().optional().nullable(),
  attributes: z
    .object({
      size: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      material: z.string().optional().nullable(),
    })
    .default({}),
})

type ProductFormInput = z.input<typeof ProductFormSchema>
type ProductFormValues = z.output<typeof ProductFormSchema>
type ProductFormControl = Control<ProductFormInput, unknown, ProductFormValues>
type VariantPriceMode = "default" | "custom"
type VariantValueDraft = {
  attributeId: string
  attributeName: string
  attributeType: ProductAttribute["type"]
  termId: string
  termName: string
  colorHex: string | null
}
type VariantDraft = {
  key: string
  values: VariantValueDraft[]
  priceMode: VariantPriceMode
  price: number | null
  salePrice: number | null
  sku: string
  isActive: boolean
}
type VariantAttributeGroup = {
  key: string
  attributeId: string
  selectedTermIds: string[]
  newTermName: string
}
type ExternalButtonAssetType = "none" | "icon" | "svg" | "image"

type ExternalButtonAsset = {
  type: ExternalButtonAssetType
  value: string | null
}

type ProductAdditionalInfo = {
  externalButtonAsset?: Partial<ExternalButtonAsset> | null
  [key: string]: unknown
}

const createVariantGroup = (): VariantAttributeGroup => ({
  key:
    globalThis.crypto?.randomUUID?.() ??
    `variant-group-${Date.now()}-${Math.random()}`,
  attributeId: "",
  selectedTermIds: [],
  newTermName: "",
})

const productTypeDescriptions: Record<
  (typeof ProductType)[keyof typeof ProductType],
  string
> = {
  [ProductType.SIMPLE]:
    "Ban truc tiep mot san pham co gia, kho va van chuyen rieng.",
  [ProductType.GROUPED]:
    "Gom nhieu san pham con, khong dat gia va kho rieng tai san pham cha.",
  [ProductType.EXTERNAL]: "Chuyen khach sang URL ben ngoai de mua hang.",
  [ProductType.VARIABLE]:
    "Chon thuoc tinh tu /variants va tao cac dong bien the co gia rieng.",
}

const externalLinkPresets = [
  { label: "Shopee", value: "https://shopee.vn/" },
  { label: "Lazada", value: "https://www.lazada.vn/" },
  { label: "TikTok Shop", value: "https://www.tiktok.com/shop" },
  { label: "Facebook", value: "https://www.facebook.com/" },
  { label: "Zalo OA", value: "https://zalo.me/" },
]

const externalButtonTextPresets = [
  "Mua ngay",
  "Mua trên Shopee",
  "Mua trên Lazada",
  "Xem trên TikTok Shop",
  "Liên hệ tư vấn",
]

const externalButtonIconPresets = [
  { label: "Không có", type: "none", value: "" },
  { label: "Cửa hàng", type: "icon", value: "store" },
  { label: "Túi mua hàng", type: "icon", value: "shopping-bag" },
  { label: "Liên kết ngoài", type: "icon", value: "external-link" },
] satisfies Array<{
  label: string
  type: ExternalButtonAssetType
  value: string
}>

const getProductAdditionalInfo = (
  value: unknown
): ProductAdditionalInfo | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as ProductAdditionalInfo)
    : null

const getExternalButtonIcon = (value?: string | null) => {
  switch (value) {
    case "store":
      return IconBuildingStore
    case "shopping-bag":
      return IconShoppingBag
    case "external-link":
      return IconExternalLink
    default:
      return null
  }
}

const tags = ["chelsea boot", "da bò", "đế cao su", "nam nữ", "Duky"]
const brands = ["DUKY", "Duky Classic", "Duky Premium"]
const gallerySlots = [
  "Ảnh 1",
  "Ảnh 2",
  "Ảnh 3",
  "Ảnh 4",
  "Ảnh 5",
  "Ảnh 6",
  "Ảnh 7",
  "Ảnh 8",
  "Ảnh 9",
  "Ảnh 10",
]
const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "")
const normalizeVariantTerm = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()

const getTermColorValue = (term: ProductAttributeTerm) => {
  const metadata = term.metadata as
    | { hex?: string; color?: string }
    | null
    | undefined
  const value = metadata?.hex ?? metadata?.color ?? term.value ?? null

  return value?.match(/^#[0-9a-fA-F]{6}$/) ? value : null
}

const combineVariantAxes = (axes: VariantValueDraft[][]) =>
  axes.reduce<VariantValueDraft[][]>(
    (combinations, axis) =>
      combinations.flatMap((combination) =>
        axis.map((value) => [...combination, value])
      ),
    [[]]
  )

type MediaPickerMode = "featured" | "gallery" | "gallery-replace"

const numberValue = {
  setValueAs: (value: string) => (value === "" ? null : Number(value)),
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "")
    reader.readAsDataURL(file)
  })
}

function getUploadedMediaId(media: unknown) {
  if (!media || typeof media !== "object") return ""
  return "id" in media && typeof media.id === "string" ? media.id : ""
}

function getUploadedMediaUrl(media: unknown) {
  if (!media || typeof media !== "object") return ""
  if ("secureUrl" in media && typeof media.secureUrl === "string")
    return media.secureUrl
  if ("url" in media && typeof media.url === "string") return media.url
  return ""
}

type LoadedProductMedia = {
  thumbnailMedia?: unknown
  image?: {
    media?: unknown
  } | null
  images?: Array<{
    mediaId?: string | null
    media?: unknown
  }>
}

function ControlledCheckbox({
  control,
  name,
  label,
  description,
}: {
  control: ProductFormControl
  name: FieldPath<ProductFormInput>
  label: string
  description?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/40 p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-colors hover:border-primary/25 hover:bg-background">
          <Checkbox
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
            className="mt-0.5 rounded-md border-muted-foreground/25 transition-colors group-hover:border-primary/45"
          />
          <span className="flex flex-col gap-1">
            <span className="text-sm leading-5 font-semibold text-foreground">
              {label}
            </span>
            {description && (
              <span className="text-xs leading-5 text-muted-foreground">
                {description}
              </span>
            )}
          </span>
        </label>
      )}
    />
  )
}

function ArrayCheckbox({
  control,
  name,
  value,
  label,
  style,
  className,
}: {
  control: ProductFormControl
  name: "categoryIds" | "tagIds" | "brandIds" | "galleryMediaIds"
  value: string
  label: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selected = Array.isArray(field.value) ? field.value : []

        return (
          <label
            style={style}
            className={cn("flex cursor-pointer items-center gap-2 text-sm", className)}
          >
            <Checkbox
              checked={selected.includes(value)}
              onCheckedChange={(checked) => {
                field.onChange(
                  checked
                    ? [...selected, value]
                    : selected.filter((item) => item !== value)
                )
              }}
            />
            <span>{label}</span>
          </label>
        )
      }}
    />
  )
}

const seoStatusConfig: Record<
  SeoCheckStatus,
  { label: string; className: string; dotClassName: string }
> = {
  good: {
    label: "Tốt",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  warning: {
    label: "Cần tối ưu",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  error: {
    label: "Thiếu",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    dotClassName: "bg-rose-500",
  },
}

function SeoAnalysisPanel({ analysis }: { analysis: ProductSeoAnalysis }) {
  const status = seoStatusConfig[analysis.rating]

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Điểm SEO sản phẩm</p>
          <p className="text-xs text-muted-foreground">
            {analysis.wordCount} từ · mật độ keyword {analysis.keywordDensity}%
            · {analysis.keywordOccurrences} lần xuất hiện
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className={
                analysis.rating === "good"
                  ? "h-full bg-emerald-500"
                  : analysis.rating === "warning"
                    ? "h-full bg-amber-500"
                    : "h-full bg-rose-500"
              }
              style={{ width: `${analysis.score}%` }}
            />
          </div>
          <Badge variant="outline" className={status.className}>
            {analysis.score}/100 · {status.label}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {analysis.groups.map((group) => {
          const failedCount = group.checks.filter(
            (check) => check.status === "error"
          ).length
          const warningCount = group.checks.filter(
            (check) => check.status === "warning"
          ).length

          return (
            <div key={group.id} className="rounded-xl border bg-background p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{group.title}</p>
                <span className="text-xs text-muted-foreground">
                  {failedCount
                    ? `${failedCount} lỗi`
                    : warningCount
                      ? `${warningCount} cần tối ưu`
                      : "All good"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.checks.map((check) => {
                  const checkStatus = seoStatusConfig[check.status]

                  return (
                    <div
                      key={check.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span
                        className={`mt-1.5 size-2 rounded-full ${checkStatus.dotClassName}`}
                      />
                      <span className="flex-1">
                        <span>{check.label}</span>
                        {check.detail && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {check.detail}
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type ImageAlignment = "left" | "center" | "right" | "none"

type ImageToolbarState = {
  top: number
  left: number
}

type ImageOverlayState = {
  top: number
  left: number
  width: number
  height: number
}

type ResizeHandle = "nw" | "ne" | "sw" | "se"

const showLegacyImageTools = false

type StoredImageDetails = {
  alt: string
  caption: string
  link: string
  size: string
  alignment: ImageAlignment
}

function getImageDetailsKey(img: HTMLImageElement) {
  return img.currentSrc || img.src
}

function getNextElementSibling(node: Node) {
  let nextNode = node.nextSibling

  while (
    nextNode?.nodeType === Node.TEXT_NODE &&
    !nextNode.textContent?.trim()
  ) {
    nextNode = nextNode.nextSibling
  }

  return nextNode instanceof HTMLElement ? nextNode : null
}

function isSimpleCaptionElement(element: HTMLElement) {
  const text = element.textContent?.trim() ?? ""

  return (
    Boolean(text) &&
    text.length <= 160 &&
    ["P", "DIV", "SPAN", "FIGCAPTION"].includes(element.tagName) &&
    !element.querySelector(
      "img, video, iframe, table, ul, ol, a, button, input, textarea, select"
    )
  )
}

function getLegacyCaptionElement(
  img: HTMLImageElement,
  expectedCaption?: string
) {
  const figure = img.closest<HTMLElement>("figure.duky-editor-image-figure")
  const imageContainer = figure ?? img.closest<HTMLElement>("a") ?? img
  const candidate = getNextElementSibling(imageContainer)
  if (!candidate || !isSimpleCaptionElement(candidate)) return null

  const candidateText = candidate.textContent?.trim() ?? ""
  if (candidate.dataset.imageCaption === "true") return candidate
  if (candidate.classList.contains("duky-editor-image-caption"))
    return candidate
  if (expectedCaption && candidateText === expectedCaption.trim())
    return candidate

  return null
}

function removeLegacyCaptionElements(
  img: HTMLImageElement,
  captions: string[]
) {
  const captionSet = new Set(
    captions.map((item) => item.trim()).filter(Boolean)
  )
  const figure = img.closest<HTMLElement>("figure.duky-editor-image-figure")
  const imageContainer = figure ?? img.closest<HTMLElement>("a") ?? img
  let candidate = getNextElementSibling(imageContainer)
  let removedCount = 0

  while (candidate && removedCount < 5 && isSimpleCaptionElement(candidate)) {
    const candidateText = candidate.textContent?.trim() ?? ""
    const matchesKnownCaption = Array.from(captionSet).some(
      (captionText) =>
        candidateText === captionText ||
        (captionText.length >= 4 &&
          candidateText.length >= 4 &&
          (candidateText.includes(captionText) ||
            captionText.includes(candidateText)))
    )
    const shouldRemove =
      candidate.dataset.imageCaption === "true" ||
      candidate.classList.contains("duky-editor-image-caption") ||
      matchesKnownCaption

    if (!shouldRemove) break

    const nextCandidate = getNextElementSibling(candidate)
    candidate.remove()
    candidate = nextCandidate
    removedCount += 1
  }
}

function getImageCaption(img: HTMLImageElement) {
  const figure = img.closest<HTMLElement>("figure.duky-editor-image-figure")
  const figureCaption = figure?.querySelector("figcaption")?.textContent?.trim()
  if (figureCaption) return figureCaption

  const storedCaption = img.dataset.caption?.trim()
  const legacyCaption = getLegacyCaptionElement(
    img,
    storedCaption
  )?.textContent?.trim()
  return legacyCaption || storedCaption || ""
}

function applyImageCaption(img: HTMLImageElement, caption: string) {
  const nextCaption = caption.trim()
  const existingFigure = img.closest<HTMLElement>(
    "figure.duky-editor-image-figure"
  )
  const previousCaption =
    existingFigure?.querySelector("figcaption")?.textContent?.trim() ??
    img.dataset.caption ??
    ""

  if (!nextCaption) {
    img.removeAttribute("data-caption")
    removeLegacyCaptionElements(img, [previousCaption])

    if (existingFigure) {
      existingFigure.querySelector("figcaption")?.remove()

      const imageContainer = img.closest("a") ?? img
      existingFigure.before(imageContainer)
      existingFigure.remove()
    }

    return
  }

  img.dataset.caption = nextCaption

  const imageContainer = img.closest("a") ?? img
  let figure = existingFigure

  if (!figure) {
    figure = document.createElement("figure")
    figure.className = "duky-editor-image-figure"
    imageContainer.before(figure)
    figure.appendChild(imageContainer)
  }

  let figcaption = figure.querySelector("figcaption")
  if (!figcaption) {
    figcaption = document.createElement("figcaption")
    figure.appendChild(figcaption)
  }

  figcaption.textContent = nextCaption
  figcaption.dataset.imageCaption = "true"
  figcaption.classList.add("duky-editor-image-caption")
  removeLegacyCaptionElements(img, [previousCaption, nextCaption])
}

function getImageAlignment(img: HTMLImageElement): ImageAlignment {
  const target = img.closest<HTMLElement>("a") ?? img

  if (target.dataset.align === "left") return "left"
  if (target.dataset.align === "right") return "right"
  if (target.dataset.align === "center") return "center"
  if (target.classList.contains("ql-resize-style-left")) return "left"
  if (target.classList.contains("ql-resize-style-right")) return "right"
  if (target.classList.contains("ql-resize-style-center")) return "center"
  if (target.style.float === "left") return "left"
  if (target.style.float === "right") return "right"
  if (
    target.style.display === "block" &&
    target.style.marginLeft === "auto" &&
    target.style.marginRight === "auto"
  ) {
    return "center"
  }
  return "none"
}

function applyImageAlignment(img: HTMLImageElement, alignment: ImageAlignment) {
  const target = img.closest<HTMLElement>("a") ?? img

  ;[img, target].forEach((element) => {
    element.classList.remove(
      "ql-resize-style-left",
      "ql-resize-style-center",
      "ql-resize-style-right",
      "ql-resize-style-full"
    )
    element.style.float = ""
    element.style.display = ""
    element.style.margin = ""
    element.style.marginLeft = ""
    element.style.marginRight = ""
    element.removeAttribute("data-align")
  })

  if (alignment === "left") {
    target.classList.add("ql-resize-style-left")
    target.style.float = "left"
    target.style.margin = "0 16px 12px 0"
    target.setAttribute("data-align", "left")
    img.style.display = "block"
  }

  if (alignment === "center") {
    target.classList.add("ql-resize-style-center")
    target.style.display = "block"
    target.style.marginLeft = "auto"
    target.style.marginRight = "auto"
    target.setAttribute("data-align", "center")
    img.style.display = "block"
  }

  if (alignment === "right") {
    target.classList.add("ql-resize-style-right")
    target.style.float = "right"
    target.style.margin = "0 0 12px 16px"
    target.setAttribute("data-align", "right")
    img.style.display = "block"
  }
}

function applyImageSize(
  img: HTMLImageElement,
  imageSize: string,
  editorWidth?: number
) {
  img.style.height = "auto"
  img.removeAttribute("height")

  if (imageSize === "full") {
    img.style.width = editorWidth ? `${Math.round(editorWidth)}px` : ""
    img.style.maxWidth = "100%"
    if (editorWidth) {
      img.setAttribute("width", String(Math.round(editorWidth)))
    } else {
      img.removeAttribute("width")
    }
    return
  }

  if (imageSize.endsWith("%")) {
    const percent = Number.parseFloat(imageSize)
    const baseWidth =
      editorWidth ||
      img.closest<HTMLElement>(".ql-editor")?.clientWidth ||
      img.parentElement?.clientWidth
    if (Number.isFinite(percent) && baseWidth) {
      const pixelWidth = Math.max(80, Math.round((baseWidth * percent) / 100))
      img.style.width = `${pixelWidth}px`
      img.style.maxWidth = "100%"
      img.setAttribute("width", String(pixelWidth))
    }
    return
  }

  img.style.width = imageSize
  img.style.maxWidth = "100%"

  const numericWidth = Number.parseInt(imageSize, 10)
  if (Number.isFinite(numericWidth)) {
    img.setAttribute("width", String(numericWidth))
  }
}

function RichTextEditorWithImageTools({
  value,
  onChange,
  minHeightClass,
}: {
  value: string
  onChange: (value: string) => void
  minHeightClass: string
}) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const imageAltInputRef = React.useRef<HTMLTextAreaElement>(null)
  const imageCaptionInputRef = React.useRef<HTMLTextAreaElement>(null)
  const imageLinkInputRef = React.useRef<HTMLInputElement>(null)
  const imageReplaceInputRef = React.useRef<HTMLInputElement>(null)
  const selectedImageRef = React.useRef<HTMLImageElement | null>(null)
  const isResizingImageRef = React.useRef(false)
  const imageDetailsBySrcRef = React.useRef(
    new Map<string, StoredImageDetails>()
  )
  const [toolbar, setToolbar] = React.useState<ImageToolbarState | null>(null)
  const [overlay, setOverlay] = React.useState<ImageOverlayState | null>(null)
  const [selectedAlignment, setSelectedAlignment] =
    React.useState<ImageAlignment>("none")
  const [editingImage, setEditingImage] = React.useState(false)
  const [editingImageSrc, setEditingImageSrc] = React.useState("")
  const [pendingImageSrc, setPendingImageSrc] = React.useState("")
  const [imageAlt, setImageAlt] = React.useState("")
  const [imageCaption, setImageCaption] = React.useState("")
  const [imageLink, setImageLink] = React.useState("")
  const [imageSize, setImageSize] = React.useState("full")
  const [localValue, setLocalValue] = React.useState(value)

  const syncHtml = React.useCallback(() => {
    const editor = wrapperRef.current?.querySelector<HTMLElement>(".ql-editor")
    if (editor) {
      const nextHtml = editor.innerHTML
      setLocalValue(nextHtml)
      onChange(nextHtml)
    }
  }, [onChange])

  React.useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const disableSpellcheck = () => {
      const editor = wrapper.querySelector<HTMLElement>(".ql-editor")
      if (!editor) return

      editor.setAttribute("spellcheck", "false")
      editor.setAttribute("autocorrect", "off")
      editor.setAttribute("autocapitalize", "off")
    }

    disableSpellcheck()

    const observer = new MutationObserver(disableSpellcheck)
    observer.observe(wrapper, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  React.useLayoutEffect(() => {
    const editor = wrapperRef.current?.querySelector<HTMLElement>(".ql-editor")
    if (!editor || !editingImage) return

    const previousContentEditable = editor.getAttribute("contenteditable")
    if (editor.contains(document.activeElement)) {
      ;(document.activeElement as HTMLElement).blur()
    }

    editor.setAttribute("contenteditable", "false")

    return () => {
      if (previousContentEditable === null) {
        editor.removeAttribute("contenteditable")
      } else {
        editor.setAttribute("contenteditable", previousContentEditable)
      }
    }
  }, [editingImage])

  const openImageDetailsForImage = React.useCallback(
    (image: HTMLImageElement) => {
      const storedDetails = imageDetailsBySrcRef.current.get(
        getImageDetailsKey(image)
      )
      const currentAlignment = getImageAlignment(image)

      selectedImageRef.current = image
      setSelectedAlignment(storedDetails?.alignment ?? currentAlignment)
      setEditingImage(true)
      setEditingImageSrc(image.currentSrc || image.src)
      setPendingImageSrc("")
      setImageAlt(storedDetails?.alt ?? image.alt ?? "")
      setImageCaption(storedDetails?.caption ?? getImageCaption(image))
      setImageLink(
        storedDetails?.link ?? image.closest("a")?.getAttribute("href") ?? ""
      )
      setImageSize(
        storedDetails?.size ||
          image.style.width ||
          (image.getAttribute("width")
            ? `${image.getAttribute("width")}px`
            : "full")
      )
    },
    []
  )

  const findImageFromResizeOverlay = React.useCallback(() => {
    const wrapper = wrapperRef.current
    const overlayElement =
      wrapper?.querySelector<HTMLElement>(".ql-resize-overlay")
    if (!wrapper || !overlayElement) return null

    const overlayRect = overlayElement.getBoundingClientRect()
    const images = Array.from(
      wrapper.querySelectorAll<HTMLImageElement>(".ql-editor img")
    )

    return (
      images.find((image) => {
        const imageRect = image.getBoundingClientRect()
        return (
          Math.abs(imageRect.left - overlayRect.left) < 4 &&
          Math.abs(imageRect.top - overlayRect.top) < 4 &&
          Math.abs(imageRect.width - overlayRect.width) < 4
        )
      }) ?? selectedImageRef.current
    )
  }, [])

  React.useEffect(() => {
    const openImageDetailsFromToolbar = (event: Event) => {
      const image = (event as CustomEvent<{ image?: unknown }>).detail?.image
      if (!(image instanceof HTMLImageElement)) return
      if (!wrapperRef.current?.contains(image)) return

      openImageDetailsForImage(image)
    }

    window.addEventListener(
      "duky:edit-editor-image",
      openImageDetailsFromToolbar
    )
    return () =>
      window.removeEventListener(
        "duky:edit-editor-image",
        openImageDetailsFromToolbar
      )
  }, [openImageDetailsForImage])

  React.useEffect(() => {
    const openImageDetailsFromEditButton = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const editButton = target.closest(
        ".duky-quill-image-edit, .ql-resize-toolbar-edit"
      )
      if (!editButton || !wrapperRef.current?.contains(editButton)) return

      const image = findImageFromResizeOverlay()
      if (image) {
        event.preventDefault()
        event.stopPropagation()
        openImageDetailsForImage(image)
      }
    }

    document.addEventListener("click", openImageDetailsFromEditButton, true)
    return () =>
      document.removeEventListener(
        "click",
        openImageDetailsFromEditButton,
        true
      )
  }, [findImageFromResizeOverlay, openImageDetailsForImage])

  const clearSelectedImage = React.useCallback(() => {
    wrapperRef.current
      ?.querySelectorAll(".duky-editor-image-selected")
      .forEach((node) => node.classList.remove("duky-editor-image-selected"))
  }, [])

  const positionToolbar = React.useCallback(
    (img: HTMLImageElement) => {
      const wrapper = wrapperRef.current
      if (!wrapper) return

      clearSelectedImage()
      img.classList.add("duky-editor-image-selected")

      const imageRect = img.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()

      setToolbar({
        top: imageRect.top - wrapperRect.top - 42 + wrapper.scrollTop,
        left:
          imageRect.left -
          wrapperRect.left +
          imageRect.width / 2 +
          wrapper.scrollLeft,
      })
      setOverlay({
        top: imageRect.top - wrapperRect.top + wrapper.scrollTop,
        left: imageRect.left - wrapperRect.left + wrapper.scrollLeft,
        width: imageRect.width,
        height: imageRect.height,
      })
      selectedImageRef.current = img
      setSelectedAlignment(getImageAlignment(img))
    },
    [clearSelectedImage]
  )

  const applyAlignment = (alignment: ImageAlignment) => {
    const img = selectedImageRef.current
    if (!img) return

    applyImageAlignment(img, alignment)

    positionToolbar(img)
    setSelectedAlignment(alignment)
    syncHtml()
  }

  const removeImage = () => {
    const img = selectedImageRef.current
    if (!img) return

    img.remove()
    selectedImageRef.current = null
    setToolbar(null)
    setOverlay(null)
    syncHtml()
  }

  const beginResize = (
    handle: ResizeHandle,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const img = selectedImageRef.current
    if (!img) return

    isResizingImageRef.current = true

    const startX = event.clientX
    const startLeft = overlay?.left ?? img.getBoundingClientRect().left
    const startWidth = img.getBoundingClientRect().width
    const startHeight = img.getBoundingClientRect().height
    const ratio = startHeight > 0 ? startWidth / startHeight : 1
    const direction = handle === "nw" || handle === "sw" ? -1 : 1

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) * direction
      const nextWidth = Math.max(80, Math.round(startWidth + deltaX))
      const nextHeight = Math.round(nextWidth / ratio)
      const nextLeft =
        handle === "nw" || handle === "sw"
          ? startLeft + startWidth - nextWidth
          : startLeft

      img.style.width = `${nextWidth}px`
      img.style.height = "auto"
      img.style.maxWidth = "100%"
      img.setAttribute("width", String(nextWidth))
      img.removeAttribute("height")

      if (overlayRef.current) {
        overlayRef.current.style.width = `${nextWidth}px`
        overlayRef.current.style.height = `${nextHeight}px`
        overlayRef.current.style.left = `${nextLeft}px`
      }
    }

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      syncHtml()
      window.requestAnimationFrame(() => {
        positionToolbar(img)
        syncHtml()
      })
      window.setTimeout(() => {
        isResizingImageRef.current = false
      }, 300)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  const openImageDetails = () => {
    const img = selectedImageRef.current
    if (!img) return

    setEditingImage(true)
    setEditingImageSrc(img.currentSrc || img.src)
    setPendingImageSrc("")
    setImageAlt(img.alt || "")
    setImageCaption(getImageCaption(img))
    setImageLink(img.closest("a")?.getAttribute("href") || "")
    setImageSize(img.style.width || "full")
  }

  const updateImageDetails = () => {
    const img = selectedImageRef.current
    if (!img) return

    const nextImageAlt = imageAltInputRef.current?.value ?? imageAlt
    const nextImageCaption = imageCaptionInputRef.current?.value ?? imageCaption
    const nextImageLink = imageLinkInputRef.current?.value ?? imageLink
    const previousKey = getImageDetailsKey(img)

    img.alt = nextImageAlt

    if (pendingImageSrc) {
      img.src = pendingImageSrc
      img.removeAttribute("srcset")
    }

    const editorWidth =
      wrapperRef.current?.querySelector<HTMLElement>(".ql-editor")?.clientWidth
    applyImageSize(img, imageSize, editorWidth)

    const parentLink = img.closest("a")
    if (nextImageLink) {
      if (parentLink) {
        parentLink.setAttribute("href", nextImageLink)
      } else {
        const anchor = document.createElement("a")
        anchor.href = nextImageLink
        img.before(anchor)
        anchor.appendChild(img)
      }
    } else if (parentLink) {
      parentLink.replaceWith(img)
    }

    applyImageCaption(img, nextImageCaption)

    if (pendingImageSrc) {
      imageDetailsBySrcRef.current.delete(previousKey)
    }
    imageDetailsBySrcRef.current.set(getImageDetailsKey(img), {
      alt: nextImageAlt,
      caption: nextImageCaption,
      link: nextImageLink,
      size: imageSize,
      alignment: getImageAlignment(img),
    })

    setImageAlt(nextImageAlt)
    setImageCaption(nextImageCaption)
    setImageLink(nextImageLink)
    setPendingImageSrc("")
    setEditingImage(false)
    syncHtml()
    window.requestAnimationFrame(syncHtml)
  }

  const replaceImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const img = selectedImageRef.current
    const file = event.target.files?.[0]

    event.target.value = ""
    if (!img || !file) return

    const reader = new FileReader()
    reader.onload = () => {
      const nextSrc = typeof reader.result === "string" ? reader.result : ""
      if (!nextSrc) return

      setEditingImageSrc(nextSrc)
      setPendingImageSrc(nextSrc)
    }
    reader.readAsDataURL(file)
  }

  const handleMouseOver = () => {}

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof HTMLImageElement) {
      selectedImageRef.current = target
    }
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (target instanceof HTMLImageElement) {
      openImageDetailsForImage(target)
    }
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={`duky-rich-editor relative overflow-hidden rounded-xl border bg-background [&_.ql-container]:border-0 [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-muted/30 ${minHeightClass}`}
        onMouseOver={handleMouseOver}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <ReactQuill
          theme="snow"
          value={localValue}
          onChange={(nextValue) => {
            if (isResizingImageRef.current) return
            setLocalValue(nextValue)
            onChange(nextValue)
          }}
          modules={quillModules}
        />

        {showLegacyImageTools && overlay && (
          <div
            ref={overlayRef}
            data-image-toolbar
            className="pointer-events-none absolute z-10 border-2 border-ring"
            style={{
              top: overlay.top,
              left: overlay.left,
              width: overlay.width,
              height: overlay.height,
            }}
          >
            {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
              <button
                key={handle}
                type="button"
                aria-label="Kéo để đổi kích thước ảnh"
                className={[
                  "pointer-events-auto absolute size-3 border border-foreground bg-background",
                  handle === "nw"
                    ? "-top-1.5 -left-1.5 cursor-nwse-resize"
                    : "",
                  handle === "ne"
                    ? "-top-1.5 -right-1.5 cursor-nesw-resize"
                    : "",
                  handle === "sw"
                    ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                    : "",
                  handle === "se"
                    ? "-right-1.5 -bottom-1.5 cursor-nwse-resize"
                    : "",
                ].join(" ")}
                onMouseDown={(event) => beginResize(handle, event)}
              />
            ))}
          </div>
        )}

        {showLegacyImageTools && toolbar && (
          <div
            data-image-toolbar
            className="absolute z-20 flex -translate-x-1/2 items-center rounded-sm border bg-popover text-popover-foreground shadow-lg"
            style={{ top: Math.max(8, toolbar.top), left: toolbar.left }}
          >
            <Button
              type="button"
              variant={selectedAlignment === "left" ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-none"
              title="Căn trái"
              onClick={() => applyAlignment("left")}
            >
              <IconAlignLeft />
            </Button>
            <Button
              type="button"
              variant={selectedAlignment === "center" ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-none"
              title="Chính giữa"
              onClick={() => applyAlignment("center")}
            >
              <IconAlignCenter />
            </Button>
            <Button
              type="button"
              variant={selectedAlignment === "right" ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-none"
              title="Căn phải"
              onClick={() => applyAlignment("right")}
            >
              <IconAlignRight />
            </Button>
            <Button
              type="button"
              variant={selectedAlignment === "none" ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-none text-xs"
              title="Không căn"
              onClick={() => applyAlignment("none")}
            >
              Trống
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              title="Sửa chi tiết ảnh"
              onClick={openImageDetails}
            >
              <IconPencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              title="Xóa ảnh"
              onClick={removeImage}
            >
              <IconX />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={editingImage} onOpenChange={setEditingImage}>
        <DialogContent
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-xl p-0"
          showCloseButton={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle className="sr-only">Chi tiết hình ảnh</DialogTitle>
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-semibold">Chi tiết hình ảnh</h2>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="icon">
                <IconX />
              </Button>
            </DialogClose>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6 border-r p-6">
              <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                <Label htmlFor="imageAlt" className="pt-2 text-right">
                  Văn bản thay thế
                </Label>
                <div className="flex flex-col gap-2">
                  <Textarea
                    id="imageAlt"
                    ref={imageAltInputRef}
                    defaultValue={imageAlt}
                    className="min-h-[70px] rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Để trống nếu ảnh chỉ dùng làm hiệu ứng trang trí.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                <Label htmlFor="imageCaption" className="pt-2 text-right">
                  Chú thích
                </Label>
                <Textarea
                  id="imageCaption"
                  ref={imageCaptionInputRef}
                  defaultValue={imageCaption}
                  className="min-h-[70px] rounded-xl"
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  Cài đặt hiển thị
                </p>
                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <Label className="text-right">Kích cỡ</Label>
                  <Select value={imageSize} onValueChange={setImageSize}>
                    <SelectTrigger className="w-[280px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Kích thước đầy đủ</SelectItem>
                      <SelectItem value="75%">Lớn - 75%</SelectItem>
                      <SelectItem value="50%">Trung bình - 50%</SelectItem>
                      <SelectItem value="320px">Nhỏ - 320px</SelectItem>
                      {imageSize.endsWith("px") && imageSize !== "320px" && (
                        <SelectItem value={imageSize}>
                          Hiện tại - {imageSize}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                  <Label htmlFor="imageLink" className="text-right">
                    Liên kết tới
                  </Label>
                  <Input
                    id="imageLink"
                    ref={imageLinkInputRef}
                    defaultValue={imageLink}
                    placeholder="Trống"
                    className="max-w-md rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-muted/30 p-6">
              <input
                ref={imageReplaceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={replaceImage}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editingImageSrc}
                alt={imageAlt || "Xem trước"}
                className="max-h-[420px] w-full rounded-lg border bg-background object-contain"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => imageReplaceInputRef.current?.click()}
                >
                  Thay thế
                </Button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end border-t bg-background px-6 py-4">
            <Button
              type="button"
              className="rounded-xl"
              onClick={updateImageDetails}
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function buildCategoryTreeOrder(categories: Category[]): Category[] {
  const map = new Map<string, Category[]>()
  const roots: Category[] = []

  categories.forEach((cat) => {
    if (!cat.parentId) {
      roots.push(cat)
    } else {
      const children = map.get(cat.parentId) || []
      children.push(cat)
      map.set(cat.parentId, children)
    }
  })

  const result: Category[] = []

  const traverse = (node: Category) => {
    result.push(node)
    const children = map.get(node.id)
    if (children) {
      children.forEach((child) => traverse(child))
    }
  }

  roots.forEach((root) => traverse(root))

  // Đề phòng các category bị mồ côi (nếu có lỗi parentId)
  const addedIds = new Set(result.map((r) => r.id))
  categories.forEach((cat) => {
    if (!addedIds.has(cat.id)) {
      result.push(cat)
    }
  })

  return result
}

function getCategoryDepth(cat: Category, allCats: Category[]): number {
  let depth = 0
  let current = cat
  const catMap = new Map(allCats.map((c) => [c.id, c]))
  while (current.parentId) {
    const parent = catMap.get(current.parentId)
    if (!parent || parent.id === current.id) break
    depth++
    current = parent
  }
  return depth
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === "new"

  const [isLoading, setIsLoading] = React.useState(!isNew)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isIndexingLoading, setIsIndexingLoading] = React.useState(false)
  const [featuredImageSrc, setFeaturedImageSrc] = React.useState("")
  const [galleryImages, setGalleryImages] = React.useState<string[]>([])
  const [galleryImageIds, setGalleryImageIds] = React.useState<string[]>([])
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [mediaPickerMode, setMediaPickerMode] =
    React.useState<MediaPickerMode>("gallery")
  const [mediaPickerReplaceIndex, setMediaPickerReplaceIndex] = React.useState<
    number | null
  >(null)
  const [mediaItems, setMediaItems] = React.useState<Media[]>([])
  const [mediaSearch, setMediaSearch] = React.useState("")
  const [isLoadingMedia, setIsLoadingMedia] = React.useState(false)
  const [productOptions, setProductOptions] = React.useState<ProductListItem[]>(
    []
  )
  const [relationSearch, setRelationSearch] = React.useState("")
  const [productAttributes, setProductAttributes] = React.useState<
    ProductAttribute[]
  >([])
  const [variantGroups, setVariantGroups] = React.useState<
    VariantAttributeGroup[]
  >([createVariantGroup()])
  const [combineVariantGroups, setCombineVariantGroups] = React.useState(true)
  const [variantDrafts, setVariantDrafts] = React.useState<VariantDraft[]>([])
  const [isLoadingVariantTerms, setIsLoadingVariantTerms] = React.useState(true)
  const [variantSizeInput, setVariantSizeInput] = React.useState("")
  const [variantColorInput, setVariantColorInput] = React.useState("")
  const [variantSkuPrefix, setVariantSkuPrefix] = React.useState("")
  const [isGeneratingVariants, setIsGeneratingVariants] = React.useState(false)
  const [productDataTab, setProductDataTab] = React.useState("general")
  const [detailFeedback, setDetailFeedback] = React.useState<{
    message: string
    tone: "success" | "error" | "info"
  } | null>(null)
  const [productCategories, setProductCategories] = React.useState<Category[]>(
    []
  )
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true)
  const [customTags, setCustomTags] = React.useState<string[]>([])
  const [newTag, setNewTag] = React.useState("")

  // Product AI States
  const [aiTask, setAiTask] = React.useState<ProductAiTaskType>(ProductAiTask.SEO)
  const [aiTone, setAiTone] = React.useState("tư vấn bán hàng chuyên nghiệp, hiện đại")
  const [aiResult, setAiResult] = React.useState<ProductAiAssistResult | null>(null)
  const [isAiLoading, setIsAiLoading] = React.useState(false)
  const [isKeywordAiLoading, setIsKeywordAiLoading] = React.useState(false)
  const [aiFeedback, setAiFeedback] = React.useState<{
    message: string
    tone: "success" | "error"
  } | null>(null)
  const [seoKeywordInput, setSeoKeywordInput] = React.useState("")

  // States cho Trợ lý AI Mô tả ngắn và Mô tả chi tiết
  const [showShortDescAiPanel, setShowShortDescAiPanel] = React.useState(false)
  const [shortDescAiPrompt, setShortDescAiPrompt] = React.useState("")
  const [isShortDescAiLoading, setIsShortDescAiLoading] = React.useState(false)
  const [shortDescAiFeedback, setShortDescAiFeedback] = React.useState<{
    message: string
    tone: "success" | "error"
  } | null>(null)

  const [showDescAiPanel, setShowDescAiPanel] = React.useState(false)
  const [descAiPrompt, setDescAiPrompt] = React.useState("")
  const [isDescAiLoading, setIsDescAiLoading] = React.useState(false)
  const [descAiFeedback, setDescAiFeedback] = React.useState<{
    message: string
    tone: "success" | "error"
  } | null>(null)

  const [toast, setToast] = React.useState<{
    message: string
    tone: "success" | "error" | "info"
  } | null>(null)

  React.useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      setToast(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast])

  React.useEffect(() => {
    if (detailFeedback) {
      setToast({
        message: detailFeedback.message,
        tone: detailFeedback.tone,
      })
      setDetailFeedback(null)
    }
  }, [detailFeedback])

  React.useEffect(() => {
    if (aiFeedback) {
      setToast({
        message: aiFeedback.message,
        tone: aiFeedback.tone === "success" ? "success" : "error",
      })
      setAiFeedback(null)
    }
  }, [aiFeedback])

  React.useEffect(() => {
    if (shortDescAiFeedback) {
      setToast({
        message: shortDescAiFeedback.message,
        tone: shortDescAiFeedback.tone === "success" ? "success" : "error",
      })
      setShortDescAiFeedback(null)
    }
  }, [shortDescAiFeedback])

  React.useEffect(() => {
    if (descAiFeedback) {
      setToast({
        message: descAiFeedback.message,
        tone: descAiFeedback.tone === "success" ? "success" : "error",
      })
      setDescAiFeedback(null)
    }
  }, [descAiFeedback])

  const getToastClassName = (tone?: "success" | "error" | "info") => {
    if (tone === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-900/10"
    }
    if (tone === "error") {
      return "border-red-200 bg-red-50 text-red-700 shadow-red-900/10"
    }
    return "border-orange-200 bg-orange-50 text-orange-800 shadow-orange-900/10"
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      type: "SIMPLE",
      status: "DRAFT",
      originalPrice: null,
      salePrice: null,
      contactForPrice: false,
      shortDescription: "",
      description: "",
      thumbnailMediaId: null,
      categoryIds: [],
      tagIds: [],
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      catalogVisibility: "VISIBLE",
      manageStock: false,
      stockQuantity: null,
      lowStockThreshold: null,
      stockStatus: "IN_STOCK",
      soldIndividually: false,
      weight: null,
      length: null,
      width: null,
      height: null,
      shippingClass: "",
      upsellIds: "",
      crossSellIds: "",
      purchaseNote: "",
      menuOrder: null,
      enableReviews: true,
      featuredImageAlt: "",
      galleryMediaIds: [],
      brandIds: [],
      groupedProductIds: "",
      externalUrl: "",
      externalButtonText: "",
      externalButtonAssetType: "none",
      externalButtonAssetValue: "",
      attributes: {
        size: "",
        color: "",
        material: "",
      },
      seo: {
        metaTitle: "",
        metaDescription: "",
        canonicalUrl: "",
        focusKeyword: "",
      },
    },
  })

  const slug = useWatch({ control, name: "slug" })
  const productName = useWatch({ control, name: "name" })
  const productType = useWatch({ control, name: "type" })
  const shortDescription = useWatch({ control, name: "shortDescription" })
  const description = useWatch({ control, name: "description" })
  const featuredImageAlt = useWatch({ control, name: "featuredImageAlt" })
  const seoMetaTitle = useWatch({ control, name: "seo.metaTitle" })
  const seoMetaDescription = useWatch({ control, name: "seo.metaDescription" })
  const seoFocusKeyword = useWatch({ control, name: "seo.focusKeyword" })
  const groupedProductIds = useWatch({ control, name: "groupedProductIds" })
  const upsellIds = useWatch({ control, name: "upsellIds" })
  const crossSellIds = useWatch({ control, name: "crossSellIds" })
  const originalPrice = useWatch({ control, name: "originalPrice" })
  const salePrice = useWatch({ control, name: "salePrice" })
  const externalUrl = useWatch({ control, name: "externalUrl" })
  const externalButtonText = useWatch({ control, name: "externalButtonText" })
  const externalButtonAssetType = useWatch({
    control,
    name: "externalButtonAssetType",
  })
  const externalButtonAssetValue = useWatch({
    control,
    name: "externalButtonAssetValue",
  })
  const ExternalButtonIcon = getExternalButtonIcon(externalButtonAssetValue)
  const currentProductType = productType ?? ProductType.SIMPLE
  const showInventoryTab = currentProductType === ProductType.SIMPLE
  const showShippingTab =
    currentProductType === ProductType.SIMPLE ||
    currentProductType === ProductType.VARIABLE
  const showAttributesTab = currentProductType === ProductType.VARIABLE
  const showOwnPriceFields = currentProductType !== ProductType.GROUPED
  const productPreviewPath = `/san-pham/${slug || "duong-dan-san-pham"}`
  const productPreviewUrl = storefrontUrl
    ? `${storefrontUrl}${productPreviewPath}`
    : productPreviewPath
  const seoAnalysis = React.useMemo(
    () =>
      analyzeProductSeo({
        productName,
        slug,
        metaTitle: seoMetaTitle,
        metaDescription: seoMetaDescription,
        focusKeyword: seoFocusKeyword,
        shortDescriptionHtml: shortDescription,
        descriptionHtml: description,
        imageAlts: [featuredImageAlt],
        hasImages: Boolean(featuredImageSrc || galleryImages.length),
      }),
    [
      description,
      featuredImageAlt,
      featuredImageSrc,
      galleryImages.length,
      productName,
      seoFocusKeyword,
      seoMetaDescription,
      seoMetaTitle,
      shortDescription,
      slug,
    ]
  )

  const seoKeywords = React.useMemo(
    () => (seoFocusKeyword || "").split(",").map((k) => k.trim()).filter(Boolean),
    [seoFocusKeyword]
  )

  const updateFocusKeyword = React.useCallback(
    (value: string) => {
      setValue("seo.focusKeyword", value, { shouldDirty: true, shouldValidate: true })
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

  const buildSeoAnalysisForAi = (analysis: ProductSeoAnalysis) => {
    const failedChecks: string[] = []
    analysis.groups.forEach((group) => {
      group.checks.forEach((check) => {
        if (check.status !== "good") {
          failedChecks.push(`${check.label}: ${check.detail || "Không đạt"}`)
        }
      })
    })
    return {
      score: analysis.score,
      failedChecks,
    }
  }

  const runProductAi = async () => {
    try {
      setIsAiLoading(true)
      setAiResult(null)
      setAiFeedback(null)

      const selectedCategories = productCategories
        .filter((c) => (getValues("categoryIds") ?? []).includes(c.id))
        .map((c) => ({
          title: c.name,
          slug: c.slug,
          url: `/danh-muc/${c.slug}`,
        }))

      // Chuẩn bị URL ảnh tuyệt đối
      const images: string[] = []
      if (featuredImageSrc) {
        images.push(
          featuredImageSrc.startsWith("http")
            ? featuredImageSrc
            : `${window.location.origin}${featuredImageSrc}`
        )
      }
      galleryImages.forEach((img) => {
        if (img) {
          images.push(
            img.startsWith("http") ? img : `${window.location.origin}${img}`
          )
        }
      })

      // Thu thập thông tin biến thể
      const variantsPayload = variantDrafts.map((d) => ({
        sku: d.sku,
        price: d.price,
        salePrice: d.salePrice,
        isActive: d.isActive,
        values: d.values.map((v) => ({
          attribute: v.attributeName,
          value: v.termName,
        })),
      }))

      const result = await productService.assistWithAi({
        task: aiTask,
        name: productName || "",
        slug: slug || "",
        shortDescription: shortDescription || "",
        description: description || "",
        focusKeyword: (seoFocusKeyword || "").trim(),
        productType: productType || "SIMPLE",
        tone: aiTone,
        categories: selectedCategories,
        originalPrice: typeof originalPrice === "number" ? originalPrice : null,
        salePrice: typeof salePrice === "number" ? salePrice : null,
        stockQuantity: (getValues("stockQuantity") as any) ?? null,
        variants: variantsPayload,
        images,
        extraContext: {
          currentSeoScore: seoAnalysis?.score ?? null,
          seoAnalysis: buildSeoAnalysisForAi(seoAnalysis),
          lockedFocusKeyword: (seoFocusKeyword || "").trim() || null,
        },
      })

      setAiResult(result)
      setAiFeedback({
        message: "AI đã gợi ý tối ưu thành công. Hãy chọn áp dụng.",
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to run product AI", error)
      setAiFeedback({
        message: "Có lỗi xảy ra khi kết nối trợ lý AI.",
        tone: "error",
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  const runShortDescAi = async () => {
    try {
      setIsShortDescAiLoading(true)
      setShortDescAiFeedback(null)

      const selectedCategories = productCategories
        .filter((c) => (getValues("categoryIds") ?? []).includes(c.id))
        .map((c) => ({
          title: c.name,
          slug: c.slug,
          url: `/danh-muc/${c.slug}`,
        }))

      const images: string[] = []
      if (featuredImageSrc) {
        images.push(
          featuredImageSrc.startsWith("http")
            ? featuredImageSrc
            : `${window.location.origin}${featuredImageSrc}`
        )
      }
      galleryImages.forEach((img) => {
        if (img) {
          images.push(
            img.startsWith("http") ? img : `${window.location.origin}${img}`
          )
        }
      })

      const variantsPayload = variantDrafts.map((d) => ({
        sku: d.sku,
        price: d.price,
        salePrice: d.salePrice,
        isActive: d.isActive,
        values: d.values.map((v) => ({
          attribute: v.attributeName,
          value: v.termName,
        })),
      }))

      const result = await productService.assistWithAi({
        task: ProductAiTask.OPTIMIZE,
        name: productName || "",
        slug: slug || "",
        shortDescription: shortDescription || "",
        description: description || "",
        focusKeyword: (seoFocusKeyword || "").trim(),
        productType: productType || "SIMPLE",
        tone: aiTone,
        categories: selectedCategories,
        originalPrice: typeof originalPrice === "number" ? originalPrice : null,
        salePrice: typeof salePrice === "number" ? salePrice : null,
        stockQuantity: (getValues("stockQuantity") as any) ?? null,
        variants: variantsPayload,
        images,
        extraContext: {
          mode: "WRITE_SHORT_DESCRIPTION",
          prompt: shortDescAiPrompt.trim(),
        },
      })

      if (result.shortDescription) {
        setValue("shortDescription", result.shortDescription, {
          shouldDirty: true,
          shouldValidate: true,
        })
        setShortDescAiFeedback({
          message: "Đã tạo mô tả ngắn từ AI thành công.",
          tone: "success",
        })
        setShowShortDescAiPanel(false)
        setShortDescAiPrompt("")
      } else {
        setShortDescAiFeedback({
          message: "AI không trả về mô tả ngắn. Hãy thử lại.",
          tone: "error",
        })
      }
    } catch (error) {
      console.error("Failed to run short description AI", error)
      setShortDescAiFeedback({
        message: "Có lỗi xảy ra khi kết nối trợ lý AI.",
        tone: "error",
      })
    } finally {
      setIsShortDescAiLoading(false)
    }
  }

  const runDescAi = async () => {
    try {
      setIsDescAiLoading(true)
      setDescAiFeedback(null)

      const selectedCategories = productCategories
        .filter((c) => (getValues("categoryIds") ?? []).includes(c.id))
        .map((c) => ({
          title: c.name,
          slug: c.slug,
          url: `/danh-muc/${c.slug}`,
        }))

      const images: string[] = []
      if (featuredImageSrc) {
        images.push(
          featuredImageSrc.startsWith("http")
            ? featuredImageSrc
            : `${window.location.origin}${featuredImageSrc}`
        )
      }
      galleryImages.forEach((img) => {
        if (img) {
          images.push(
            img.startsWith("http") ? img : `${window.location.origin}${img}`
          )
        }
      })

      const variantsPayload = variantDrafts.map((d) => ({
        sku: d.sku,
        price: d.price,
        salePrice: d.salePrice,
        isActive: d.isActive,
        values: d.values.map((v) => ({
          attribute: v.attributeName,
          value: v.termName,
        })),
      }))

      const result = await productService.assistWithAi({
        task: ProductAiTask.OPTIMIZE,
        name: productName || "",
        slug: slug || "",
        shortDescription: shortDescription || "",
        description: description || "",
        focusKeyword: (seoFocusKeyword || "").trim(),
        productType: productType || "SIMPLE",
        tone: aiTone,
        categories: selectedCategories,
        originalPrice: typeof originalPrice === "number" ? originalPrice : null,
        salePrice: typeof salePrice === "number" ? salePrice : null,
        stockQuantity: (getValues("stockQuantity") as any) ?? null,
        variants: variantsPayload,
        images,
        extraContext: {
          mode: "WRITE_DESCRIPTION",
          prompt: descAiPrompt.trim(),
        },
      })

      if (result.description) {
        setValue("description", result.description, {
          shouldDirty: true,
          shouldValidate: true,
        })
        setDescAiFeedback({
          message: "Đã tạo mô tả chi tiết từ AI thành công.",
          tone: "success",
        })
        setShowDescAiPanel(false)
        setDescAiPrompt("")
      } else {
        setDescAiFeedback({
          message: "AI không trả về mô tả chi tiết. Hãy thử lại.",
          tone: "error",
        })
      }
    } catch (error) {
      console.error("Failed to run description AI", error)
      setDescAiFeedback({
        message: "Có lỗi xảy ra khi kết nối trợ lý AI.",
        tone: "error",
      })
    } finally {
      setIsDescAiLoading(false)
    }
  }

  const runKeywordAi = async () => {
    try {
      setIsKeywordAiLoading(true)
      setAiFeedback(null)

      const images: string[] = []
      if (featuredImageSrc) {
        images.push(
          featuredImageSrc.startsWith("http")
            ? featuredImageSrc
            : `${window.location.origin}${featuredImageSrc}`
        )
      }
      galleryImages.forEach((img) => {
        if (img) {
          images.push(
            img.startsWith("http") ? img : `${window.location.origin}${img}`
          )
        }
      })

      const variantsPayload = variantDrafts.map((d) => ({
        sku: d.sku,
        price: d.price,
        salePrice: d.salePrice,
        isActive: d.isActive,
        values: d.values.map((v) => ({
          attribute: v.attributeName,
          value: v.termName,
        })),
      }))

      const result = await productService.assistWithAi({
        task: ProductAiTask.SEO,
        name: productName || "",
        slug: slug || "",
        shortDescription: shortDescription || "",
        description: description || "",
        focusKeyword: (seoFocusKeyword || "").trim(),
        productType: productType || "SIMPLE",
        tone: aiTone,
        originalPrice: typeof originalPrice === "number" ? originalPrice : null,
        salePrice: typeof salePrice === "number" ? salePrice : null,
        stockQuantity: (getValues("stockQuantity") as any) ?? null,
        variants: variantsPayload,
        images,
        extraContext: {
          mode: "SEO_KEYWORD_SUGGESTION",
        },
      })

      const suggestedKeyword = result.seo?.focusKeyword ?? ""
      if (!suggestedKeyword) {
        setAiFeedback({
          message: "Không nhận được gợi ý từ khóa từ AI.",
          tone: "error",
        })
        return
      }

      setValue("seo.focusKeyword", suggestedKeyword, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setAiFeedback({
        message: `Đã cập nhật từ khóa gợi ý: "${suggestedKeyword}"`,
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to suggest keywords", error)
      setAiFeedback({
        message: "Không thể gợi ý từ khóa. Vui lòng thử lại sau.",
        tone: "error",
      })
    } finally {
      setIsKeywordAiLoading(false)
    }
  }

  const applyAiSuggestions = () => {
    if (!aiResult) return

    if (aiResult.name) {
      setValue("name", aiResult.name, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    if (aiResult.slug) {
      setValue("slug", aiResult.slug, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    if (aiResult.shortDescription) {
      setValue("shortDescription", aiResult.shortDescription, {
        shouldDirty: true,
      })
    }
    if (aiResult.description) {
      setValue("description", aiResult.description, { shouldDirty: true })
    }
    if (aiResult.seo?.metaTitle) {
      setValue("seo.metaTitle", aiResult.seo.metaTitle, { shouldDirty: true })
    }
    if (aiResult.seo?.metaDescription) {
      setValue("seo.metaDescription", aiResult.seo.metaDescription, {
        shouldDirty: true,
      })
    }
    if (aiResult.seo?.focusKeyword) {
      setValue("seo.focusKeyword", aiResult.seo.focusKeyword, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    setAiResult(null)
    setAiFeedback({
      message: "Đã áp dụng các tối ưu SEO từ AI vào các trường dữ liệu.",
      tone: "success",
    })
  }

  const submitToGoogleIndexing = React.useCallback(async () => {
    if (isNew || !params.id) return

    try {
      setIsIndexingLoading(true)
      const currentSlug = getValues("slug")
      if (!currentSlug) {
        setToast({
          message: "Lỗi: Không tìm thấy URL slug của sản phẩm.",
          tone: "error",
        })
        return
      }

      const productUrl = `/san-pham/${currentSlug}`
      const result = await gscService.submitIndexing(productUrl, "URL_UPDATED")

      if (result?.success) {
        setToast({
          message: "Đã gửi yêu cầu lập chỉ mục Google thành công!",
          tone: "success",
        })
      } else {
        setToast({
          message: "Yêu cầu lập chỉ mục thất bại. Vui lòng cấu hình Google Indexing API.",
          tone: "error",
        })
      }
    } catch (error: any) {
      console.error("Failed to request indexing:", error)
      setToast({
        message: error?.message || "Không thể yêu cầu lập chỉ mục từ Google Search Console.",
        tone: "error",
      })
    } finally {
      setIsIndexingLoading(false)
    }
  }, [isNew, params.id, getValues])

  // Tự động sinh Slug và SKU từ tên sản phẩm khi thêm mới
  React.useEffect(() => {
    if (!isNew || !productName) return

    const nextSlug = slugify(productName)
    setValue("slug", nextSlug, { shouldDirty: true, shouldValidate: true })

    const currentSku = getValues("sku")
    // Tự sinh SKU nếu trường SKU đang trống
    if (!currentSku) {
      const cleanSlug = nextSlug.toUpperCase().replace(/-/g, "")
      const generatedSku = cleanSlug ? `DKS-${cleanSlug}` : ""
      setValue("sku", generatedSku, { shouldDirty: true, shouldValidate: true })
    }
  }, [productName, isNew, setValue, getValues])

  // Tự động sinh thông tin SEO khi thêm mới hoặc các trường tương ứng thay đổi
  React.useEffect(() => {
    if (!isNew) return

    // 1. Tự động sinh Meta Title từ tên sản phẩm
    const currentMetaTitle = getValues("seo.metaTitle")
    if (productName && (!currentMetaTitle || currentMetaTitle === `${productName} | Duky Store`)) {
      setValue("seo.metaTitle", `${productName} | Duky Store`, { shouldDirty: true, shouldValidate: true })
    }

    // 2. Tự động sinh Meta Description từ mô tả ngắn
    const currentMetaDesc = getValues("seo.metaDescription")
    if (shortDescription) {
      const cleanDesc = shortDescription.trim().slice(0, 160)
      if (!currentMetaDesc || currentMetaDesc === cleanDesc) {
        setValue("seo.metaDescription", cleanDesc, { shouldDirty: true, shouldValidate: true })
      }
    }

    // 3. Tự động sinh Canonical URL từ slug
    const currentCanonical = getValues("seo.canonicalUrl")
    const expectedCanonical = slug ? `https://dukystore.vn/products/${slug}` : ""
    if (slug && (!currentCanonical || currentCanonical === expectedCanonical)) {
      setValue("seo.canonicalUrl", expectedCanonical, { shouldDirty: true, shouldValidate: true })
    }
  }, [productName, shortDescription, slug, isNew, setValue, getValues])

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories({ limit: 100 })
        const ordered = buildCategoryTreeOrder(response.data)
        setProductCategories(ordered)
      } catch (error) {
        console.error("Failed to fetch product categories", error)
        setProductCategories([])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  React.useEffect(() => {
    const fetchProductOptions = async () => {
      try {
        const response = await productService.getProducts({ limit: 100 })
        const currentId = isNew ? "" : String(params.id)
        setProductOptions(
          response.data.filter((product) => product.id !== currentId)
        )
      } catch (error) {
        console.error("Failed to fetch product relation options", error)
        setProductOptions([])
      }
    }

    fetchProductOptions()
  }, [isNew, params.id])

  React.useEffect(() => {
    const fetchVariantTerms = async () => {
      try {
        setIsLoadingVariantTerms(true)
        const response = await productAttributeService.getAttributes({
          limit: 100,
        })
        setProductAttributes(response.data)
      } catch (error) {
        console.error("Failed to fetch variant terms", error)
        setProductAttributes([])
      } finally {
        setIsLoadingVariantTerms(false)
      }
    }

    fetchVariantTerms()
  }, [])

  React.useEffect(() => {
    const visibleTabs = new Set([
      "general",
      ...(showInventoryTab ? ["inventory"] : []),
      ...(showShippingTab ? ["shipping"] : []),
      "linked",
      ...(showAttributesTab ? ["attributes"] : []),
      "advanced",
    ])

    if (!visibleTabs.has(productDataTab)) {
      setProductDataTab("general")
    }
  }, [productDataTab, showAttributesTab, showInventoryTab, showShippingTab])

  React.useEffect(() => {
    if (currentProductType === ProductType.VARIABLE) return

    setVariantDrafts([])
    setVariantGroups([createVariantGroup()])
    setCombineVariantGroups(false)
  }, [currentProductType])

  React.useEffect(() => {
    if (!mediaPickerOpen) return

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingMedia(true)
        const response = await mediaService.getMediaList({
          limit: 60,
          search: mediaSearch || undefined,
        })
        setMediaItems(response.data)
      } catch (error) {
        console.error("Failed to fetch media library", error)
        setMediaItems([])
      } finally {
        setIsLoadingMedia(false)
      }
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [mediaPickerOpen, mediaSearch])

  React.useEffect(() => {
    if (currentProductType !== ProductType.VARIABLE) {
      setVariantDrafts([])
      return
    }

    const axes = variantGroups
      .map((group) => {
        const attribute = productAttributes.find(
          (item) => item.id === group.attributeId
        )
        if (!attribute) return []

        return group.selectedTermIds
          .map((termId) => {
            const term = attribute.terms.find((item) => item.id === termId)
            if (!term) return null

            return {
              attributeId: attribute.id,
              attributeName: attribute.name,
              attributeType: attribute.type,
              termId: term.id,
              termName: term.name,
              colorHex: getTermColorValue(term),
            } satisfies VariantValueDraft
          })
          .filter(Boolean) as VariantValueDraft[]
      })
      .filter((axis) => axis.length)

    if (!axes.length) {
      setVariantDrafts([])
      return
    }

    const rows = combineVariantAxes(axes)
    const basePrice = originalPrice ?? 0
    const baseSalePrice = salePrice ?? null
    const baseSku = getValues("sku") || slug || "DUKY"

    setVariantDrafts((current) => {
      const currentByKey = new Map(current.map((draft) => [draft.key, draft]))

      return rows.map((values) => {
        const key = values
          .map((value) => `${value.attributeId}:${value.termId}`)
          .join("|")
        const existing = currentByKey.get(key)
        const suffix = values
          .map((value) => normalizeVariantTerm(value.termName))
          .join("-")

        return {
          key,
          values,
          priceMode: existing?.priceMode ?? "default",
          price: existing?.priceMode === "custom" ? existing.price : basePrice,
          salePrice:
            existing?.priceMode === "custom"
              ? existing.salePrice
              : baseSalePrice,
          sku: existing?.sku || `${baseSku}-${suffix || "VAR"}`,
          isActive: existing?.isActive ?? true,
        }
      })
    })
  }, [
    combineVariantGroups,
    currentProductType,
    getValues,
    originalPrice,
    productAttributes,
    salePrice,
    slug,
    variantGroups,
  ])

  React.useEffect(() => {
    if (isNew) return

    const fetchProduct = async () => {
      try {
        const data = await productService.getProduct(params.id as string)
        const detail = data as ProductDetailItem &
          Partial<Omit<ProductFormInput, "images">> &
          LoadedProductMedia
        const detailAdditionalInfo = getProductAdditionalInfo(
          detail.additionalInfo
        )
        const externalButtonAsset = detailAdditionalInfo?.externalButtonAsset
        const featuredImageUrl =
          getUploadedMediaUrl(detail.thumbnailMedia) ||
          getUploadedMediaUrl(detail.image?.media)
        const loadedGalleryImages =
          detail.images
            ?.map((image) => getUploadedMediaUrl(image.media))
            .filter(Boolean)
            .slice(0, gallerySlots.length) ?? []
        const loadedGalleryImageIds =
          detail.images
            ?.map((image) => image.mediaId || getUploadedMediaId(image.media))
            .filter(Boolean)
            .slice(0, gallerySlots.length) ??
          (Array.isArray(detail.galleryMediaIds)
            ? detail.galleryMediaIds.slice(0, gallerySlots.length)
            : [])

        reset({
          ...detail,
          sku: detail.sku ?? "",
          shortDescription: detail.shortDescription ?? "",
          description: detail.description ?? "",
          categoryIds: detail.categoryIds ?? [],
          tagIds: detail.tagIds ?? [],
          brandIds: detail.brandIds ?? [],
          galleryMediaIds: loadedGalleryImageIds,
          groupedProductIds:
            detail.relations?.relatedProductIds?.join(", ") ?? "",
          upsellIds: detail.relations?.upsellIds?.join(", ") ?? "",
          crossSellIds: detail.relations?.crossSellIds?.join(", ") ?? "",
          externalUrl: detail.externalUrl ?? "",
          externalButtonText: detail.externalButtonText ?? "",
          externalButtonAssetType:
            externalButtonAsset?.type === "icon" ||
            externalButtonAsset?.type === "svg" ||
            externalButtonAsset?.type === "image"
              ? externalButtonAsset.type
              : "none",
          externalButtonAssetValue: externalButtonAsset?.value ?? "",
          catalogVisibility: detail.catalogVisibility ?? "VISIBLE",
          manageStock: Boolean(detail.inventory),
          stockQuantity: detail.inventory?.quantity ?? null,
          lowStockThreshold: detail.inventory?.lowStockThreshold ?? null,
          stockStatus: detail.inventory?.soldOut ? "OUT_OF_STOCK" : "IN_STOCK",
          soldIndividually: detail.soldIndividually ?? false,
          weight: detail.shipping?.weight ?? null,
          length: detail.shipping?.length ?? null,
          width: detail.shipping?.width ?? null,
          height: detail.shipping?.height ?? null,
          shippingClass: detail.shipping?.shippingClass ?? "",
          purchaseNote: detail.purchaseNote ?? "",
          menuOrder: detail.menuOrder ?? null,
          enableReviews: detail.enableReviews ?? true,
          attributes: detail.attributes ?? {
            size: "",
            color: "",
            material: "",
          },
          seo: {
            metaTitle: "",
            metaDescription: "",
            canonicalUrl: "",
            focusKeyword: "",
            ...(detail.seo ?? {}),
          },
        })
        setFeaturedImageSrc(featuredImageUrl)
        setGalleryImages(loadedGalleryImages)
        setGalleryImageIds(loadedGalleryImageIds)
        setCustomTags(
          Array.isArray(detail.tagIds)
            ? detail.tagIds.filter((tagId) => !tags.includes(tagId))
            : []
        )
      } catch (error) {
        console.error("Failed to fetch product", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [isNew, params.id, reset])

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSaving(true)
      const isExternalProduct = data.type === ProductType.EXTERNAL
      const isGroupedProduct = data.type === ProductType.GROUPED
      const isSimpleProduct = data.type === ProductType.SIMPLE
      const hasShipping =
        data.type === ProductType.SIMPLE || data.type === ProductType.VARIABLE
      const baseAdditionalInfo = getProductAdditionalInfo(data.additionalInfo)
      const externalButtonAsset: ExternalButtonAsset = {
        type: data.externalButtonAssetType,
        value:
          data.externalButtonAssetType === "none"
            ? null
            : data.externalButtonAssetValue?.trim() || null,
      }
      const productPayload = CreateProductPayloadSchema.parse({
        ...data,
        type: data.type,
        sku: data.sku || null,
        originalPrice: isGroupedProduct ? 0 : (data.originalPrice ?? 0),
        salePrice: isGroupedProduct ? null : (data.salePrice ?? null),
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        externalUrl: isExternalProduct ? data.externalUrl || null : null,
        externalButtonText: isExternalProduct
          ? data.externalButtonText || null
          : null,
        additionalInfo: isExternalProduct
          ? {
              ...(baseAdditionalInfo ?? {}),
              externalButtonAsset,
            }
          : baseAdditionalInfo,
        purchaseNote: data.purchaseNote || null,
        menuOrder: data.menuOrder ?? 0,
        images: data.galleryMediaIds.map((mediaId, index) => ({
          mediaId,
          altText: index === 0 ? data.featuredImageAlt : null,
          sortOrder: index,
          isPrimary: index === 0,
        })),
        shipping: hasShipping
          ? {
              weight: data.weight,
              length: data.length,
              width: data.width,
              height: data.height,
              shippingClass: data.shippingClass,
            }
          : null,
        inventory:
          isSimpleProduct && data.manageStock
            ? {
                quantity: data.stockQuantity ?? 0,
                lowStockThreshold: data.lowStockThreshold ?? 3,
                soldOut: data.stockStatus === "OUT_OF_STOCK",
              }
            : null,
        relations: {
          relatedProductIds: data.groupedProductIds
            ? data.groupedProductIds
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          upsellIds: data.upsellIds
            ? data.upsellIds
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          crossSellIds: data.crossSellIds
            ? data.crossSellIds
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
        },
        seo: {
          ...data.seo,
          metaTitle: data.seo?.metaTitle || null,
          metaDescription: data.seo?.metaDescription || null,
          canonicalUrl: data.seo?.canonicalUrl || null,
          focusKeyword: data.seo?.focusKeyword || null,
          seoScore: seoAnalysis.score,
          analysisJson: seoAnalysis,
        },
      })
      let nextId = params.id as string
      if (isNew) {
        const createdProduct =
          await productService.createProduct(productPayload)
        if (
          productPayload.type === ProductType.VARIABLE &&
          variantDrafts.length
        ) {
          await createDraftVariants(createdProduct.id, variantDrafts)
        }
        nextId = createdProduct.id
        setDetailFeedback({
          message: "Tạo sản phẩm mới thành công!",
          tone: "success",
        })
        router.replace(`/products/${nextId}`)
      } else {
        await productService.updateProduct(params.id as string, productPayload)
        setDetailFeedback({
          message: "Cập nhật sản phẩm thành công!",
          tone: "success",
        })
        reset(data)
      }
    } catch (error) {
      console.error("Failed to save product", error)
    } finally {
      setIsSaving(false)
    }
  }

  const onInvalidSubmit = (formErrors: FieldErrors<ProductFormInput>) => {
    console.error("Product form validation failed", formErrors)
  }

  const openProductPreview = () => {
    window.open(productPreviewUrl, "_blank", "noopener,noreferrer")
  }

  const saveDraft = () => {
    setValue("status", "DRAFT", { shouldDirty: true })
  }

  const deleteProduct = async () => {
    const confirmed = window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")
    if (!confirmed) return

    try {
      setIsSaving(true)
      if (!isNew) {
        await productService.deleteProduct(params.id as string)
      }
      router.push("/products")
    } catch (error) {
      console.error("Failed to delete product", error)
    } finally {
      setIsSaving(false)
    }
  }


  const openMediaPicker = (
    mode: MediaPickerMode,
    replaceIndex: number | null = null
  ) => {
    setMediaPickerMode(mode)
    setMediaPickerReplaceIndex(replaceIndex)
    setMediaPickerOpen(true)
  }

  const syncGallery = React.useCallback(
    (images: string[], mediaIds: string[]) => {
      const nextImages = images.slice(0, gallerySlots.length)
      const nextIds = mediaIds.slice(0, gallerySlots.length)
      setGalleryImages(nextImages)
      setGalleryImageIds(nextIds)
      setValue("galleryMediaIds", nextIds.filter(Boolean), {
        shouldDirty: true,
      })
    },
    [setValue]
  )

  const selectMediaItem = (media: Media) => {
    const mediaUrl = getUploadedMediaUrl(media)
    const mediaId = getUploadedMediaId(media)
    if (!mediaUrl || !mediaId) return

    if (mediaPickerMode === "featured") {
      setFeaturedImageSrc(mediaUrl)
      setValue("thumbnailMediaId", mediaId, { shouldDirty: true })
      if (!getValues("featuredImageAlt")) {
        setValue(
          "featuredImageAlt",
          media.altText || media.title || media.filename || "",
          { shouldDirty: true }
        )
      }
      setMediaPickerOpen(false)
      return
    }

    const nextImages = [...galleryImages]
    const nextIds = [...galleryImageIds]
    const duplicateIndex = nextIds.indexOf(mediaId)
    if (duplicateIndex >= 0 && duplicateIndex !== mediaPickerReplaceIndex) {
      setMediaPickerOpen(false)
      return
    }

    if (
      mediaPickerMode === "gallery-replace" &&
      mediaPickerReplaceIndex !== null
    ) {
      nextImages[mediaPickerReplaceIndex] = mediaUrl
      nextIds[mediaPickerReplaceIndex] = mediaId
    } else if (nextImages.length < gallerySlots.length) {
      nextImages.push(mediaUrl)
      nextIds.push(mediaId)
    }

    syncGallery(nextImages, nextIds)
    setMediaPickerOpen(false)
  }

  const selectMultipleMediaItems = (mediaList: Media[]) => {
    const nextImages = [...galleryImages]
    const nextIds = [...galleryImageIds]

    mediaList.forEach((media) => {
      const mediaUrl = getUploadedMediaUrl(media)
      const mediaId = getUploadedMediaId(media)
      if (!mediaUrl || !mediaId) return

      if (nextIds.includes(mediaId)) return

      if (nextImages.length < gallerySlots.length) {
        nextImages.push(mediaUrl)
        nextIds.push(mediaId)
      }
    })

    syncGallery(nextImages, nextIds)
    setMediaPickerOpen(false)
  }



  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= galleryImages.length) return

    const nextImages = [...galleryImages]
    const nextIds = [...galleryImageIds]
    ;[nextImages[index], nextImages[nextIndex]] = [
      nextImages[nextIndex],
      nextImages[index],
    ]
    ;[nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]]
    syncGallery(nextImages, nextIds)
  }

  const removeGalleryImage = (index: number) => {
    const nextImages = galleryImages.filter(
      (_, itemIndex) => itemIndex !== index
    )
    const nextIds = galleryImageIds.filter(
      (_, itemIndex) => itemIndex !== index
    )
    syncGallery(nextImages, nextIds)
  }

  const splitRelationIds = (value?: string | null) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : []

  const relationFieldValues = {
    groupedProductIds: groupedProductIds ?? "",
    upsellIds: upsellIds ?? "",
    crossSellIds: crossSellIds ?? "",
  }

  const addRelationProduct = (
    field: "groupedProductIds" | "upsellIds" | "crossSellIds",
    productId: string
  ) => {
    const currentIds = splitRelationIds(relationFieldValues[field])
    if (currentIds.includes(productId)) return
    setValue(field, [...currentIds, productId].join(", "), {
      shouldDirty: true,
    })
  }

  const removeRelationProduct = (
    field: "groupedProductIds" | "upsellIds" | "crossSellIds",
    productId: string
  ) => {
    const nextIds = splitRelationIds(relationFieldValues[field]).filter(
      (id) => id !== productId
    )
    setValue(field, nextIds.join(", "), { shouldDirty: true })
  }

  const addVariantGroup = () => {
    setVariantGroups((current) => [...current, createVariantGroup()])
  }

  const removeVariantGroup = (groupKey: string) => {
    setVariantGroups((current) =>
      current.length <= 1
        ? [createVariantGroup()]
        : current.filter((group) => group.key !== groupKey)
    )
  }

  const updateVariantGroup = (
    groupKey: string,
    patch: Partial<VariantAttributeGroup>
  ) => {
    setVariantGroups((current) =>
      current.map((group) =>
        group.key === groupKey ? { ...group, ...patch } : group
      )
    )
  }

  const toggleGroupTerm = (groupKey: string, termId: string) => {
    setVariantGroups((current) =>
      current.map((group) =>
        group.key === groupKey
          ? {
              ...group,
              selectedTermIds: group.selectedTermIds.includes(termId)
                ? group.selectedTermIds.filter((id) => id !== termId)
                : [...group.selectedTermIds, termId],
            }
          : group
      )
    )
  }

  const createTermForGroup = async (groupKey: string) => {
    const group = variantGroups.find((item) => item.key === groupKey)
    const attribute = productAttributes.find(
      (item) => item.id === group?.attributeId
    )
    const termName = group?.newTermName.trim()
    if (!group || !attribute || !termName) return

    try {
      const term = await productAttributeService.createTerm(attribute.id, {
        name: termName,
        slug: normalizeVariantTerm(termName).toLowerCase(),
        value: attribute.type === "COLOR" ? termName : null,
        metadata: null,
        sortOrder: attribute.terms.length,
      })

      setProductAttributes((current) =>
        current.map((item) =>
          item.id === attribute.id
            ? {
                ...item,
                terms: [...item.terms, term],
                termsCount: item.termsCount + 1,
              }
            : item
        )
      )
      updateVariantGroup(groupKey, {
        newTermName: "",
        selectedTermIds: [...group.selectedTermIds, term.id],
      })
    } catch (error) {
      console.error("Failed to create variant term", error)
      setDetailFeedback({
        message: "Them gia tri bien the that bai.",
        tone: "error",
      })
    }
  }

  const updateVariantDraft = (key: string, patch: Partial<VariantDraft>) => {
    setVariantDrafts((current) =>
      current.map((draft) =>
        draft.key === key ? { ...draft, ...patch } : draft
      )
    )
  }

  const createDraftVariants = async (
    productId: string,
    drafts = variantDrafts
  ) => {
    const activeDrafts = drafts.filter((draft) => draft.isActive)

    await Promise.all(
      activeDrafts.map((draft, index) =>
        variantService.createVariant(productId, {
          productId,
          name: [productName, ...draft.values.map((value) => value.termName)]
            .filter(Boolean)
            .join(" / "),
          sku: draft.sku,
          sizeLabel:
            draft.values
              .filter((value) => value.attributeType === "SIZE")
              .map((value) => value.termName)
              .join(" / ") || null,
          sizeGender: null,
          colorName:
            draft.values
              .filter((value) => value.attributeType === "COLOR")
              .map((value) => value.termName)
              .join(" / ") || null,
          colorHex:
            draft.values.find((value) => value.attributeType === "COLOR")
              ?.colorHex ?? null,
          price:
            draft.priceMode === "default"
              ? (originalPrice ?? 0)
              : (draft.price ?? 0),
          salePrice:
            draft.priceMode === "default"
              ? (salePrice ?? null)
              : draft.salePrice,
          isActive: true,
          sortOrder: index,
        })
      )
    )
  }

  const filteredRelationOptions = React.useMemo(() => {
    const keyword = relationSearch.trim().toLowerCase()
    if (!keyword) return productOptions.slice(0, 8)
    return productOptions
      .filter((product) =>
        `${product.name} ${product.sku ?? ""}`.toLowerCase().includes(keyword)
      )
      .slice(0, 8)
  }, [productOptions, relationSearch])

  const renderRelationPicker = (
    field: "groupedProductIds" | "upsellIds" | "crossSellIds",
    label: string,
    description: string
  ) => {
    const selectedIds = splitRelationIds(relationFieldValues[field])
    const selectedProducts = selectedIds
      .map((id) => productOptions.find((product) => product.id === id))
      .filter(Boolean) as ProductListItem[]

    return (
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-col gap-1">
          <Label>{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedProducts.length ? (
            selectedProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="rounded-full border bg-white px-3 py-1 text-xs text-primary hover:border-destructive hover:text-destructive"
                onClick={() => removeRelationProduct(field, product.id)}
              >
                {product.name} ×
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              Chưa chọn sản phẩm.
            </span>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          {filteredRelationOptions.map((product) => (
            <Button
              key={product.id}
              type="button"
              variant="outline"
              size="sm"
              className="justify-start rounded-xl"
              onClick={() => addRelationProduct(field, product.id)}
              disabled={selectedIds.includes(product.id)}
            >
              <span className="truncate">{product.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {product.sku || product.status}
              </span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const generateVariants = async () => {
    if (isNew) {
      setDetailFeedback({
        message: "Hãy lưu sản phẩm trước, sau đó mới tạo biến thể.",
        tone: "error",
      })
      return
    }

    const sizes = variantSizeInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    const colors = variantColorInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    const normalizedColors = colors.length ? colors : [""]
    if (!sizes.length) {
      setDetailFeedback({
        message: "Nhập ít nhất một size để tạo biến thể.",
        tone: "error",
      })
      return
    }

    try {
      setIsGeneratingVariants(true)
      const baseSku =
        variantSkuPrefix.trim() || getValues("sku") || slug || "DUKY"
      const basePrice =
        getValues("salePrice") ?? getValues("originalPrice") ?? 0
      let sortOrder = 0
      await Promise.all(
        sizes.flatMap((size) =>
          normalizedColors.map((color) => {
            const suffix = [size, color]
              .filter(Boolean)
              .join("-")
              .replace(/\s+/g, "-")
              .toUpperCase()
            return variantService.createVariant(params.id as string, {
              productId: params.id as string,
              name: [productName, size, color].filter(Boolean).join(" / "),
              sku: `${baseSku}-${suffix}`,
              sizeLabel: size,
              sizeGender: null,
              colorName: color || null,
              colorHex: null,
              price: basePrice,
              salePrice: getValues("salePrice") ?? null,
              isActive: true,
              sortOrder: sortOrder++,
            })
          })
        )
      )
      setValue("type", "VARIABLE", { shouldDirty: true })
      setDetailFeedback({
        message: `Đã tạo ${sizes.length * normalizedColors.length} biến thể. Lưu sản phẩm để giữ loại VARIABLE.`,
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to generate variants", error)
      setDetailFeedback({
        message: "Tạo biến thể thất bại. Kiểm tra SKU trùng hoặc API biến thể.",
        tone: "error",
      })
    } finally {
      setIsGeneratingVariants(false)
    }
  }

  const addCustomTag = () => {
    const nextTag = newTag.trim()
    if (!nextTag) return

    const currentTags = getValues("tagIds") ?? []
    if (!currentTags.includes(nextTag)) {
      setValue("tagIds", [...currentTags, nextTag], { shouldDirty: true })
    }
    if (!tags.includes(nextTag) && !customTags.includes(nextTag)) {
      setCustomTags((current) => [...current, nextTag])
    }
    setNewTag("")
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      className="max-w-9xl mx-auto flex w-full flex-col gap-6 rounded-[1.75rem] p-2 md:p-4 [&_[data-slot=select-trigger]]:bg-white [&_input]:bg-white [&_textarea]:bg-white"
    >
      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={selectMediaItem}
        onSelectMultiple={selectMultipleMediaItems}
        multiple={mediaPickerMode === "gallery"}
        title={mediaPickerMode === "featured" ? "Chọn ảnh đại diện" : "Chọn ảnh Gallery"}
      />



      <div className="sticky top-0 z-30 -mx-2 -mt-2 flex flex-col gap-4 border-b border-orange-100/70 bg-background/95 backdrop-blur-md px-2 pt-3 pb-3 shadow-sm md:-mx-4 md:flex-row md:items-center md:justify-between md:px-4 md:pt-4 md:pb-4 transition-all">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/products">
              <IconArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bổ sung đầy đủ nội dung, dữ liệu bán hàng, SEO và hình ảnh như
              trang quản trị sản phẩm.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm border transition-all bg-white mr-1",
              seoAnalysis.score >= 80
                ? "border-green-200 text-green-700 shadow-green-100/30"
                : seoAnalysis.score >= 55
                ? "border-orange-200 text-orange-700 shadow-orange-100/30"
                : "border-red-200 text-red-700 shadow-red-100/30"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                seoAnalysis.score >= 80
                  ? "bg-green-500 animate-pulse"
                  : seoAnalysis.score >= 55
                  ? "bg-orange-500 animate-pulse"
                  : "bg-red-500 animate-pulse"
              )}
            />
            Điểm SEO: {seoAnalysis.score}/100
          </div>
          <Button
            type="button"
            variant="outline"
            asChild
            className="rounded-xl border-orange-200 bg-white/80 hover:bg-orange-50"
          >
            <Link href="/products">Hủy</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-orange-500 shadow-sm shadow-orange-500/20 hover:bg-orange-600"
          >
            {isSaving ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="mr-2 size-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl border-orange-100/80 shadow-sm">
            <CardHeader className="border-b border-orange-100/60">
              <CardTitle>Thông tin chung</CardTitle>
              <CardDescription>
                Tên, đường dẫn và nội dung mô tả chính của sản phẩm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input id="name" {...register("name")} className="rounded-xl" />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message as string}
                  </p>
                )}
              </div>

              {/* Ẩn Slug và SKU trên giao diện nhưng vẫn giữ input ẩn để tự sinh và submit dữ liệu */}
              <input type="hidden" {...register("slug")} />
              <input type="hidden" {...register("sku")} />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Mô tả chi tiết</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg bg-orange-50 px-2.5 text-xs text-orange-700 hover:bg-orange-100 hover:text-orange-800 gap-1.5"
                    onClick={() => setShowDescAiPanel(!showDescAiPanel)}
                  >
                    <IconWand className="size-3.5" />
                    Trợ lý AI
                  </Button>
                </div>

                {showDescAiPanel && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50/20 p-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={descAiPrompt}
                        onChange={(e) => setDescAiPrompt(e.target.value)}
                        placeholder="Nhập yêu cầu (ví dụ: Viết mô tả chi tiết 3 phần chất liệu da bò, phối đồ, cách chọn size)..."
                        className="rounded-xl border-stone-300 focus-visible:ring-orange-200 h-9 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            runDescAi()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isDescAiLoading}
                        className="rounded-xl bg-orange-600 text-xs text-white hover:bg-orange-700 h-9 shrink-0 gap-1"
                        onClick={runDescAi}
                      >
                        {isDescAiLoading ? (
                          <IconLoader2 className="size-3.5 animate-spin" />
                        ) : (
                          <IconWand className="size-3.5" />
                        )}
                        Viết mô tả dài
                      </Button>
                    </div>

                  </div>
                )}

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      minHeightClass="min-h-[360px]"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.35rem] border-orange-100/90 shadow-[0_12px_32px_rgba(249,115,22,0.08)]">
            <CardHeader className="border-b border-orange-100/70">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-sm">
                  <CardTitle>Dữ liệu sản phẩm</CardTitle>
                  <CardDescription>
                    Giá, tồn kho, vận chuyển, sản phẩm liên quan và thuộc tính.
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-[360px]">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setProductDataTab(
                            value === ProductType.VARIABLE
                              ? "attributes"
                              : "general"
                          )
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-orange-100 bg-background px-4 shadow-sm shadow-orange-950/[0.03]">
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={ProductType.SIMPLE}>
                            Sản phẩm đơn giản
                          </SelectItem>
                          <SelectItem value={ProductType.GROUPED}>
                            Sản phẩm nhóm
                          </SelectItem>
                          <SelectItem value={ProductType.EXTERNAL}>
                            Sản phẩm bên ngoài / liên kết
                          </SelectItem>
                          <SelectItem value={ProductType.VARIABLE}>
                            Sản phẩm có biến thể
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="flex min-h-9 items-center overflow-hidden text-xs leading-none text-ellipsis text-orange-400">
                    {productTypeDescriptions[currentProductType]}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="">
              <Tabs
                value={productDataTab}
                onValueChange={setProductDataTab}
                orientation="vertical"
                className="grid gap-6 md:grid-cols-[200px_1fr]"
              >
                <TabsList className="h-fit w-full flex-col items-stretch gap-1 rounded-[1.2rem] border border-orange-100 bg-white/55 p-1.5 shadow-inner shadow-orange-950/[0.03]">
                  <TabsTrigger
                    className="h-11 rounded-full px-3 text-sm text-muted-foreground transition-all data-active:bg-orange-100 data-active:text-orange-600 data-active:shadow-none"
                    value="general"
                  >
                    <IconCurrencyDong className="size-4" />
                    Chung
                  </TabsTrigger>
                  {showInventoryTab && (
                    <TabsTrigger
                      className="h-11 rounded-full px-3 text-sm text-muted-foreground transition-all data-active:bg-orange-100 data-active:text-orange-600 data-active:shadow-none"
                      value="inventory"
                    >
                      <IconBox className="size-4" />
                      Kho hàng
                    </TabsTrigger>
                  )}
                  {showShippingTab && (
                    <TabsTrigger
                      className="h-11 rounded-full px-3 text-sm text-muted-foreground transition-all data-active:bg-orange-100 data-active:text-orange-600 data-active:shadow-none"
                      value="shipping"
                    >
                      <IconTruck className="size-4" />
                      Vận chuyển
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    className="h-11 rounded-full px-3 text-sm text-muted-foreground transition-all data-active:bg-orange-100 data-active:text-orange-600 data-active:shadow-none"
                    value="linked"
                  >
                    <IconLink className="size-4" />
                    Liên kết
                  </TabsTrigger>
                  {showAttributesTab && (
                    <TabsTrigger
                      className="h-11 rounded-full px-3 text-sm text-muted-foreground transition-all data-active:bg-orange-100 data-active:text-orange-600 data-active:shadow-none"
                      value="attributes"
                    >
                      <IconAdjustmentsHorizontal className="size-4" />
                      Thuộc tính
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    className="h-11 rounded-full px-3 text-sm text-muted-foreground transition-all data-active:bg-orange-100 data-active:text-orange-600 data-active:shadow-none"
                    value="advanced"
                  >
                    <IconSettings className="size-4" />
                    Nâng cao
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="flex flex-col gap-5">
                  {currentProductType === ProductType.EXTERNAL && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="externalUrl">
                          URL sản phẩm bên ngoài
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {externalLinkPresets.map((preset) => (
                            <Button
                              key={preset.label}
                              type="button"
                              variant={
                                externalUrl === preset.value
                                  ? "secondary"
                                  : "outline"
                              }
                              size="sm"
                              className="rounded-full"
                              onClick={() =>
                                setValue("externalUrl", preset.value, {
                                  shouldDirty: true,
                                })
                              }
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                        <Input
                          id="externalUrl"
                          {...register("externalUrl")}
                          className="rounded-xl"
                          placeholder="Dán link mới nếu không có trong danh sách"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="externalButtonText">Nhãn nút mua</Label>
                        <Select
                          value={externalButtonText || undefined}
                          onValueChange={(value) =>
                            setValue("externalButtonText", value, {
                              shouldDirty: true,
                            })
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Chọn nhanh nhãn nút" />
                          </SelectTrigger>
                          <SelectContent>
                            {externalButtonTextPresets.map((label) => (
                              <SelectItem key={label} value={label}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="externalButtonText"
                          {...register("externalButtonText")}
                          className="rounded-xl"
                          placeholder="Hoặc nhập nhãn mới"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label>Icon / SVG / ảnh trên nút</Label>
                        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                          <Select
                            value={`${externalButtonAssetType}:${externalButtonAssetValue ?? ""}`}
                            onValueChange={(value) => {
                              const [type, ...rest] = value.split(":")
                              setValue(
                                "externalButtonAssetType",
                                type as ExternalButtonAssetType,
                                { shouldDirty: true }
                              )
                              setValue(
                                "externalButtonAssetValue",
                                rest.join(":"),
                                { shouldDirty: true }
                              )
                            }}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Chọn icon có sẵn" />
                            </SelectTrigger>
                            <SelectContent>
                              {externalButtonIconPresets.map((preset) => (
                                <SelectItem
                                  key={`${preset.type}:${preset.value}`}
                                  value={`${preset.type}:${preset.value}`}
                                >
                                  {preset.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="svg:">SVG tự nhập</SelectItem>
                              <SelectItem value="image:">
                                Ảnh / logo bằng URL
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            {...register("externalButtonAssetValue")}
                            className="rounded-xl"
                            disabled={externalButtonAssetType === "none"}
                            placeholder={
                              externalButtonAssetType === "svg"
                                ? "<svg ... />"
                                : externalButtonAssetType === "image"
                                  ? "https://.../logo.png"
                                  : "Tên icon, ví dụ: store"
                            }
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3">
                          <span className="text-xs text-muted-foreground">
                            Preview:
                          </span>
                          <Button type="button" className="rounded-xl">
                            {externalButtonAssetType === "icon" &&
                              ExternalButtonIcon && (
                                <ExternalButtonIcon data-icon="inline-start" />
                              )}
                            {externalButtonAssetType === "image" &&
                              externalButtonAssetValue && (
                                <img
                                  src={externalButtonAssetValue}
                                  alt=""
                                  className="size-4 rounded-sm object-contain"
                                />
                              )}
                            {externalButtonAssetType === "svg" &&
                              externalButtonAssetValue && (
                                <span
                                  className="inline-flex size-4 items-center justify-center [&_svg]:size-4"
                                  dangerouslySetInnerHTML={{
                                    __html: externalButtonAssetValue,
                                  }}
                                />
                              )}
                            {externalButtonText || "Mua ngay"}
                          </Button>
                          {externalButtonAssetType === "icon" &&
                            externalButtonAssetValue &&
                            !ExternalButtonIcon && (
                              <span className="text-xs text-muted-foreground">
                                Icon chưa có preview, vẫn sẽ được lưu.
                              </span>
                            )}
                          {externalButtonAssetType === "image" &&
                            externalButtonAssetValue && (
                              <span className="text-xs text-muted-foreground">
                                Ảnh: {externalButtonAssetValue}
                              </span>
                            )}
                          {externalButtonAssetType === "svg" &&
                            externalButtonAssetValue && (
                              <span className="text-xs text-muted-foreground">
                                SVG đã nhập sẽ được lưu vào additionalInfo.
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentProductType === ProductType.GROUPED && (
                    <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex flex-col gap-1">
                        <Label>Sản phẩm nhóm</Label>
                        <p className="text-sm text-muted-foreground">
                          Sản phẩm nhóm không đặt giá và tồn kho riêng tại sản
                          phẩm cha. Danh sách sản phẩm con được chọn trong tab
                          Liên kết.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit rounded-xl"
                        onClick={() => setProductDataTab("linked")}
                      >
                        <IconLink data-icon="inline-start" />
                        Chọn sản phẩm trong nhóm
                      </Button>
                    </div>
                  )}

                  {showOwnPriceFields && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="originalPrice">Giá gốc (VND)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          {...register("originalPrice", numberValue)}
                          className="rounded-xl"
                        />
                        {errors.originalPrice && (
                          <p className="text-xs text-destructive">
                            {errors.originalPrice.message as string}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="salePrice">Giá khuyến mãi (VND)</Label>
                        <Input
                          id="salePrice"
                          type="number"
                          {...register("salePrice", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ControlledCheckbox
                      control={control}
                      name="contactForPrice"
                      label="Ẩn giá / liên hệ để biết giá"
                      description="Dùng cho sản phẩm cần tư vấn trước khi báo giá."
                    />
                    <ControlledCheckbox
                      control={control}
                      name="isFeatured"
                      label="Sản phẩm nổi bật"
                      description="Hiển thị ở các khu vực ưu tiên trên website."
                    />
                    <ControlledCheckbox
                      control={control}
                      name="isBestSeller"
                      label="Đánh dấu bán chạy"
                      description="Gắn nhãn bán chạy cho danh sách sản phẩm."
                    />
                    <ControlledCheckbox
                      control={control}
                      name="isNewArrival"
                      label="Hàng mới về"
                      description="Phù hợp với bộ sưu tập mới hoặc sản phẩm mới nhập."
                    />
                  </div>
                </TabsContent>

                {showInventoryTab && (
                  <TabsContent
                    value="inventory"
                    className="flex flex-col gap-4"
                  >
                    <ControlledCheckbox
                      control={control}
                      name="manageStock"
                      label="Quản lý tồn kho"
                      description="Theo dõi số lượng tồn kho riêng cho sản phẩm này."
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="stockQuantity">Số lượng tồn</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          {...register("stockQuantity", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="lowStockThreshold">
                          Ngưỡng sắp hết
                        </Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          {...register("lowStockThreshold", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Trạng thái kho</Label>
                        <Controller
                          name="stockStatus"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Chọn trạng thái" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="IN_STOCK">
                                  Còn hàng
                                </SelectItem>
                                <SelectItem value="OUT_OF_STOCK">
                                  Hết hàng
                                </SelectItem>
                                <SelectItem value="ON_BACKORDER">
                                  Cho đặt trước
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <ControlledCheckbox
                        control={control}
                        name="soldIndividually"
                        label="Bán riêng lẻ"
                        description="Mỗi đơn hàng chỉ được mua một sản phẩm này."
                      />
                    </div>
                  </TabsContent>
                )}

                {showShippingTab && (
                  <TabsContent value="shipping" className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="weight">Cân nặng (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          {...register("weight", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="length">Dài (cm)</Label>
                        <Input
                          id="length"
                          type="number"
                          step="0.1"
                          {...register("length", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="width">Rộng (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          step="0.1"
                          {...register("width", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="height">Cao (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          {...register("height", numberValue)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Nhóm vận chuyển</Label>
                      <Controller
                        name="shippingClass"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "standard"}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Chọn nhóm vận chuyển" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="standard">
                                Tiêu chuẩn
                              </SelectItem>
                              <SelectItem value="bulky">
                                Hàng cồng kềnh
                              </SelectItem>
                              <SelectItem value="fragile">
                                Hàng dễ vỡ
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="linked" className="flex flex-col gap-4">
                  <div className="relative">
                    <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={relationSearch}
                      onChange={(event) =>
                        setRelationSearch(event.target.value)
                      }
                      className="rounded-xl pl-9"
                      placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                    />
                  </div>
                  {currentProductType === ProductType.GROUPED ? (
                    renderRelationPicker(
                      "groupedProductIds",
                      "Sản phẩm trong nhóm",
                      "Chọn các sản phẩm con sẽ nằm trong sản phẩm nhóm này."
                    )
                  ) : (
                    <>
                      {renderRelationPicker(
                        "groupedProductIds",
                        "Sản phẩm liên quan",
                        "Đề xuất các sản phẩm có liên quan trên trang chi tiết sản phẩm."
                      )}
                      {renderRelationPicker(
                        "upsellIds",
                        "Sản phẩm bán thêm",
                        "Gợi ý phiên bản cao hơn hoặc sản phẩm nên mua thêm."
                      )}
                      {renderRelationPicker(
                        "crossSellIds",
                        "Sản phẩm bán chéo",
                        "Gợi ý phụ kiện hoặc sản phẩm bổ sung ở giỏ hàng."
                      )}
                    </>
                  )}
                  <div className="hidden">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="upsellIds">Sản phẩm bán thêm</Label>
                      <div className="relative">
                        <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="upsellIds"
                          {...register("upsellIds")}
                          className="rounded-xl pl-9"
                          placeholder="Tìm theo tên hoặc SKU"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="crossSellIds">Sản phẩm bán chéo</Label>
                      <div className="relative">
                        <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="crossSellIds"
                          {...register("crossSellIds")}
                          className="rounded-xl pl-9"
                          placeholder="Tìm theo tên hoặc SKU"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {showAttributesTab && (
                  <TabsContent
                    value="attributes"
                    className="flex flex-col gap-4 min-w-0 w-full"
                  >
                    <div className="rounded-xl border bg-muted/20 p-4 min-w-0 w-full">
                      <div className="flex flex-col gap-1">
                        <Label>Chon bien the tu danh sach /variants</Label>
                        <p className="text-xs text-muted-foreground">
                          Moi dong chon mot thuoc tinh that tu DB, vi du Size,
                          Mau, Chat lieu. Chon item ben trong hoac them nhanh
                          item moi ngay tai day.
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-4">
                        {variantGroups.map((group, index) => {
                          const attribute = productAttributes.find(
                            (item) => item.id === group.attributeId
                          )
                          const usedAttributeIds = variantGroups
                            .filter((item) => item.key !== group.key)
                            .map((item) => item.attributeId)
                            .filter(Boolean)

                          return (
                            <div
                              key={group.key}
                              className="rounded-xl border bg-white p-4 min-w-0 w-full flex flex-col gap-4"
                            >
                              {/* Hang 1: Tieu de, Chon thuoc tinh va nut Xoa */}
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center gap-x-4">
                                  <Label className="text-sm font-semibold text-foreground min-w-[80px]">Bien the {index + 1}</Label>
                                  <div className="w-full md:w-[240px]">
                                    <Select
                                      value={group.attributeId || undefined}
                                      onValueChange={(attributeId) =>
                                        updateVariantGroup(group.key, {
                                          attributeId,
                                          selectedTermIds: [],
                                          newTermName: "",
                                        })
                                      }
                                    >
                                      <SelectTrigger className="rounded-xl h-9">
                                        <SelectValue placeholder="Chon thuoc tinh" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {productAttributes.map((item) => (
                                          <SelectItem
                                            key={item.id}
                                            value={item.id}
                                            disabled={usedAttributeIds.includes(
                                              item.id
                                            )}
                                          >
                                            {item.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="self-end md:self-auto rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => removeVariantGroup(group.key)}
                                >
                                  <IconTrash className="size-4" />
                                </Button>
                              </div>

                              {/* Hang 2: Noi dung item thuoc tinh nam phia duoi, co border-l de thuot le phan biet */}
                              <div className="pl-4 md:pl-6 border-l-2 border-orange-100/70 flex flex-col gap-3 min-w-0 w-full">
                                <div className="flex flex-wrap gap-2">
                                  {isLoadingVariantTerms ? (
                                    <span className="text-xs text-muted-foreground">
                                      Dang tai bien the...
                                    </span>
                                  ) : attribute ? (
                                    attribute.terms.length ? (
                                      attribute.terms.map((term) => {
                                        const selected =
                                          group.selectedTermIds.includes(
                                            term.id
                                          )
                                        const colorValue =
                                          getTermColorValue(term)
                                        return (
                                          <Button
                                            key={term.id}
                                            type="button"
                                            variant={selected ? "default" : "outline"}
                                            size="sm"
                                            className={`rounded-full h-8 px-3.5 text-xs font-medium transition-all ${
                                              selected
                                                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                            onClick={() =>
                                              toggleGroupTerm(
                                                group.key,
                                                term.id
                                              )
                                            }
                                          >
                                            {colorValue && (
                                              <span
                                                className={`size-2.5 rounded-full border mr-1.5 transition-transform ${
                                                  selected ? "border-white/50 scale-110" : "border-slate-200"
                                                }`}
                                                style={{
                                                  backgroundColor: colorValue,
                                                }}
                                              />
                                            )}
                                            {term.name}
                                          </Button>
                                        )
                                      })
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Thuoc tinh nay chua co item.
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      Chon thuoc tinh de hien item.
                                    </span>
                                  )}
                                </div>

                                {attribute && (
                                  <div className="flex gap-2 max-w-md">
                                    <Input
                                      value={group.newTermName}
                                      onChange={(event) =>
                                        updateVariantGroup(group.key, {
                                          newTermName: event.target.value,
                                        })
                                      }
                                      className="h-8 rounded-xl text-xs"
                                      placeholder={`Them nhanh gia tri cho ${attribute.name}`}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl h-8 text-xs px-3"
                                      disabled={!group.newTermName.trim()}
                                      onClick={() =>
                                        createTermForGroup(group.key)
                                      }
                                    >
                                      <IconPlus className="mr-1 size-3" />
                                      Them
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-4 flex rounded-xl border bg-white p-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={addVariantGroup}
                        >
                          <IconPlus className="mr-2 size-4" />
                          Thêm biến thể khác
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white">
                      <div className="flex flex-col gap-1 border-b p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label>Tổ hợp biến thể và giá</Label>
                          <Badge variant="secondary">
                            {variantDrafts.length} dòng
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Hệ thống tự động tổ hợp tất cả các giá trị thuộc tính để tạo ma trận giá biến thể đầy đủ.
                        </p>
                      </div>

                      {variantDrafts.length ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Bien the
                                </th>
                                <th className="px-4 py-3 font-medium">SKU</th>
                                <th className="px-4 py-3 font-medium">
                                  Kieu gia
                                </th>
                                <th className="px-4 py-3 font-medium">Gia</th>
                                <th className="px-4 py-3 font-medium">
                                  Gia KM
                                </th>
                                <th className="px-4 py-3 font-medium">Ban</th>
                              </tr>
                            </thead>
                            <tbody>
                              {variantDrafts.map((draft) => (
                                <tr key={draft.key} className="border-t">
                                  <td className="px-4 py-3">
                                    <div className="font-medium">
                                      {draft.values
                                        .map((value) => value.termName)
                                        .join(" / ") || "Mac dinh"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {draft.values
                                        .map((value) => value.attributeName)
                                        .join(" + ")}
                                      {" · "}
                                      {draft.priceMode === "default"
                                        ? "Dung gia san pham"
                                        : "Gia rieng"}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      value={draft.sku}
                                      onChange={(event) =>
                                        updateVariantDraft(draft.key, {
                                          sku: event.target.value,
                                        })
                                      }
                                      className="h-8 rounded-lg"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Select
                                      value={draft.priceMode}
                                      onValueChange={(value) =>
                                        updateVariantDraft(draft.key, {
                                          priceMode: value as VariantPriceMode,
                                          price:
                                            value === "default"
                                              ? (originalPrice ?? 0)
                                              : draft.price,
                                          salePrice:
                                            value === "default"
                                              ? (salePrice ?? null)
                                              : draft.salePrice,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="default">
                                          Gia mac dinh
                                        </SelectItem>
                                        <SelectItem value="custom">
                                          Gia rieng
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      type="number"
                                      value={draft.price ?? ""}
                                      disabled={draft.priceMode === "default"}
                                      onChange={(event) =>
                                        updateVariantDraft(draft.key, {
                                          price:
                                            event.target.value === ""
                                              ? null
                                              : Number(event.target.value),
                                        })
                                      }
                                      className="h-8 rounded-lg"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      type="number"
                                      value={draft.salePrice ?? ""}
                                      disabled={draft.priceMode === "default"}
                                      onChange={(event) =>
                                        updateVariantDraft(draft.key, {
                                          salePrice:
                                            event.target.value === ""
                                              ? null
                                              : Number(event.target.value),
                                        })
                                      }
                                      className="h-8 rounded-lg"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Checkbox
                                      checked={draft.isActive}
                                      onCheckedChange={(checked) =>
                                        updateVariantDraft(draft.key, {
                                          isActive: checked === true,
                                        })
                                      }
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">
                          Chon it nhat mot item trong mot bien the de tao danh
                          sach.
                        </div>
                      )}
                    </div>

                    {!isNew && (
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="flex flex-col gap-1">
                          <Label>Tao bien the cho san pham da luu</Label>
                          <p className="text-xs text-muted-foreground">
                            Nut nay tao cac to hop dang chon vao san pham hien
                            tai. Neu SKU da ton tai, API se bao loi trung SKU.
                          </p>
                        </div>
                        <Button
                          type="button"
                          className="mt-3 rounded-xl"
                          onClick={async () => {
                            try {
                              setIsGeneratingVariants(true)
                              await createDraftVariants(params.id as string)
                              setValue("type", "VARIABLE", {
                                shouldDirty: true,
                              })
                              setDetailFeedback({
                                message: "Da tao bien the cho san pham.",
                                tone: "success",
                              })
                            } catch (error) {
                              console.error(
                                "Failed to create selected variants",
                                error
                              )
                              setDetailFeedback({
                                message:
                                  "Tao bien the that bai. Kiem tra SKU trung hoac gia khong hop le.",
                                tone: "error",
                              })
                            } finally {
                              setIsGeneratingVariants(false)
                            }
                          }}
                          disabled={
                            isGeneratingVariants ||
                            !variantDrafts.some((draft) => draft.isActive)
                          }
                        >
                          {isGeneratingVariants && (
                            <IconLoader2 className="mr-2 size-4 animate-spin" />
                          )}
                          Tao cac to hop dang chon
                        </Button>
                      </div>
                    )}

                    <div className="hidden">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="attributes.size">Kích thước</Label>
                          <Input
                            id="attributes.size"
                            {...register("attributes.size")}
                            className="rounded-xl"
                            placeholder="VD: 38, 39, 40"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="attributes.color">Màu sắc</Label>
                          <Input
                            id="attributes.color"
                            {...register("attributes.color")}
                            className="rounded-xl"
                            placeholder="VD: Đen"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="attributes.material">Chất liệu</Label>
                          <Input
                            id="attributes.material"
                            {...register("attributes.material")}
                            className="rounded-xl"
                            placeholder="VD: Da bò"
                          />
                        </div>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                        Có thể dùng các thuộc tính này để tạo biến thể size, màu
                        hoặc chất liệu khi API biến thể sẵn sàng.
                      </div>
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="flex flex-col gap-1">
                          <Label>Tạo biến thể nhanh</Label>
                          <p className="text-xs text-muted-foreground">
                            Nhập size và màu, hệ thống sẽ tạo tổ hợp biến thể
                            cho sản phẩm đã lưu.
                          </p>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <Input
                            value={variantSizeInput}
                            onChange={(event) =>
                              setVariantSizeInput(event.target.value)
                            }
                            className="rounded-xl"
                            placeholder="Kích thước: 38, 39, 40"
                          />
                          <Input
                            value={variantColorInput}
                            onChange={(event) =>
                              setVariantColorInput(event.target.value)
                            }
                            className="rounded-xl"
                            placeholder="Màu: Đen, Nâu"
                          />
                          <Input
                            value={variantSkuPrefix}
                            onChange={(event) =>
                              setVariantSkuPrefix(event.target.value)
                            }
                            className="rounded-xl"
                            placeholder="Tiền tố SKU"
                          />
                        </div>
                        <Button
                          type="button"
                          className="mt-3 rounded-xl"
                          onClick={generateVariants}
                          disabled={isGeneratingVariants}
                        >
                          {isGeneratingVariants && (
                            <IconLoader2 className="mr-2 size-4 animate-spin" />
                          )}
                          Tạo biến thể size/màu
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
                <TabsContent value="advanced" className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="purchaseNote">Ghi chú mua hàng</Label>
                    <Textarea
                      id="purchaseNote"
                      {...register("purchaseNote")}
                      className="min-h-[100px] rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="menuOrder">Thứ tự menu</Label>
                      <Input
                        id="menuOrder"
                        type="number"
                        {...register("menuOrder", numberValue)}
                        className="rounded-xl"
                      />
                    </div>
                    <ControlledCheckbox
                      control={control}
                      name="enableReviews"
                      label="Cho phép đánh giá"
                      description="Khách hàng có thể gửi đánh giá cho sản phẩm."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Mô tả ngắn</CardTitle>
                <CardDescription>
                  Đoạn giới thiệu ngắn hiển thị gần giá và nút mua hàng.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg bg-orange-50 px-2.5 text-xs text-orange-700 hover:bg-orange-100 hover:text-orange-800 gap-1.5 shrink-0"
                onClick={() => setShowShortDescAiPanel(!showShortDescAiPanel)}
              >
                <IconWand className="size-3.5" />
                Trợ lý AI
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showShortDescAiPanel && (
                <div className="rounded-xl border border-orange-100 bg-orange-50/20 p-3 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={shortDescAiPrompt}
                      onChange={(e) => setShortDescAiPrompt(e.target.value)}
                      placeholder="Nhập yêu cầu (ví dụ: Viết mô tả ngắn làm nổi bật sự êm ái, dáng ôm gọn)..."
                      className="rounded-xl border-stone-300 focus-visible:ring-orange-200 h-9 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          runShortDescAi()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isShortDescAiLoading}
                      className="rounded-xl bg-orange-600 text-xs text-white hover:bg-orange-700 h-9 shrink-0 gap-1"
                      onClick={runShortDescAi}
                    >
                      {isShortDescAiLoading ? (
                        <IconLoader2 className="size-3.5 animate-spin" />
                      ) : (
                        <IconWand className="size-3.5" />
                      )}
                      Viết mô tả ngắn
                    </Button>
                  </div>

                </div>
              )}

              <Controller
                name="shortDescription"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Nhập mô tả ngắn cho sản phẩm (hiển thị gần giá và nút mua hàng)..."
                    className="min-h-[120px] resize-y rounded-xl border-orange-100/80 bg-stone-50/30 focus-visible:border-orange-300 focus-visible:ring-orange-100"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin SEO</CardTitle>
              <CardDescription>
                Cấu hình thẻ meta cho công cụ tìm kiếm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Từ khóa SEO</Label>
                </div>
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-green-100">
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
                              "rounded-full px-1.5 py-0.5 text-[10px] uppercase bg-green-200 text-green-900 font-semibold"
                            )}
                          >
                            Chính
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
                    className="min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone-400 focus:ring-0 focus:border-0"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0 rounded-lg bg-orange-50 text-orange-700 ring-1 ring-orange-100 hover:bg-orange-100 hover:text-orange-800"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={runKeywordAi}
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
                  Nên có 1 từ khóa chính. Thêm các từ khóa phụ nếu cần mở rộng ngữ nghĩa.
                </p>
              </div>
              <div className="hidden flex flex-col gap-2">
                <Label htmlFor="seo.metaTitle">Tiêu đề meta</Label>
                <Input
                  id="seo.metaTitle"
                  {...register("seo.metaTitle")}
                  className="rounded-xl"
                />
              </div>
              <div className="hidden flex flex-col gap-2">
                <Label htmlFor="seo.metaDescription">Mô tả meta</Label>
                <Textarea
                  id="seo.metaDescription"
                  {...register("seo.metaDescription")}
                  className="min-h-[110px] rounded-xl"
                />
              </div>
              <div className="hidden flex flex-col gap-2">
                <Label htmlFor="seo.canonicalUrl">URL chính tắc</Label>
                <Input
                  id="seo.canonicalUrl"
                  {...register("seo.canonicalUrl")}
                  className="rounded-xl"
                />
              </div>
              <SeoAnalysisPanel analysis={seoAnalysis} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border border-stone-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <IconSeo className="size-5 text-orange-600 animate-pulse" />
                <div>
                  <CardTitle className="text-lg">Trợ lý AI SEO & Nội dung</CardTitle>
                  <CardDescription>
                    Viết nháp mô tả chi tiết, mô tả ngắn hoặc tối ưu hóa SEO sản phẩm tự động.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tác vụ AI</Label>
                  <Select
                    value={aiTask}
                    onValueChange={(value) => setAiTask(value as ProductAiTaskType)}
                  >
                    <SelectTrigger className="w-full rounded-xl border-stone-300 focus:ring-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProductAiTask.SEO}>Tối ưu SEO (Đạt điểm cao)</SelectItem>
                      <SelectItem value={ProductAiTask.FULL_DRAFT}>Viết nháp hoàn chỉnh (Short & Full Description)</SelectItem>
                      <SelectItem value={ProductAiTask.OPTIMIZE}>Nâng cao chất lượng (Tăng chuyển đổi)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-stone-500">
                    {aiTask === ProductAiTask.SEO
                      ? "AI sẽ phân tích và sửa các lỗi SEO hiện tại (keyword, headings, alt, links...) để đưa điểm SEO lên >90."
                      : aiTask === ProductAiTask.FULL_DRAFT
                      ? "AI viết nháp phần giới thiệu ngắn và mô tả chi tiết từ tên sản phẩm, danh mục và từ khóa chính."
                      : "AI trau chuốt lại hành văn, thêm điểm nhấn thu hút khách hàng và tối ưu hóa định dạng hiển thị."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Giọng điệu (Tone)</Label>
                  <Input
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    placeholder="tư vấn bán hàng chuyên nghiệp, hiện đại..."
                    className="rounded-xl border-stone-300 focus-visible:ring-orange-200"
                  />
                  <p className="text-xs text-stone-500">
                    Ví dụ: trẻ trung năng động, sang trọng lịch lãm, tư vấn kỹ thuật chi tiết...
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  className="rounded-xl bg-stone-950 text-white hover:bg-stone-800 gap-2"
                  onClick={runProductAi}
                  disabled={isAiLoading}
                >
                  {isAiLoading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconWand className="size-4" />
                  )}
                  {isAiLoading ? "AI đang xử lý..." : "Tạo gợi ý AI"}
                </Button>
              </div>



              {aiResult ? (
                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-900 text-sm">Đánh giá & Thay đổi đề xuất:</p>
                    <p className="text-xs leading-5 text-stone-600">{aiResult.summary}</p>
                  </div>

                  {aiResult.improvements?.length ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-stone-400">Các điểm đã cải tiến</p>
                      <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-stone-700">
                        {aiResult.improvements.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-orange-600 text-xs text-white hover:bg-orange-700"
                      onClick={applyAiSuggestions}
                    >
                      Áp dụng các gợi ý này
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Xuất bản</CardTitle>
              <CardDescription>
                Trạng thái, hiển thị và thao tác nhanh.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={openProductPreview}
                >
                  <IconEye className="mr-2 size-4" />
                  Xem thử
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={saveDraft}
                  disabled={isSaving}
                >
                  Lưu nháp
                </Button>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Label>Trạng thái</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="PUBLISHED">Đang bán</SelectItem>
                        <SelectItem value="DRAFT">Bản nháp</SelectItem>
                        <SelectItem value="HIDDEN">Ẩn</SelectItem>
                        <SelectItem value="SOLD_OUT">Hết hàng</SelectItem>
                        <SelectItem value="DISCONTINUED">Ngừng bán</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Hiển thị catalog</Label>
                <Controller
                  name="catalogVisibility"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn cách hiển thị" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="VISIBLE">
                          Catalog và tìm kiếm
                        </SelectItem>
                        <SelectItem value="CATALOG">Chỉ catalog</SelectItem>
                        <SelectItem value="SEARCH">Chỉ tìm kiếm</SelectItem>
                        <SelectItem value="HIDDEN">Ẩn khỏi catalog</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <IconCalendar className="size-4" />
                  Đăng ngay
                </div>
                <p className="mt-1 text-xs">
                  Có thể bổ sung lịch đăng khi API hỗ trợ publishedAt.
                </p>
              </div>

              {!isNew && (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-orange-200 text-orange-700 bg-orange-50/50 hover:bg-orange-50 hover:text-orange-800 text-xs h-9"
                    onClick={submitToGoogleIndexing}
                    disabled={isIndexingLoading}
                  >
                    {isIndexingLoading ? (
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <IconSeo className="mr-2 size-4" />
                    )}
                    Yêu cầu lập chỉ mục
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 text-xs h-9"
                    onClick={deleteProduct}
                    disabled={isSaving}
                  >
                    <IconTrash className="mr-2 size-4" />
                    Xóa sản phẩm
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Ảnh sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative group">
                <button
                  type="button"
                  className="flex w-full min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border text-center transition-all hover:bg-muted/50 hover:border-orange-200"
                  onClick={() => openMediaPicker("featured")}
                >
                  {featuredImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredImageSrc}
                      alt=""
                      className="size-full max-h-[240px] object-contain p-2"
                    />
                  ) : (
                    <span className="flex flex-col items-center p-6">
                      <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <IconPhoto className="size-6 text-primary" />
                      </span>
                      <span className="text-sm font-medium">
                        Đặt ảnh đại diện
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        Tải lên hoặc chọn từ Media
                      </span>
                    </span>
                  )}
                </button>

                {featuredImageSrc && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFeaturedImageSrc("")
                      setValue("thumbnailMediaId", "", { shouldDirty: true })
                    }}
                    className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Xóa ảnh đại diện"
                  >
                    <IconTrash className="size-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[15px] shadow-sm">
            <CardHeader>
              <CardTitle>Gallery sản phẩm</CardTitle>
              <CardDescription>
                Tải lên hoặc chọn tối đa 10 hình ảnh chi tiết.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => openMediaPicker("gallery")}
                  disabled={galleryImages.length >= gallerySlots.length}
                >
                  <IconPhoto className="mr-1.5 size-4" />
                  Chọn từ Thư viện
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {gallerySlots
                  .slice(0, Math.max(3, galleryImages.length))
                  .map((slot, index) => (
                    <div
                      key={slot}
                      className="overflow-hidden rounded-[15px] border bg-muted/20"
                    >
                      <button
                        type="button"
                        aria-label={`Thêm ${slot.toLowerCase()}`}
                        className="flex aspect-square w-full items-center justify-center overflow-hidden text-muted-foreground transition-colors hover:bg-muted"
                        onClick={() =>
                          galleryImages[index]
                            ? openMediaPicker("gallery-replace", index)
                            : openMediaPicker("gallery-replace", index)
                        }
                      >
                        {galleryImages[index] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={galleryImages[index]}
                            alt=""
                            className="size-full object-contain p-1.5"
                          />
                        ) : (
                          <IconPhoto className="size-5" />
                        )}
                        <span className="sr-only">{`Vị trí gallery ${index + 1}`}</span>
                      </button>
                      {galleryImages[index] ? (
                        <div className="grid grid-cols-4 gap-px border-t bg-border">
                           <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 rounded-none bg-white"
                            onClick={() => moveGalleryImage(index, -1)}
                            disabled={index === 0}
                            aria-label="Đưa ảnh lên trước"
                          >
                            <IconArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 rounded-none bg-white"
                            onClick={() => moveGalleryImage(index, 1)}
                            disabled={index >= galleryImages.length - 1}
                            aria-label="Đưa ảnh xuống sau"
                          >
                            <IconArrowDown className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 rounded-none bg-white"
                            onClick={() => openMediaPicker("gallery-replace", index)}
                            aria-label="Tải ảnh thay thế"
                          >
                            <IconPhoto className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 rounded-none bg-white text-destructive hover:text-destructive"
                            onClick={() => removeGalleryImage(index)}
                            aria-label="Xóa ảnh khỏi gallery"
                          >
                            <IconX className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                {galleryImages.length < gallerySlots.length && (
                  <button
                    type="button"
                    aria-label="Thêm ảnh gallery"
                    className="flex aspect-square items-center justify-center rounded-[15px] border border-dashed bg-muted/20 text-muted-foreground transition-colors hover:bg-muted"
                    onClick={() => openMediaPicker("gallery")}
                  >
                    <IconPlus className="size-5" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Danh mục sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="flex max-h-[260px] flex-col gap-3 overflow-y-auto">
              {isLoadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconLoader2 className="size-4 animate-spin" />
                  Đang tải danh mục...
                </div>
              ) : productCategories.length ? (
                productCategories.map((category) => {
                  const depth = getCategoryDepth(category, productCategories)
                  return (
                    <ArrayCheckbox
                      key={category.id}
                      control={control}
                      name="categoryIds"
                      value={category.id}
                      style={{ paddingLeft: `${depth * 20}px` }}
                      className={category.parentId ? "text-muted-foreground" : "font-medium"}
                      label={category.name}
                    />
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có danh mục sản phẩm.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Thẻ sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {[...tags, ...customTags].map((tag) => (
                  <ArrayCheckbox
                    key={tag}
                    control={control}
                    name="tagIds"
                    value={tag}
                    label={
                      <Badge variant="secondary" className="rounded-xl">
                        {tag}
                      </Badge>
                    }
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  className="rounded-xl"
                  placeholder="Thêm tag mới"
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    addCustomTag()
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={addCustomTag}
                >
                  <IconPlus className="mr-2 size-4" />
                  Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Thương hiệu</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {brands.map((brand) => (
                <ArrayCheckbox
                  key={brand}
                  control={control}
                  name="brandIds"
                  value={brand}
                  label={brand}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {toast ? (
        <div className="fixed right-4 top-[66px] z-[80] w-[min(420px,calc(100vw-32px))]">
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur",
              getToastClassName(toast.tone)
            )}
            role="status"
            aria-live="polite"
          >
            <span className="min-w-0 flex-1 leading-6">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-white/70 hover:text-current"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </form>
  )
}
