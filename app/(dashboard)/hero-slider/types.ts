export type ViewportMode = "desktop" | "tablet" | "mobile"
export type LayerType = "image" | "text" | "button"

export interface CropData {
  x: number
  y: number
  width: number
  height: number
}

export interface SlideLayer {
  type: LayerType
  name?: string
  zIndex: number
  locked?: boolean

  // Layout (flat — was nested under layout[viewport])
  top?: string
  left?: string
  width?: string
  height?: string
  objectFit?: "cover" | "contain"
  objectPosition?: string
  display?: string

  // Image fields
  mediaId?: string
  src?: string
  srcMobile?: string
  alt?: string
  float?: {
    duration: number
    delay: number
    displacement: number
    direction: "down" | "up" | "right" | "left"
  }
  crop?: CropData

  // Text fields
  content?: string
  fontSize?: number
  fontWeight?: number
  color?: string
  fontFamily?: "montserrat" | "playfair"
  textAlign?: "left" | "center" | "right"
  textShadow?: string
  letterSpacing?: number
  lineHeight?: number

  // Button fields
  label?: string
  link?: string
  variant?: "primary" | "secondary"
  buttonColor?: string
  textColor?: string

  // Entrance animation (all layer types)
  entranceAnimation?: {
    type: "none" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "fade"
    duration: number
    delay: number
  }
}

export interface CTAButton {
  label: string
  link: string
  variant: "primary" | "secondary"
}

export interface SlideData {
  id: string
  layers: {
    desktop: SlideLayer[]
    tablet: SlideLayer[]
    mobile: SlideLayer[]
  }
  text: {
    badge: string
    title: string
    tagline: string
    buttons: CTAButton[]
  }
}

// ─── Catalog Banner Types ─────────────────────────────────────────────

export const CATALOG_SLOTS = [
  { key: "boot-nam", label: "Boot Nam" },
  { key: "boot-nu", label: "Boot Nữ" },
  { key: "phu-kien", label: "Phụ Kiện" },
  { key: "unisex", label: "Unisex" },
  { key: "phoi-do", label: "Phối Đồ" },
  { key: "kinh-nghiem", label: "Kinh Nghiệm" },
  { key: "lien-he", label: "Liên Hệ" },
  { key: "tim-kiem", label: "Tìm Kiếm" },
  { key: "san-pham", label: "Sản Phẩm" },
] as const

export type CatalogSlotKey = typeof CATALOG_SLOTS[number]["key"]

export interface CatalogSlotData {
  image?: string
  badge?: string
  titleLine1?: string
  titleLine2?: string
  description?: string
}

export type CatalogBannerSlots = Record<CatalogSlotKey, {
  desktop: CatalogSlotData
  tablet: CatalogSlotData
  mobile: CatalogSlotData
}>

const emptySlotData: CatalogSlotData = {}
const emptySlots = { desktop: { ...emptySlotData }, tablet: { ...emptySlotData }, mobile: { ...emptySlotData } }

export function defaultCatalogSlots(): CatalogBannerSlots {
  return Object.fromEntries(
    CATALOG_SLOTS.map((s) => [s.key, { ...emptySlots }])
  ) as CatalogBannerSlots
}
