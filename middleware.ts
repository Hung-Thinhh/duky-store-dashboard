import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AUTH_COOKIE_NAMES } from "@/lib/auth/session-cookies"

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!refreshToken && !isLoginPage) {
    // Chưa login mà vào dashboard -> văng ra login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (refreshToken && isLoginPage) {
    // Đã login mà cố vào lại trang login -> quay về dashboard
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Cấu hình matcher để middleware chỉ chạy trên các trang cần thiết,
// bỏ qua api, _next/static, _next/image, favicon.svg...
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.svg).*)"],
}
