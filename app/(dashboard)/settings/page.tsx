"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconLoader2,
  IconDeviceFloppy,
  IconBuildingStore,
  IconPalette,
  IconSearch,
  IconShare,
  IconCreditCard,
  IconPhoto
} from "@tabler/icons-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { settingsService } from "@/lib/api/services/settings.service"
import { StoreSettings, StoreSettingsSchema } from "@/lib/api/schemas/settings.schema"

const mockSettings: StoreSettings = {
  general: {
    storeName: "Duky Store",
    storeDescription: "Thương hiệu đồ da cao cấp",
    supportEmail: "support@dukystore.vn",
    supportPhone: "19001234",
    address: "123 Lê Lợi, Q.1, TP.HCM",
    currency: "VND"
  },
  branding: {
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#0f172a"
  },
  seo: {
    defaultMetaTitle: "Duky Store - Đồ da nam nữ cao cấp",
    defaultMetaDescription: "Mua sắm giày dép, túi xách, phụ kiện da thật tại Duky Store.",
    defaultOgImageUrl: ""
  },
  social: {
    facebookUrl: "https://facebook.com/dukystore",
    instagramUrl: "https://instagram.com/dukystore",
    tiktokUrl: "https://tiktok.com/@dukystore"
  },
  payment: {
    bankName: "Vietcombank",
    accountNumber: "0123456789",
    accountName: "CÔNG TY TNHH DUKY"
  }
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [mediaTarget, setMediaTarget] = React.useState<"logo" | "favicon" | "og">("logo")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<StoreSettings>({
    resolver: zodResolver(StoreSettingsSchema),
    defaultValues: mockSettings,
  })

  const settingsPreview = watch()

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const data = await settingsService.getSettings()
        reset(data)
      } catch (error) {
        console.error("Failed to fetch settings", error)
        reset(mockSettings)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [reset])

  const onSubmit = async (data: StoreSettings) => {
    try {
      setIsSaving(true)
      await settingsService.updateSettings(data)
      reset(data)
    } catch (error) {
      console.error("Failed to save settings", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <IconLoader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6 max-w-5xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4 pt-2 -mt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin chung, thương hiệu và cấu hình cửa hàng.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving || !isDirty} className="rounded-xl">
            {isSaving ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 size-4" />}
            Lưu cài đặt
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="h-12 w-full md:w-auto bg-muted/50 rounded-xl p-1 grid grid-cols-5 md:flex md:justify-start">
          <TabsTrigger value="general" className="rounded-lg gap-2 text-xs md:text-sm"><IconBuildingStore className="size-4 hidden md:block" /> Chung</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-lg gap-2 text-xs md:text-sm"><IconPalette className="size-4 hidden md:block" /> Thương hiệu</TabsTrigger>
          <TabsTrigger value="seo" className="rounded-lg gap-2 text-xs md:text-sm"><IconSearch className="size-4 hidden md:block" /> SEO</TabsTrigger>
          <TabsTrigger value="social" className="rounded-lg gap-2 text-xs md:text-sm"><IconShare className="size-4 hidden md:block" /> Mạng xã hội</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-lg gap-2 text-xs md:text-sm"><IconCreditCard className="size-4 hidden md:block" /> Thanh toán</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin cửa hàng</CardTitle>
                <CardDescription>Thông tin cơ bản hiển thị cho khách hàng.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="general.storeName">Tên cửa hàng *</Label>
                    <Input id="general.storeName" {...register("general.storeName")} className="rounded-xl" />
                    {errors.general?.storeName && <p className="text-xs text-destructive">{errors.general.storeName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="general.currency">Loại tiền tệ</Label>
                    <Input id="general.currency" {...register("general.currency")} className="rounded-xl" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="general.storeDescription">Mô tả ngắn</Label>
                  <Textarea id="general.storeDescription" {...register("general.storeDescription")} className="rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="general.supportEmail">Email hỗ trợ *</Label>
                    <Input id="general.supportEmail" type="email" {...register("general.supportEmail")} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="general.supportPhone">Số điện thoại *</Label>
                    <Input id="general.supportPhone" {...register("general.supportPhone")} className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="general.address">Địa chỉ</Label>
                  <Textarea id="general.address" {...register("general.address")} className="rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Nhận diện thương hiệu</CardTitle>
                <CardDescription>Logo, màu sắc, và biểu tượng.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Logo chính</Label>
                    <div className="rounded-xl border p-4">
                      <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {settingsPreview.branding?.logoUrl ? (
                          <img src={settingsPreview.branding.logoUrl} alt="Logo preview" className="max-h-24 max-w-full object-contain" />
                        ) : (
                          <IconPhoto className="size-8 text-muted-foreground" />
                        )}
                      </div>
                      <Input {...register("branding.logoUrl")} className="mb-2 rounded-xl text-xs" placeholder="Logo URL" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMediaTarget("logo")
                          setIsMediaPickerOpen(true)
                        }}
                        className="w-full rounded-xl"
                      >
                        Chọn từ media
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon (Icon trình duyệt)</Label>
                    <div className="rounded-xl border p-4">
                      <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {settingsPreview.branding?.faviconUrl ? (
                          <img src={settingsPreview.branding.faviconUrl} alt="Favicon preview" className="size-12 object-contain" />
                        ) : (
                          <IconPhoto className="size-8 text-muted-foreground" />
                        )}
                      </div>
                      <Input {...register("branding.faviconUrl")} className="mb-2 rounded-xl text-xs" placeholder="Favicon URL" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMediaTarget("favicon")
                          setIsMediaPickerOpen(true)
                        }}
                        className="w-full rounded-xl"
                      >
                        Chọn từ media
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="branding.primaryColor">Màu chủ đạo (Hex code)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="branding.primaryColor" 
                      type="color" 
                      {...register("branding.primaryColor")} 
                      className="w-12 h-10 p-1 rounded-xl cursor-pointer" 
                    />
                    <Input 
                      {...register("branding.primaryColor")} 
                      className="rounded-xl flex-1 font-mono uppercase" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Cấu hình SEO mặc định</CardTitle>
                <CardDescription>Sẽ được áp dụng nếu các trang cụ thể không khai báo SEO.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo.defaultMetaTitle">Tiêu đề meta mặc định</Label>
                  <Input id="seo.defaultMetaTitle" {...register("seo.defaultMetaTitle")} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo.defaultMetaDescription">Mô tả meta mặc định</Label>
                  <Textarea id="seo.defaultMetaDescription" {...register("seo.defaultMetaDescription")} className="rounded-xl min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo.defaultOgImageUrl">Ảnh OG mặc định</Label>
                  <div className="flex gap-2">
                    <Input id="seo.defaultOgImageUrl" {...register("seo.defaultOgImageUrl")} className="rounded-xl text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMediaTarget("og")
                        setIsMediaPickerOpen(true)
                      }}
                      className="rounded-xl"
                    >
                      Chọn media
                    </Button>
                  </div>
                  {settingsPreview.seo?.defaultOgImageUrl ? (
                    <img
                      src={settingsPreview.seo.defaultOgImageUrl}
                      alt="OG preview"
                      className="aspect-video max-w-sm rounded-xl border object-cover"
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Mạng xã hội</CardTitle>
                <CardDescription>Đường dẫn đến các trang mạng xã hội của cửa hàng.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="social.facebookUrl">Link Facebook</Label>
                  <Input id="social.facebookUrl" {...register("social.facebookUrl")} className="rounded-xl" placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social.instagramUrl">Link Instagram</Label>
                  <Input id="social.instagramUrl" {...register("social.instagramUrl")} className="rounded-xl" placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social.tiktokUrl">Link TikTok</Label>
                  <Input id="social.tiktokUrl" {...register("social.tiktokUrl")} className="rounded-xl" placeholder="https://tiktok.com/@..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin ngân hàng</CardTitle>
                <CardDescription>Hiển thị cho khách hàng chuyển khoản khi thanh toán.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment.bankName">Tên Ngân hàng</Label>
                  <Input id="payment.bankName" {...register("payment.bankName")} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment.accountNumber">Số Tài khoản</Label>
                  <Input id="payment.accountNumber" {...register("payment.accountNumber")} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment.accountName">Tên Chủ Tài khoản</Label>
                  <Input id="payment.accountName" {...register("payment.accountName")} className="rounded-xl uppercase" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </form>
    <MediaPickerDialog
      open={isMediaPickerOpen}
      onOpenChange={setIsMediaPickerOpen}
      onSelect={(media) => {
        if (mediaTarget === "logo") setValue("branding.logoUrl", media.url, { shouldDirty: true })
        if (mediaTarget === "favicon") setValue("branding.faviconUrl", media.url, { shouldDirty: true })
        if (mediaTarget === "og") setValue("seo.defaultOgImageUrl", media.url, { shouldDirty: true })
      }}
      title="Chọn ảnh cấu hình"
      initialSelectedUrl={
        mediaTarget === "logo"
          ? settingsPreview.branding?.logoUrl || null
          : mediaTarget === "favicon"
          ? settingsPreview.branding?.faviconUrl || null
          : mediaTarget === "og"
          ? settingsPreview.seo?.defaultOgImageUrl || null
          : null
      }
    />
    </>
  )
}
