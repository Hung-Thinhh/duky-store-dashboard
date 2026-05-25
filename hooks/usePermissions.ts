import * as React from "react"
import { getStoredUser } from "@/lib/auth/browser-session"

export function usePermissions() {
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [role, setRole] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const user = getStoredUser()
    if (user) {
      setPermissions(user.permissions || [])
      setRole(user.roles?.[0] || null)
    }
    setIsLoading(false)
  }, [])

  const hasPermission = React.useCallback(
    (permission: string): boolean => {
      if (isLoading) return false
      // ADMIN hoặc SUPER_ADMIN có quyền '*' được phép làm mọi thứ
      if (permissions.includes("*") || role === "SUPER_ADMIN" || role === "ADMIN") {
        return true
      }
      return permissions.includes(permission)
    },
    [permissions, role, isLoading]
  )

  const hasAnyPermission = React.useCallback(
    (requiredPermissions: string[]): boolean => {
      if (isLoading) return false
      if (permissions.includes("*") || role === "SUPER_ADMIN" || role === "ADMIN") {
        return true
      }
      return requiredPermissions.some((perm) => permissions.includes(perm))
    },
    [permissions, role, isLoading]
  )

  return {
    permissions,
    role,
    isLoading,
    hasPermission,
    hasAnyPermission,
  }
}
