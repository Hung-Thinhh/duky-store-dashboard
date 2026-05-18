import { z } from "zod";
import { createResponseSchema } from "./base.schema";

export const StoreSettingsSchema = z.object({
  general: z.object({
    storeName: z.string(),
    storeDescription: z.string(),
    supportEmail: z.string().email(),
    supportPhone: z.string(),
    address: z.string(),
    currency: z.string().default("VND"),
  }),
  branding: z.object({
    logoUrl: z.string().optional().nullable(),
    faviconUrl: z.string().optional().nullable(),
    primaryColor: z.string().optional().nullable(),
  }),
  seo: z.object({
    defaultMetaTitle: z.string().optional().nullable(),
    defaultMetaDescription: z.string().optional().nullable(),
    defaultOgImageUrl: z.string().optional().nullable(),
  }),
  social: z.object({
    facebookUrl: z.string().optional().nullable(),
    instagramUrl: z.string().optional().nullable(),
    tiktokUrl: z.string().optional().nullable(),
  }),
  payment: z.object({
    bankName: z.string().optional().nullable(),
    accountNumber: z.string().optional().nullable(),
    accountName: z.string().optional().nullable(),
  })
});

export const SettingsResponseSchema = createResponseSchema(StoreSettingsSchema);

export type StoreSettings = z.input<typeof StoreSettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
