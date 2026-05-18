import { apiClient } from "../axios-client"
import {
  ChangePasswordPayload,
  GoogleLoginPayload,
  LoginPayload,
  LoginResponseDataSchema,
  UserInfo,
  UserInfoSchema,
} from "../schemas/auth.schema"
import {
  clearAuthSession,
  getRefreshToken,
  getStoredUser,
  persistAuthSession,
} from "@/lib/auth/browser-session"

export const authService = {
  async login(payload: LoginPayload) {
    const response = await apiClient.post("/admin/auth/login", payload)
    const validData = LoginResponseDataSchema.parse(response.DT)

    persistAuthSession(validData)

    return validData
  },

  async loginWithGoogle(payload: GoogleLoginPayload) {
    const response = await apiClient.post("/admin/auth/google", payload)
    const validData = LoginResponseDataSchema.parse(response.DT)

    persistAuthSession(validData)

    return validData
  },

  async logout() {
    const refreshToken = getRefreshToken()

    try {
      if (refreshToken) {
        await apiClient.post("/admin/auth/logout", { refreshToken })
      }
    } catch (error) {
      console.error(
        "Logout API failed, but will still clear local storage",
        error
      )
    } finally {
      // Dọn dẹp local bất kể BE có trả về thành công hay không
      clearAuthSession()
      window.location.href = "/login"
    }
  },

  async getMe() {
    const response = await apiClient.get("/admin/auth/me")
    return UserInfoSchema.parse(response.DT)
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await apiClient.patch(
      "/admin/auth/change-password",
      payload
    )
    return response.DT
  },

  getUser(): UserInfo | null {
    return getStoredUser()
  },
}
