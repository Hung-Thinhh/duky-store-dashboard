"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authService } from "@/lib/api/services/auth.service"
import {
  IconBuildingStore,
  IconDashboard,
  IconShoppingBag,
  IconPackage,
  IconCategory,
  IconTags,
  IconAdjustments,
  IconBoxSeam,
  IconUsers,
  IconArticle,
  IconLayout,
  IconPhoto,
  IconRoute,
  IconSitemap,
  IconSettings,
  IconBell,
  IconSpeakerphone,
  IconReportAnalytics,
  IconUserShield,
  IconChevronDown,
  IconUserCircle,
  IconLogout,
  IconSearch,
  IconCarouselHorizontal,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InlineFeedback } from "@/components/ui/inline-feedback"
import { Input } from "@/components/ui/input"

const navGroups = [
  {
    label: "Tổng quan",
    items: [
      {
        title: "Bảng điều khiển",
        icon: IconDashboard,
        href: "/",
        active: true,
      },
    ],
  },
  {
    label: "Đơn hàng",
    items: [
      { title: "Tất cả đơn hàng", icon: IconShoppingBag, href: "/orders" },
    ],
  },
  {
    label: "Sản phẩm",
    items: [
      { title: "Sản phẩm", icon: IconPackage, href: "/products" },
      { title: "Danh mục", icon: IconCategory, href: "/categories" },
      { title: "Tags", icon: IconTags, href: "/tags" },
      {
        title: "Biến thể / Kích thước",
        icon: IconAdjustments,
        href: "/variants",
      },
      { title: "Tồn kho", icon: IconBoxSeam, href: "/inventory" },
    ],
  },
  {
    label: "Khách hàng",
    items: [
      { title: "Danh sách khách hàng", icon: IconUsers, href: "/customers" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { title: "Blog", icon: IconArticle, href: "/blog" },
      { title: "Danh mục blog", icon: IconCategory, href: "/blog-categories" },
      { title: "Trang chủ", icon: IconLayout, href: "/home-content" },
      { title: "Banner", icon: IconCarouselHorizontal, href: "/hero-slider" },
      { title: "Thư viện media", icon: IconPhoto, href: "/media" },
      { title: "Gallery lookbook", icon: IconPhoto, href: "/gallery" },
    ],
  },
  {
    label: "SEO",
    items: [
      {
        title: "Google Search Console",
        icon: IconSearch,
        href: "/search-console",
      },
      { title: "Redirect 301", icon: IconRoute, href: "/redirects" },
      { title: "Sitemap / Robots", icon: IconSitemap, href: "/sitemap" },
    ],
  },
  {
    label: "Tiếp thị",
    items: [
      {
        title: "Công cụ tăng trưởng",
        icon: IconSpeakerphone,
        href: "/marketing",
      },
    ],
  },
  {
    label: "Báo cáo",
    items: [{ title: "Báo cáo", icon: IconReportAnalytics, href: "/reports" }],
  },
  {
    label: "Hệ thống",
    items: [
      { title: "Cài đặt", icon: IconSettings, href: "/settings" },
      { title: "Thông báo", icon: IconBell, href: "/notifications" },
      { title: "Tài khoản admin", icon: IconUserShield, href: "/admins" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [user, setUser] = React.useState<ReturnType<typeof authService.getUser>>(null)
  React.useEffect(() => {
    setUser(authService.getUser())
  }, [])
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = React.useState(false)
  const [isSavingPassword, setIsSavingPassword] = React.useState(false)
  const [passwordFeedback, setPasswordFeedback] = React.useState<{
    message: string
    tone: "success" | "error"
  } | null>(null)
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "DK"

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setPasswordFeedback(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({
        message: "Mật khẩu xác nhận chưa khớp.",
        tone: "error",
      })
      return
    }

    try {
      setIsSavingPassword(true)
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordFeedback({
        message: "Đã đổi mật khẩu thành công.",
        tone: "success",
      })
    } catch (error) {
      console.error("Failed to change password", error)
      setPasswordFeedback({
        message: "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại.",
        tone: "error",
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-border/50 px-4 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:bg-transparent active:bg-transparent"
              >
                <Link href="/">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary">
                    <IconBuildingStore className="size-4 text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold tracking-tight">
                      Duky Store
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Trang quản trị
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 py-2">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              {group.label && (
                <SidebarGroupLabel className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          item.href === "/"
                            ? pathname === "/"
                            : pathname === item.href ||
                              pathname?.startsWith(item.href + "/")
                        }
                        tooltip={item.title}
                        className="h-9 rounded-xl text-[13px] font-medium transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[active=true]:bg-accent-soft data-[active=true]:font-semibold data-[active=true]:text-primary"
                      >
                        <Link href={item.href}>
                          <item.icon
                            className="size-[18px] shrink-0 transition-all group-data-[collapsible=icon]:size-[22px]"
                            strokeWidth={1.8}
                          />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-border/50 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-xl group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-[state=open]:bg-secondary"
                  >
                    <Avatar className="size-8 shrink-0 rounded-xl">
                      <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium">
                        {user?.fullName || "Quản trị Duky"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email || "admin@duky.store"}
                      </span>
                    </div>
                    <IconChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-[--radix-dropdown-menu-trigger-width] rounded-xl"
                >
                  <DropdownMenuItem
                    className="rounded-lg"
                    onClick={() => setIsProfileOpen(true)}
                  >
                    <IconUserCircle className="mr-2 size-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg"
                    onClick={() => setIsPasswordOpen(true)}
                  >
                    <IconSettings className="mr-2 size-4" />
                    Đổi mật khẩu
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg text-destructive"
                    onClick={() => authService.logout()}
                  >
                    <IconLogout className="mr-2 size-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin tài khoản</DialogTitle>
            <DialogDescription>
              Thông tin admin đang đăng nhập.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 rounded-xl border bg-card p-4 text-sm">
            <div>
              <span className="mb-1 block text-xs tracking-wider text-muted-foreground uppercase">
                Họ tên
              </span>
              <span className="font-medium">{user?.fullName || "N/A"}</span>
            </div>
            <div>
              <span className="mb-1 block text-xs tracking-wider text-muted-foreground uppercase">
                Email
              </span>
              <span>{user?.email || "N/A"}</span>
            </div>
            <div>
              <span className="mb-1 block text-xs tracking-wider text-muted-foreground uppercase">
                Vai trò
              </span>
              <span>{user?.roles?.join(", ") || "N/A"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => setIsProfileOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Đổi mật khẩu</DialogTitle>
              <DialogDescription>
                Mật khẩu mới cần tối thiểu 8 ký tự.
              </DialogDescription>
            </DialogHeader>
            <InlineFeedback
              message={passwordFeedback?.message ?? null}
              tone={passwordFeedback?.tone}
            />
            <div className="space-y-3">
              <Input
                required
                type="password"
                placeholder="Mật khẩu hiện tại"
                className="rounded-xl"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((form) => ({
                    ...form,
                    currentPassword: event.target.value,
                  }))
                }
              />
              <Input
                required
                minLength={8}
                type="password"
                placeholder="Mật khẩu mới"
                className="rounded-xl"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((form) => ({
                    ...form,
                    newPassword: event.target.value,
                  }))
                }
              />
              <Input
                required
                minLength={8}
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                className="rounded-xl"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((form) => ({
                    ...form,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={isSavingPassword}
                onClick={() => setIsPasswordOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Đang lưu..." : "Lưu mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
