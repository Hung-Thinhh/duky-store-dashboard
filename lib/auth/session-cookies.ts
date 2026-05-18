export const AUTH_COOKIE_NAMES = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
} as const

export const DEFAULT_ACCESS_EXPIRES_IN = "15m"
export const DEFAULT_REFRESH_EXPIRES_IN = "7d"

export type AuthExpirationString = `${number}${"s" | "m" | "h" | "d"}`

const EXPIRATION_PATTERN = /^(\d+)(s|m|h|d)$/
const DAY_IN_MS = 24 * 60 * 60 * 1000

export function normalizeAuthExpiration(
  value: string | undefined,
  fallback: AuthExpirationString
): AuthExpirationString {
  return EXPIRATION_PATTERN.test(value ?? "")
    ? (value as AuthExpirationString)
    : fallback
}

export function authExpirationToMilliseconds(
  value: string | undefined,
  fallback: AuthExpirationString
) {
  const normalizedValue = normalizeAuthExpiration(value, fallback)
  const match = normalizedValue.match(EXPIRATION_PATTERN)

  if (!match) {
    return authExpirationToMilliseconds(fallback, DEFAULT_REFRESH_EXPIRES_IN)
  }

  const amount = Number(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: DAY_IN_MS,
  }

  return amount * multipliers[unit]
}

export function authExpirationToCookieDays(
  value: string | undefined,
  fallback: AuthExpirationString
) {
  return authExpirationToMilliseconds(value, fallback) / DAY_IN_MS
}
