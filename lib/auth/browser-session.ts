import Cookies from "js-cookie"

import type { UserInfo } from "@/lib/api/schemas/auth.schema"
import {
  AUTH_COOKIE_NAMES,
  type AuthExpirationString,
  authExpirationToCookieDays,
  DEFAULT_ACCESS_EXPIRES_IN,
  DEFAULT_REFRESH_EXPIRES_IN,
} from "./session-cookies"

type AuthSession = {
  accessToken: string
  refreshToken: string
  accessExpiresIn?: string
  refreshExpiresIn?: string
  user: UserInfo
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
  setAuthCookie(
    AUTH_COOKIE_NAMES.accessToken,
    session.accessToken,
    session.accessExpiresIn,
    DEFAULT_ACCESS_EXPIRES_IN
  )
  setAuthCookie(
    AUTH_COOKIE_NAMES.refreshToken,
    session.refreshToken,
    session.refreshExpiresIn,
    DEFAULT_REFRESH_EXPIRES_IN
  )
  setAuthCookie(
    AUTH_COOKIE_NAMES.user,
    JSON.stringify(session.user),
    session.refreshExpiresIn,
    DEFAULT_REFRESH_EXPIRES_IN
  )
}

export function clearAuthSession() {
  Object.values(AUTH_COOKIE_NAMES).forEach((name) => {
    Cookies.remove(name, { path: "/" })
  })
}

export function getAccessToken() {
  return Cookies.get(AUTH_COOKIE_NAMES.accessToken)
}

export function getRefreshToken() {
  return Cookies.get(AUTH_COOKIE_NAMES.refreshToken)
}

export function getStoredUser(): UserInfo | null {
  const user = Cookies.get(AUTH_COOKIE_NAMES.user)

  if (!user) {
    return null
  }

  try {
    return JSON.parse(user) as UserInfo
  } catch {
    return null
  }
}
