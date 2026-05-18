"use client"

import {
  IconSearch,
  IconBell,
  IconCalendar,
  IconChevronDown,
} from "@tabler/icons-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Topbar() {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border/50 bg-background px-4">
      <SidebarTrigger className="-ml-1 size-8 rounded-xl text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      {/* Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-foreground">Bảng điều khiển</h1>
      </div>

      {/* Search */}
      <div className="ml-auto flex items-center">
        <div className="relative hidden md:block">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm đơn hàng, sản phẩm..."
            className="h-9 w-72 rounded-full border-border/60 bg-secondary/50 pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Date Range */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground lg:flex"
        >
          <IconCalendar className="size-4" strokeWidth={1.8} />
          <span>01/05 - 09/05/2026</span>
          <IconChevronDown className="size-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 hidden h-5 lg:block" />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative rounded-xl text-muted-foreground hover:text-foreground"
        >
          <IconBell className="size-[18px]" strokeWidth={1.8} />
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            3
          </span>
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 h-8 gap-2 rounded-xl px-2"
            >
              <Avatar className="size-7 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  DK
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline-block">
                Duky
              </span>
              <IconChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem className="rounded-lg">
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg">
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-destructive">
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
