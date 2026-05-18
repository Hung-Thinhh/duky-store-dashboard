"use client"

import * as React from "react"
import {
  IconAlertCircle,
  IconBell,
  IconCheck,
  IconDeviceFloppy,
  IconLoader2,
  IconMail,
  IconPlus,
  IconSend,
  IconShoppingBag,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { marketingService } from "@/lib/api/services/marketing.service"
import { EmailLog, NotificationTemplate } from "@/lib/api/schemas/marketing.schema"

type NotificationType = "ORDER" | "INVENTORY" | "CUSTOMER" | "SYSTEM"

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

const mockNotifications: Notification[] = [
  {
    id: "notif_1",
    type: "ORDER",
    title: "Đơn hàng mới",
    message: "Đơn hàng ORD-7291 vừa được đặt thành công (1,490,000đ).",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    link: "/orders?id=ORD-7291",
  },
  {
    id: "notif_2",
    type: "INVENTORY",
    title: "Cảnh báo tồn kho",
    message: "Sản phẩm Boot Da Bò Đế Cao Su sắp hết hàng.",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    link: "/inventory",
  },
  {
    id: "notif_3",
    type: "CUSTOMER",
    title: "Khách hàng mới",
    message: "Nguyễn Văn An vừa đăng ký tài khoản.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    link: "/customers",
  },
]

const mockTemplates: NotificationTemplate[] = [
  {
    id: "tpl_1",
    key: "order_confirmed",
    name: "Xác nhận đơn hàng",
    channel: "EMAIL",
    subject: "Duky đã nhận đơn {{orderCode}}",
    body: "Xin chào {{customerName}}, đơn {{orderCode}} của bạn đã được xác nhận.",
    isActive: true,
  },
  {
    id: "tpl_2",
    key: "shipping_update",
    name: "Cập nhật vận chuyển",
    channel: "EMAIL",
    subject: "Đơn {{orderCode}} đang được giao",
    body: "Mã vận đơn: {{trackingNumber}}.",
    isActive: true,
  },
]

const mockLogs: EmailLog[] = [
  {
    id: "log_1",
    to: "customer@example.com",
    subject: "Duky đã nhận đơn ORD-7291",
    status: "SENT",
    templateKey: "order_confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "log_2",
    to: "test@example.com",
    subject: "Email kiểm thử",
    status: "FAILED",
    templateKey: "order_confirmed",
    error: "SMTP credentials missing",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

const emptyTemplate = (): Omit<NotificationTemplate, "id"> => ({
  key: "",
  name: "",
  channel: "EMAIL",
  subject: "",
  body: "",
  isActive: true,
})

const channelLabel: Record<NotificationTemplate["channel"], string> = {
  EMAIL: "Email",
  SMS: "SMS",
  IN_APP: "Trong app",
}

const emailStatusLabel: Record<EmailLog["status"], string> = {
  QUEUED: "Đang chờ",
  SENT: "Đã gửi",
  FAILED: "Thất bại",
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "ORDER":
      return <IconShoppingBag className="size-5 text-blue-600" />
    case "INVENTORY":
      return <IconAlertCircle className="size-5 text-rose-600" />
    case "CUSTOMER":
      return <IconUserPlus className="size-5 text-emerald-600" />
    default:
      return <IconBell className="size-5 text-slate-600" />
  }
}

const getBgColor = (type: NotificationType) => {
  switch (type) {
    case "ORDER":
      return "bg-blue-100"
    case "INVENTORY":
      return "bg-rose-100"
    case "CUSTOMER":
      return "bg-emerald-100"
    default:
      return "bg-slate-100"
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications)
  const [templates, setTemplates] = React.useState<NotificationTemplate[]>(mockTemplates)
  const [logs, setLogs] = React.useState<EmailLog[]>(mockLogs)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false)
  const [templateForm, setTemplateForm] = React.useState(emptyTemplate)
  const [testEmail, setTestEmail] = React.useState("admin@duky.store")
  const [selectedTemplateKey, setSelectedTemplateKey] = React.useState("order_confirmed")
  const [testPayload, setTestPayload] = React.useState('{"customerName":"Duky Fan","orderCode":"ORD-TEST"}')

  const fetchNotificationTools = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const [templateData, logData] = await Promise.all([
        marketingService.getNotificationTemplates({ limit: 100 }),
        marketingService.getEmailLogs({ limit: 100 }),
      ])
      setTemplates(templateData.data)
      setLogs(logData.data)
    } catch (error) {
      console.warn("Notification template/log APIs are not ready, using mock data", error)
      setTemplates(mockTemplates)
      setLogs(mockLogs)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotificationTools()
  }, [fetchNotificationTools])

  const unreadCount = notifications.filter((item) => !item.isRead).length

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)))
  }

  const deleteNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setNotifications((current) => current.filter((item) => item.id !== id))
  }

  const saveTemplate = async () => {
    if (!templateForm.key || !templateForm.name || !templateForm.body) {
      alert("Nhập key, tên và body template.")
      return
    }

    try {
      setIsSaving(true)
      const created = await marketingService.createNotificationTemplate(templateForm)
      setTemplates((current) => [created, ...current])
    } catch (error) {
      console.warn("Saving template locally because API is not ready", error)
      setTemplates((current) => [{ ...templateForm, id: `local_${Date.now()}` }, ...current])
    } finally {
      setIsSaving(false)
      setTemplateDialogOpen(false)
      setTemplateForm(emptyTemplate())
    }
  }

  const toggleTemplate = async (template: NotificationTemplate) => {
    const next = { ...template, isActive: !template.isActive }
    setTemplates((current) => current.map((item) => (item.id === template.id ? next : item)))
    try {
      await marketingService.updateNotificationTemplate(template.id, { isActive: next.isActive })
    } catch (error) {
      console.warn("Template status changed locally", error)
    }
  }

  const sendTestEmail = async () => {
    try {
      setIsSaving(true)
      const payload = testPayload.trim() ? JSON.parse(testPayload) : {}
      await marketingService.sendTestEmail({ to: testEmail, templateKey: selectedTemplateKey, payload })
      setLogs((current) => [
        {
          id: `local_${Date.now()}`,
          to: testEmail,
          subject: `Kiểm thử ${selectedTemplateKey}`,
          status: "SENT",
          templateKey: selectedTemplateKey,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ])
      alert("Đã gửi email test.")
    } catch (error) {
      console.warn("Test email failed or API is not ready", error)
      setLogs((current) => [
        {
          id: `local_${Date.now()}`,
          to: testEmail,
          subject: `Kiểm thử ${selectedTemplateKey}`,
          status: "FAILED",
          templateKey: selectedTemplateKey,
          error: "API chưa sẵn sàng hoặc payload JSON chưa hợp lệ.",
          createdAt: new Date().toISOString(),
        },
        ...current,
      ])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Thông báo & Email</h1>
          {unreadCount > 0 ? (
            <Badge variant="default" className="rounded-full bg-primary px-2.5">
              {unreadCount} mới
            </Badge>
          ) : null}
        </div>
        <Button variant="outline" className="rounded-xl" onClick={fetchNotificationTools} disabled={isLoading}>
          {isLoading ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
          Tải lại
        </Button>
      </div>

      <Tabs defaultValue="inbox" className="gap-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="inbox">Hộp thông báo</TabsTrigger>
          <TabsTrigger value="templates">Mẫu thông báo</TabsTrigger>
          <TabsTrigger value="email-test">Gửi thử email</TabsTrigger>
          <TabsTrigger value="logs">Nhật ký</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" className="rounded-xl" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <IconCheck className="mr-2 size-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
          {notifications.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              Bạn không có thông báo nào.
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                  notification.isRead ? "border-border bg-card hover:bg-muted/50" : "border-primary/20 bg-primary/5"
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`mt-1 shrink-0 rounded-full p-2 ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`truncate font-semibold ${notification.isRead ? "text-foreground" : "text-primary"}`}>
                      {notification.title}
                    </h3>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={(event) => deleteNotification(notification.id, event)}
                  title="Xóa thông báo"
                >
                  <IconTrash className="size-4" />
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Quản lý mẫu thông báo</CardTitle>
                <CardDescription>Quản lý mẫu email/SMS/thông báo trong app bằng biến như {"{{customerName}}"}.</CardDescription>
              </div>
              <Button onClick={() => setTemplateDialogOpen(true)} className="rounded-xl">
                <IconPlus className="mr-2 size-4" />
                Thêm mẫu
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{template.name}</p>
                        <Badge variant="outline" className="font-mono">{template.key}</Badge>
                        <Badge>{channelLabel[template.channel]}</Badge>
                        <Badge className={template.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                          {template.isActive ? "Đang bật" : "Tạm dừng"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium">{template.subject}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{template.body}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleTemplate(template)} className="rounded-lg">
                      {template.isActive ? "Tạm dừng" : "Bật"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-test">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Gửi thử email</CardTitle>
              <CardDescription>Gửi thử mẫu với payload JSON để kiểm tra tiêu đề, nội dung và SMTP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email nhận test</Label>
                  <Input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Mẫu</Label>
                  <Select value={selectedTemplateKey} onValueChange={setSelectedTemplateKey}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dữ liệu JSON</Label>
                <Textarea value={testPayload} onChange={(event) => setTestPayload(event.target.value)} className="min-h-[180px] rounded-xl font-mono text-xs" />
              </div>
              <Button onClick={sendTestEmail} disabled={isSaving} className="rounded-xl">
                <IconSend className="mr-2 size-4" />
                Gửi email test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Nhật ký email</CardTitle>
              <CardDescription>Theo dõi email đang chờ/đã gửi/thất bại và lỗi SMTP hoặc lỗi mẫu.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người nhận</TableHead>
                    <TableHead>Mẫu</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "N/A"}</TableCell>
                      <TableCell>{log.to}</TableCell>
                      <TableCell className="font-mono text-xs">{log.templateKey || "Tùy chỉnh"}</TableCell>
                      <TableCell>{log.subject}</TableCell>
                      <TableCell>
                        <Badge className={log.status === "SENT" ? "bg-emerald-100 text-emerald-700" : log.status === "FAILED" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}>
                          {emailStatusLabel[log.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-destructive">{log.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm mẫu thông báo</DialogTitle>
            <DialogDescription>Tạo mẫu để dùng cho email tự động, SMS hoặc thông báo trong app.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mã mẫu</Label>
                <Input value={templateForm.key} onChange={(event) => setTemplateForm((form) => ({ ...form, key: event.target.value }))} className="rounded-xl font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Tên</Label>
                <Input value={templateForm.name} onChange={(event) => setTemplateForm((form) => ({ ...form, name: event.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kênh gửi</Label>
              <Select value={templateForm.channel} onValueChange={(value) => setTemplateForm((form) => ({ ...form, channel: value as NotificationTemplate["channel"] }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="IN_APP">Trong app</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={templateForm.subject || ""} onChange={(event) => setTemplateForm((form) => ({ ...form, subject: event.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea value={templateForm.body} onChange={(event) => setTemplateForm((form) => ({ ...form, body: event.target.value }))} className="min-h-[180px] rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button onClick={saveTemplate} disabled={isSaving} className="rounded-xl">
              <IconDeviceFloppy className="mr-2 size-4" />
              Lưu mẫu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
