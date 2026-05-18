export const ProductStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  HIDDEN: "HIDDEN",
  SOLD_OUT: "SOLD_OUT",
  DISCONTINUED: "DISCONTINUED",
} as const;
export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus];

export const ProductType = {
  SIMPLE: "SIMPLE",
  GROUPED: "GROUPED",
  EXTERNAL: "EXTERNAL",
  VARIABLE: "VARIABLE",
} as const;
export type ProductTypeEnum = typeof ProductType[keyof typeof ProductType];

export const ContentStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  HIDDEN: "HIDDEN",
  ARCHIVED: "ARCHIVED",
} as const;
export type ContentStatusType = typeof ContentStatus[keyof typeof ContentStatus];

export const CategoryStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type CategoryStatusType = typeof CategoryStatus[keyof typeof CategoryStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPING: "SHIPPING",
  COMPLETED: "COMPLETED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const ShippingStatus = {
  NOT_SHIPPED: "NOT_SHIPPED",
  READY_TO_SHIP: "READY_TO_SHIP",
  SHIPPING: "SHIPPING",
  DELIVERED: "DELIVERED",
  RETURNED: "RETURNED",
  FAILED: "FAILED",
} as const;
export type ShippingStatusType = typeof ShippingStatus[keyof typeof ShippingStatus];

export const PaymentMethod = {
  COD: "COD",
  BANK_TRANSFER: "BANK_TRANSFER",
  PAYOS: "PAYOS",
  VNPAY: "VNPAY",
  MOMO: "MOMO",
  ZALOPAY: "ZALOPAY",
} as const;
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

export const CustomerStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
} as const;
export type CustomerStatusType = typeof CustomerStatus[keyof typeof CustomerStatus];

export const CustomerType = {
  NEW: "NEW",
  REGULAR: "REGULAR",
  VIP: "VIP",
  WHOLESALE: "WHOLESALE",
} as const;
export type CustomerTypeEnum = typeof CustomerType[keyof typeof CustomerType];

export const TagType = {
  PRODUCT: "PRODUCT",
  BLOG: "BLOG",
  BOTH: "BOTH",
} as const;
export type TagTypeEnum = typeof TagType[keyof typeof TagType];

export const HomepageSectionType = {
  HERO: "HERO",
  SALE_BANNER: "SALE_BANNER",
  FEATURED_PRODUCTS: "FEATURED_PRODUCTS",
  BEST_SELLERS: "BEST_SELLERS",
  NEW_PRODUCTS: "NEW_PRODUCTS",
  MEN_PRODUCTS: "MEN_PRODUCTS",
  WOMEN_PRODUCTS: "WOMEN_PRODUCTS",
  FEEDBACK: "FEEDBACK",
  VIDEO: "VIDEO",
  SERVICE_COMMITMENT: "SERVICE_COMMITMENT",
  CTA: "CTA",
  CUSTOM: "CUSTOM",
} as const;
export type HomepageSectionTypeEnum = typeof HomepageSectionType[keyof typeof HomepageSectionType];

export const SettingValueType = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  JSON: "JSON",
  IMAGE: "IMAGE",
} as const;
export type SettingValueTypeEnum = typeof SettingValueType[keyof typeof SettingValueType];
