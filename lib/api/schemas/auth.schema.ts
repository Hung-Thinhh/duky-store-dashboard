import { z } from "zod"
import { createResponseSchema } from "./base.schema"

export const LoginPayloadSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
})

export const GoogleLoginPayloadSchema = z.object({
  idToken: z.string().min(1, "Google token khong hop le"),
  clientId: z.string().optional(),
})

export const UserInfoSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()).optional(),
  status: z.string().optional(),
})

export const ChangePasswordPayloadSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
})

export const LoginResponseDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessExpiresIn: z.string().optional(),
  refreshExpiresIn: z.string().optional(),
  user: UserInfoSchema,
})

export const LoginResponseSchema = createResponseSchema(LoginResponseDataSchema)

export type LoginPayload = z.infer<typeof LoginPayloadSchema>
export type GoogleLoginPayload = z.infer<typeof GoogleLoginPayloadSchema>
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayloadSchema>
export type UserInfo = z.infer<typeof UserInfoSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
