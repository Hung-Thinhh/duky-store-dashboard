import { z } from "zod"
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema"

export const RedirectSchema = z.object({
  id: z.string(),
  sourcePath: z.string().min(1, "Đường dẫn gốc là bắt buộc"),
  targetPath: z.string().optional(),
  destinationPath: z.string().optional(),
  statusCode: z.number().default(301),
  type: z.enum(["301", "302"]).optional(),
  status: z.string().default("ACTIVE"),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
}).transform((redirect) => ({
  ...redirect,
  destinationPath: redirect.destinationPath ?? redirect.targetPath ?? "",
  type: redirect.type ?? (String(redirect.statusCode) as "301" | "302"),
  isActive: redirect.isActive ?? redirect.status === "ACTIVE",
}))

export const CreateRedirectPayloadSchema = z.object({
  sourcePath: z.string().min(1, "Đường dẫn gốc là bắt buộc"),
  destinationPath: z.string().min(1, "Đường dẫn đích là bắt buộc"),
  type: z.enum(["301", "302"]).default("301"),
  isActive: z.boolean().default(true),
})

export const UpdateRedirectPayloadSchema = CreateRedirectPayloadSchema.partial()

export const RedirectListResponseSchema = createPaginatedResponseSchema(RedirectSchema)
export const RedirectDetailResponseSchema = createResponseSchema(RedirectSchema)

export type Redirect = z.input<typeof RedirectSchema>
export type CreateRedirectPayload = z.input<typeof CreateRedirectPayloadSchema>
export type UpdateRedirectPayload = z.input<typeof UpdateRedirectPayloadSchema>
