"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconDeviceFloppy,
  IconShield,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { adminUserService } from "@/lib/api/services/admin.service"
import { AdminUser, CreateAdminUserPayloadSchema, CreateAdminUserPayload, AdminUserRole } from "@/lib/api/schemas/admin.schema"

const roleConfig: Record<string, { color: string; label: string }> = {
  [AdminUserRole.SUPER_ADMIN]: { color: "bg-purple-100 text-purple-700", label: "Toàn quyền" },
  [AdminUserRole.ADMIN]: { color: "bg-blue-100 text-blue-700", label: "Quản trị" },
  [AdminUserRole.CONTENT_EDITOR]: { color: "bg-emerald-100 text-emerald-700", label: "Biên tập viên" },
  [AdminUserRole.ORDER_MANAGER]: { color: "bg-orange-100 text-orange-700", label: "Quản lý đơn" },
  [AdminUserRole.STAFF]: { color: "bg-amber-100 text-amber-700", label: "Nhân viên" },
}

const mockUsers: AdminUser[] = [
  {
    id: "adm_1",
    fullName: "Nguyễn Vĩ Cường",
    email: "admin@dukystore.vn",
    role: "SUPER_ADMIN",
    isActive: true,
    lastLoginAt: "2026-05-10T08:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "adm_2",
    fullName: "Lê Minh Tuấn",
    email: "tuan.le@dukystore.vn",
    role: "CONTENT_EDITOR",
    isActive: true,
    lastLoginAt: "2026-05-09T14:30:00Z",
    createdAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "adm_3",
    fullName: "Phạm Thị Lan",
    email: "lan.pham@dukystore.vn",
    role: "STAFF",
    isActive: false,
    createdAt: "2026-04-10T00:00:00Z",
  }
]

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateAdminUserPayload>({
    resolver: zodResolver(CreateAdminUserPayloadSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "CONTENT_EDITOR",
      isActive: true,
    },
  })

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await adminUserService.getUsers()
      setUsers(data.data)
    } catch (error) {
      console.warn("Failed to fetch admin users, using mock data", error)
      setUsers(mockUsers)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const [formFeedback, setFormFeedback] = React.useState<{ message: string; tone: "success" | "error" } | null>(null)

  const handleOpenSheet = (user?: AdminUser) => {
    setFormFeedback(null)
    if (user) {
      setEditingUser(user)
      reset({
        fullName: user.fullName,
        email: user.email,
        password: "fake_password_for_validation_pass", // Mock password for validation pass
        role: user.role as any,
        isActive: user.isActive,
      })
    } else {
      setEditingUser(null)
      reset({
        fullName: "",
        email: "",
        password: "",
        role: "CONTENT_EDITOR",
        isActive: true,
      })
    }
    setIsSheetOpen(true)
  }

  const onSubmit = async (data: CreateAdminUserPayload) => {
    try {
      setIsSaving(true)
      setFormFeedback(null)
      if (editingUser) {
        // Cập nhật thông tin profile
        await adminUserService.updateUser(editingUser.id, {
          fullName: data.fullName,
          email: data.email,
        })

        // Cập nhật role nếu thay đổi
        if (data.role && data.role !== editingUser.role) {
          await adminUserService.assignRoles(editingUser.id, [data.role])
        }

        // Cập nhật trạng thái hoạt động nếu thay đổi
        if (data.isActive !== editingUser.isActive) {
          if (data.isActive) {
            await adminUserService.unlockUser(editingUser.id)
          } else {
            await adminUserService.lockUser(editingUser.id)
          }
        }

        setFormFeedback({ message: "Cập nhật tài khoản thành công!", tone: "success" })
      } else {
        // Tạo mới tài khoản thực tế qua API mới ở backend
        await adminUserService.createUser({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role ?? "CONTENT_EDITOR",
          isActive: data.isActive,
        })
        setFormFeedback({ message: "Tạo tài khoản mới thành công!", tone: "success" })
      }
      
      // Delay một chút rồi đóng Sheet để người dùng nhìn thấy feedback thành công
      setTimeout(() => {
        setIsSheetOpen(false)
        fetchUsers()
      }, 1000)
    } catch (error: any) {
      console.error("Failed to save admin user", error)
      const errorMessage = error?.response?.data?.message || "Lưu tài khoản thất bại. Vui lòng kiểm tra lại thông tin."
      setFormFeedback({ message: errorMessage, tone: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" không?`)) {
      try {
        setIsLoading(true)
        await adminUserService.deleteUser(id)
        alert("Đã xóa tài khoản thành công.")
        fetchUsers()
      } catch (error: any) {
        console.error("Failed to delete user", error)
        const errorMessage = error?.response?.data?.message || "Xóa tài khoản thất bại."
        alert(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài khoản quản trị</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các tài khoản có quyền truy cập vào dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl" onClick={() => handleOpenSheet()}>
            <IconPlus className="mr-2 size-4" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, email..."
            className="w-full rounded-xl pl-9 md:w-[350px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto max-w-full rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12">Tài khoản</TableHead>
              <TableHead className="h-12">Phân quyền</TableHead>
              <TableHead className="h-12">Trạng thái</TableHead>
              <TableHead className="h-12">Đăng nhập lần cuối</TableHead>
              <TableHead className="h-12 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Không tìm thấy tài khoản nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={(roleConfig[user.role ?? "CONTENT_EDITOR"]?.color ?? "") + " border-transparent rounded-md gap-1"}
                    >
                      <IconShield className="size-3" />
                      {roleConfig[user.role ?? "CONTENT_EDITOR"]?.label || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`rounded-md ${user.isActive ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-rose-200 text-rose-700 bg-rose-50'}`}
                    >
                      {user.isActive ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-32">
                        <DropdownMenuItem onClick={() => handleOpenSheet(user)} className="rounded-lg cursor-pointer">
                          <IconEdit className="mr-2 size-4" /> Sửa
                        </DropdownMenuItem>
                        {user.role !== "SUPER_ADMIN" && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                            className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <IconTrash className="mr-2 size-4" /> Xóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[400px]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader className="border-b p-6 pb-4">
              <SheetTitle>
                {editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
              </SheetTitle>
              <SheetDescription>
                Cấp quyền truy cập hệ thống quản trị.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
              {formFeedback && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${formFeedback.tone === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {formFeedback.message}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ tên *</Label>
                <Input id="fullName" {...register("fullName")} className="rounded-xl" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} className="rounded-xl" disabled={!!editingUser} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
                {editingUser && <p className="text-xs text-muted-foreground">Không thể thay đổi email sau khi tạo.</p>}
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <Input id="password" type="password" {...register("password")} className="rounded-xl" />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>Phân quyền</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={editingUser?.role === "SUPER_ADMIN"}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn quyền" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value={AdminUserRole.ADMIN}>Quản trị</SelectItem>
                        <SelectItem value={AdminUserRole.ORDER_MANAGER}>Quản lý đơn hàng</SelectItem>
                        <SelectItem value={AdminUserRole.CONTENT_EDITOR}>Biên tập viên</SelectItem>
                        <SelectItem value={AdminUserRole.STAFF}>Nhân viên</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(val) => field.onChange(val === 'true')} defaultValue={field.value ? 'true' : 'false'} disabled={editingUser?.role === "SUPER_ADMIN"}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Khóa tài khoản</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="border-t p-6">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="rounded-xl w-full">
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl w-full">
                {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
                Lưu
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
