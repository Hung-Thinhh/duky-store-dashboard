import { apiClient } from "../axios-client"
import { StoreSettings, StoreSettingsSchema } from "../schemas/settings.schema"

const DEFAULT_SETTINGS: StoreSettings = {
  general: {
    storeName: "Duky Store",
    storeDescription: "",
    supportEmail: "admin@duky.store",
    supportPhone: "",
    address: "",
    currency: "VND",
  },
  branding: {
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#ff6b00",
  },
  seo: {
    defaultMetaTitle: null,
    defaultMetaDescription: null,
    defaultOgImageUrl: null,
  },
  social: {
    facebookUrl: null,
    instagramUrl: null,
    tiktokUrl: null,
  },
  payment: {
    bankName: null,
    accountNumber: null,
    accountName: null,
  },
}

function mergeSettings(grouped: Record<string, any> = {}) {
  return StoreSettingsSchema.parse({
    general: { ...DEFAULT_SETTINGS.general, ...(grouped.general ?? {}) },
    branding: { ...DEFAULT_SETTINGS.branding, ...(grouped.branding ?? {}) },
    seo: { ...DEFAULT_SETTINGS.seo, ...(grouped.seo ?? {}) },
    social: { ...DEFAULT_SETTINGS.social, ...(grouped.social ?? {}) },
    payment: { ...DEFAULT_SETTINGS.payment, ...(grouped.payment ?? {}) },
  })
}

function flattenSettings(settings: StoreSettings) {
  return Object.entries(settings).flatMap(([group, values]) =>
    Object.entries(values as Record<string, unknown>).map(([key, value]) => ({
      key: `${group}.${key}`,
      group,
      value,
      isPublic: group !== "payment",
    }))
  )
}

export const settingsService = {
  async getSettings() {
    const response = await apiClient.get("/admin/settings")
    return mergeSettings(response.DT?.grouped)
  },

  async updateSettings(data: StoreSettings) {
    const response = await apiClient.patch("/admin/settings/bulk", {
      settings: flattenSettings(data),
    })
    return response.DT
  },
}
