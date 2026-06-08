import Cookies from "js-cookie"

import type { UserInfo } from "@/lib/api/schemas/auth.schema"
import {
  AUTH_COOKIE_NAMES,
  type AuthExpirationString,
  authExpirationToCookieDays,
  DEFAULT_REFRESH_EXPIRES_IN,
} from "./session-cookies"

type AuthSession = {
  accessToken: string
  refreshToken: string
  accessExpiresIn?: string
  refreshExpiresIn?: string
  user: UserInfo
}

const LOCAL_STORAGE_KEYS = {
  accessToken: "admin_access_token",
  refreshToken: "admin_refresh_token",
  user: "admin_user",
}

function getBaseCookieOptions() {
  return {
    path: "/",
    secure:
      typeof window !== "undefined"
        ? window.location.protocol === "https:"
        : false,
    sameSite: "lax" as const,
  }
}

function setAuthCookie(
  name: string,
  value: string,
  expiresIn: string | undefined,
  fallbackExpiresIn: AuthExpirationString
) {
  Cookies.set(name, value, {
    ...getBaseCookieOptions(),
    expires: authExpirationToCookieDays(expiresIn, fallbackExpiresIn),
  })
}

export function persistAuthSession(session: AuthSession) {
  // 1. Lưu refreshToken vào cookie để middleware.ts ở server-side đọc được
  setAuthCookie(
    AUTH_COOKIE_NAMES.refreshToken,
    session.refreshToken,
    session.refreshExpiresIn,
    DEFAULT_REFRESH_EXPIRES_IN
  )

  // 2. Lưu tất cả vào localStorage để tránh giới hạn kích thước 4KB của cookie
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEYS.accessToken, session.accessToken)
    localStorage.setItem(LOCAL_STORAGE_KEYS.refreshToken, session.refreshToken)
    localStorage.setItem(LOCAL_STORAGE_KEYS.user, JSON.stringify(session.user))
  }
}

export function clearAuthSession() {
  // Xóa cookies
  Object.values(AUTH_COOKIE_NAMES).forEach((name) => {
    Cookies.remove(name, { path: "/" })
  })

  // Xóa localStorage
  if (typeof window !== "undefined") {
    Object.values(LOCAL_STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  }
}

export function getAccessToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.accessToken) || null
  }
  return null
}

export function getRefreshToken() {
  // Ưu tiên lấy từ cookie trước (để nhất quán với server-side), fallback về localStorage
  const cookieToken = Cookies.get(AUTH_COOKIE_NAMES.refreshToken)
  if (cookieToken) return cookieToken

  if (typeof window !== "undefined") {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.refreshToken) || null
  }
  return null
}

export function getStoredUser(): UserInfo | null {
  let userStr: string | null = null

  if (typeof window !== "undefined") {
    userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.user)
  }

  // Fallback sang cookie nếu localStorage chưa có (hỗ trợ quá trình chuyển giao)
  if (!userStr) {
    userStr = Cookies.get(AUTH_COOKIE_NAMES.user) || null
  }

  if (!userStr) {
    return null
  }

  try {
    return JSON.parse(userStr) as UserInfo
  } catch {
    return null
  }
}
