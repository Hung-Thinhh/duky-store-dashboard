import { z } from "zod"
import { createPaginatedResponseSchema, createResponseSchema } from "./base.schema"

export const AdminUserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  CUSTOMER_SUPPORT: "CUSTOMER_SUPPORT",
} as const

export const AdminUserSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional().nullable(),
  status: z.string().optional(),
  role: z.nativeEnum(AdminUserRole).default("EDITOR"),
  roles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    isSystem: z.boolean().optional(),
  })).optional().default([]),
  isActive: z.boolean().default(true),
  lastLoginAt: z.string().optional().nullable(),
  createdAt: z.string().optional(),
}).transform((user) => ({
  ...user,
  role: (user.roles[0]?.name as keyof typeof AdminUserRole | undefined) ?? user.role,
  isActive: user.isActive ?? user.status !== "LOCKED",
}))

export const CreateAdminUserPayloadSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.nativeEnum(AdminUserRole).default("EDITOR"),
  isActive: z.boolean().default(true),
})

export const UpdateAdminUserPayloadSchema = CreateAdminUserPayloadSchema.partial().omit({ password: true })

export const AdminUserListResponseSchema = createPaginatedResponseSchema(AdminUserSchema)
export const AdminUserDetailResponseSchema = createResponseSchema(AdminUserSchema)

export type AdminUser = z.input<typeof AdminUserSchema>
export type CreateAdminUserPayload = z.input<typeof CreateAdminUserPayloadSchema>
export type UpdateAdminUserPayload = z.input<typeof UpdateAdminUserPayloadSchema>
