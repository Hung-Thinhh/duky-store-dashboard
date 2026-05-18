"use client"

import * as React from "react"
import {
  IconCheck,
  IconDeviceFloppy,
  IconHeart,
  IconLoader2,
  IconMessage2,
  IconPlus,
  IconSpeakerphone,
  IconStar,
  IconTicket,
  IconTrash,
  IconX,
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
import { Campaign, Coupon, Review, WishlistMetric } from "@/lib/api/schemas/marketing.schema"

const mockCoupons: Coupon[] = [
  {
    id: "cp_1",
    code: "DUKY10",
    name: "Giảm 10% đơn đầu",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderValue: 500000,
    usageLimit: 300,
    usedCount: 82,
    startAt: "2026-05-01",
    endAt: "2026-06-01",
    isActive: true,
  },
  {
    id: "cp_2",
    code: "SHIP30K",
    name: "Hỗ trợ phí ship",
    discountType: "FIXED",
    discountValue: 30000,
    minOrderValue: 350000,
    usageLimit: 500,
    usedCount: 146,
    startAt: "2026-05-10",
    endAt: "2026-05-31",
    isActive: true,
  },
]

const mockCampaigns: Campaign[] = [
  {
    id: "cam_1",
    name: "Mid May Boots Sale",
    slug: "mid-may-boots-sale",
    discountType: "PERCENT",
    discountValue: 15,
    startAt: "2026-05-13",
    endAt: "2026-05-20",
    productIds: [],
    categoryIds: ["boots"],
    status: "ACTIVE",
  },
]

const mockReviews: Review[] = [
  {
    id: "rv_1",
    productName: "Giày Boot Nữ Cổ Thấp",
    customerName: "Minh Anh",
    rating: 5,
    content: "Da mềm, form đẹp, giao nhanh.",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rv_2",
    productName: "Boot Da Bò Đế Cao Su",
    customerName: "Hoàng Nam",
    rating: 4,
    content: "Sản phẩm ổn, cần thêm size lớn.",
    status: "APPROVED",
    reply: "Duky cảm ơn anh, shop đang bổ sung size mới.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

const mockWishlist: WishlistMetric[] = [
  {
    productId: "prd_1",
    productName: "Giày Boot Nữ Cổ Thấp Jun",
    wishlistCount: 126,
    conversionCount: 18,
    lastAddedAt: new Date().toISOString(),
  },
  {
    productId: "prd_2",
    productName: "Boot Da Bò Đế Cao Su 6cm",
    wishlistCount: 98,
    conversionCount: 9,
    lastAddedAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
const campaignStatusLabel: Record<Campaign["status"], string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  ACTIVE: "Đang chạy",
  ENDED: "Đã kết thúc",
}
const reviewStatusLabel: Record<Review["status"], string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
}

const emptyCoupon = (): Omit<Coupon, "id" | "usedCount"> => ({
  code: "",
  name: "",
  discountType: "PERCENT",
  discountValue: 10,
  minOrderValue: 0,
  usageLimit: 100,
  startAt: new Date().toISOString().slice(0, 10),
  endAt: "",
  isActive: true,
})

const emptyCampaign = (): Omit<Campaign, "id"> => ({
  name: "",
  slug: "",
  discountType: "PERCENT",
  discountValue: 10,
  startAt: new Date().toISOString().slice(0, 10),
  endAt: "",
  productIds: [],
  categoryIds: [],
  status: "DRAFT",
})

export default function MarketingPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([])
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [wishlist, setWishlist] = React.useState<WishlistMetric[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [couponDialogOpen, setCouponDialogOpen] = React.useState(false)
  const [campaignDialogOpen, setCampaignDialogOpen] = React.useState(false)
  const [couponForm, setCouponForm] = React.useState(emptyCoupon)
  const [campaignForm, setCampaignForm] = React.useState(emptyCampaign)
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>({})

  const fetchGrowthData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [couponData, campaignData, reviewData, wishlistData] = await Promise.all([
        marketingService.getCoupons({ limit: 100 }),
        marketingService.getCampaigns({ limit: 100 }),
        marketingService.getReviews({ limit: 100 }),
        marketingService.getWishlistMetrics({ limit: 100 }),
      ])
      setCoupons(couponData.data)
      setCampaigns(campaignData.data)
      setReviews(reviewData.data)
      setWishlist(wishlistData.data)
    } catch (error) {
      console.warn("Marketing APIs are not ready, using mock data", error)
      setCoupons(mockCoupons)
      setCampaigns(mockCampaigns)
      setReviews(mockReviews)
      setWishlist(mockWishlist)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchGrowthData()
  }, [fetchGrowthData])

  const saveCoupon = async () => {
    if (!couponForm.code.trim()) {
      alert("Nhập mã coupon trước.")
      return
    }

    try {
      setIsSaving(true)
      const created = await marketingService.createCoupon({
        ...couponForm,
        code: couponForm.code.trim().toUpperCase(),
        discountValue: Number(couponForm.discountValue) || 0,
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        usageLimit: Number(couponForm.usageLimit) || 0,
      })
      setCoupons((current) => [created, ...current])
    } catch (error) {
      console.warn("Saving coupon locally because API is not ready", error)
      setCoupons((current) => [
        {
          ...couponForm,
          id: `local_${Date.now()}`,
          code: couponForm.code.trim().toUpperCase(),
          discountValue: Number(couponForm.discountValue) || 0,
          minOrderValue: Number(couponForm.minOrderValue) || 0,
          usageLimit: Number(couponForm.usageLimit) || 0,
          usedCount: 0,
        },
        ...current,
      ])
    } finally {
      setIsSaving(false)
      setCouponDialogOpen(false)
      setCouponForm(emptyCoupon())
    }
  }

  const saveCampaign = async () => {
    if (!campaignForm.name.trim()) {
      alert("Nhập tên campaign trước.")
      return
    }

    const payload = {
      ...campaignForm,
      slug: campaignForm.slug || campaignForm.name.toLowerCase().replace(/\s+/g, "-"),
      discountValue: Number(campaignForm.discountValue) || 0,
      productIds: campaignForm.productIds,
      categoryIds: campaignForm.categoryIds,
    }

    try {
      setIsSaving(true)
      const created = await marketingService.createCampaign(payload)
      setCampaigns((current) => [created, ...current])
    } catch (error) {
      console.warn("Saving campaign locally because API is not ready", error)
      setCampaigns((current) => [{ ...payload, id: `local_${Date.now()}` }, ...current])
    } finally {
      setIsSaving(false)
      setCampaignDialogOpen(false)
      setCampaignForm(emptyCampaign())
    }
  }

  const toggleCoupon = async (coupon: Coupon) => {
    const next = { ...coupon, isActive: !coupon.isActive }
    setCoupons((current) => current.map((item) => (item.id === coupon.id ? next : item)))
    try {
      await marketingService.updateCoupon(coupon.id, { isActive: next.isActive })
    } catch (error) {
      console.warn("Coupon status changed locally", error)
    }
  }

  const deleteCoupon = async (coupon: Coupon) => {
    setCoupons((current) => current.filter((item) => item.id !== coupon.id))
    try {
      await marketingService.deleteCoupon(coupon.id)
    } catch (error) {
      console.warn("Coupon deleted locally", error)
    }
  }

  const updateReview = async (review: Review, status: Review["status"], reply?: string) => {
    setReviews((current) =>
      current.map((item) => (item.id === review.id ? { ...item, status, reply: reply ?? item.reply } : item))
    )
    try {
      await marketingService.updateReview(review.id, { status, reply })
    } catch (error) {
      console.warn("Review moderation changed locally", error)
    }
  }

  const activeCoupons = coupons.filter((coupon) => coupon.isActive).length
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "ACTIVE").length
  const pendingReviews = reviews.filter((review) => review.status === "PENDING").length
  const totalWishlist = wishlist.reduce((sum, item) => sum + item.wishlistCount, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ti?p th? & t?ng tr??ng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            M? gi?m gi?, ch??ng tr?nh sale, duy?t ??nh gi? v? ph?n t?ch wishlist trong m?t lu?ng v?n h?nh.
          </p>
        </div>
        <Button variant="outline" onClick={fetchGrowthData} disabled={isLoading} className="rounded-xl">
          {isLoading ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
          Tải lại
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>Mã giảm giá đang bật</CardDescription>
            <CardTitle className="text-3xl">{activeCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>Campaign đang chạy</CardDescription>
            <CardTitle className="text-3xl">{activeCampaigns}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>Review chờ duyệt</CardDescription>
            <CardTitle className="text-3xl">{pendingReviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardDescription>Lượt wishlist</CardDescription>
            <CardTitle className="text-3xl">{totalWishlist}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="coupons" className="gap-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="coupons">
            <IconTicket className="size-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <IconSpeakerphone className="size-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <IconStar className="size-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            <IconHeart className="size-4" />
            Wishlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Quản lý mã giảm giá</CardTitle>
                <CardDescription>Hỗ trợ giảm theo số tiền/phần trăm, giới hạn lượt dùng, thời gian chạy và giá trị đơn tối thiểu.</CardDescription>
              </div>
              <Button onClick={() => setCouponDialogOpen(true)} className="rounded-xl">
                <IconPlus className="mr-2 size-4" />
                Thêm coupon
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Giảm giá</TableHead>
                    <TableHead>Đơn tối thiểu</TableHead>
                    <TableHead>Đã dùng</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <p className="font-mono font-semibold">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">{coupon.name}</p>
                      </TableCell>
                      <TableCell>
                        {coupon.discountType === "PERCENT"
                          ? `${coupon.discountValue}%`
                          : money.format(coupon.discountValue)}
                      </TableCell>
                      <TableCell>{money.format(coupon.minOrderValue || 0)}</TableCell>
                      <TableCell>
                        {coupon.usedCount}/{coupon.usageLimit || "∞"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {coupon.startAt || "now"} → {coupon.endAt || "no end"}
                      </TableCell>
                      <TableCell>
                        <Badge className={coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                          {coupon.isActive ? "Đang bật" : "Tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleCoupon(coupon)} className="rounded-lg">
                          {coupon.isActive ? "Tạm dừng" : "Bật"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCoupon(coupon)} className="rounded-lg text-destructive">
                          <IconTrash className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Chương trình sale</CardTitle>
                <CardDescription>Lập sale theo sản phẩm/danh mục, lịch bắt đầu/kết thúc và trạng thái chạy.</CardDescription>
              </div>
              <Button onClick={() => setCampaignDialogOpen(true)} className="rounded-xl">
                <IconPlus className="mr-2 size-4" />
                Thêm campaign
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="rounded-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription className="font-mono">/{campaign.slug}</CardDescription>
                      </div>
                      <Badge variant="outline">{campaignStatusLabel[campaign.status]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ưu đãi</span>
                      <span className="font-medium">
                        {campaign.discountType === "PERCENT"
                          ? `${campaign.discountValue}%`
                          : money.format(campaign.discountValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian</span>
                      <span>{campaign.startAt || "now"} → {campaign.endAt || "no end"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phạm vi</span>
                      <span>{campaign.productIds.length} sản phẩm, {campaign.categoryIds.length} danh mục</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Duyệt đánh giá</CardTitle>
              <CardDescription>Duyệt, từ chối và phản hồi review ngay trong dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.productName}</p>
                        <Badge variant="outline">{review.rating} sao</Badge>
                        <Badge className={review.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : review.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>
                          {reviewStatusLabel[review.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{review.customerName}</p>
                      <p className="mt-3 text-sm">{review.content}</p>
                      {review.reply ? <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Phản hồi: {review.reply}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateReview(review, "APPROVED")} className="rounded-lg">
                        <IconCheck className="mr-2 size-4" />
                        Duyệt
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateReview(review, "REJECTED")} className="rounded-lg">
                        <IconX className="mr-2 size-4" />
                        Từ chối
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Input
                      value={replyDrafts[review.id] ?? review.reply ?? ""}
                      onChange={(event) => setReplyDrafts((drafts) => ({ ...drafts, [review.id]: event.target.value }))}
                      placeholder="Nhập phản hồi cho khách..."
                      className="rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={() => updateReview(review, review.status, replyDrafts[review.id] ?? review.reply ?? "")}
                      className="rounded-xl"
                    >
                      <IconMessage2 className="mr-2 size-4" />
                      Lưu reply
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Phân tích wishlist</CardTitle>
              <CardDescription>Nhìn sản phẩm được lưu nhiều, tỷ lệ chuyển đổi và thời điểm có nhu cầu mới.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Lượt wishlist</TableHead>
                    <TableHead>Đã mua sau wishlist</TableHead>
                    <TableHead>Tỷ lệ</TableHead>
                    <TableHead>Lần lưu gần nhất</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wishlist.map((item) => {
                    const rate = item.wishlistCount ? Math.round((item.conversionCount / item.wishlistCount) * 100) : 0
                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.wishlistCount}</TableCell>
                        <TableCell>{item.conversionCount}</TableCell>
                        <TableCell>{rate}%</TableCell>
                        <TableCell>{item.lastAddedAt ? new Date(item.lastAddedAt).toLocaleString("vi-VN") : "N/A"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm coupon</DialogTitle>
            <DialogDescription>Thiết lập mã giảm giá theo số tiền/phần trăm, giới hạn lượt dùng, đơn tối thiểu và thời gian.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mã coupon</Label>
                <Input value={couponForm.code} onChange={(event) => setCouponForm((form) => ({ ...form, code: event.target.value }))} className="rounded-xl font-mono uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Tên</Label>
                <Input value={couponForm.name || ""} onChange={(event) => setCouponForm((form) => ({ ...form, name: event.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select value={couponForm.discountType} onValueChange={(value) => setCouponForm((form) => ({ ...form, discountType: value as Coupon["discountType"] }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PERCENT">Phần trăm</SelectItem><SelectItem value="FIXED">Số tiền cố định</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị</Label>
                <Input type="number" value={couponForm.discountValue} onChange={(event) => setCouponForm((form) => ({ ...form, discountValue: Number(event.target.value) }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn lượt dùng</Label>
                <Input type="number" value={couponForm.usageLimit || 0} onChange={(event) => setCouponForm((form) => ({ ...form, usageLimit: Number(event.target.value) }))} className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Đơn tối thiểu</Label>
                <Input type="number" value={couponForm.minOrderValue || 0} onChange={(event) => setCouponForm((form) => ({ ...form, minOrderValue: Number(event.target.value) }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Bắt đầu</Label>
                <Input type="date" value={couponForm.startAt || ""} onChange={(event) => setCouponForm((form) => ({ ...form, startAt: event.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc</Label>
                <Input type="date" value={couponForm.endAt || ""} onChange={(event) => setCouponForm((form) => ({ ...form, endAt: event.target.value }))} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={saveCoupon} disabled={isSaving} className="rounded-xl">
              <IconDeviceFloppy className="mr-2 size-4" />
              Lưu coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm campaign</DialogTitle>
            <DialogDescription>Tạo chương trình sale theo lịch và phạm vi sản phẩm/danh mục.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Tên campaign</Label>
              <Input value={campaignForm.name} onChange={(event) => setCampaignForm((form) => ({ ...form, name: event.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={campaignForm.slug || ""} onChange={(event) => setCampaignForm((form) => ({ ...form, slug: event.target.value }))} className="rounded-xl font-mono text-sm" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select value={campaignForm.discountType} onValueChange={(value) => setCampaignForm((form) => ({ ...form, discountType: value as Campaign["discountType"] }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PERCENT">Phần trăm</SelectItem><SelectItem value="FIXED">Số tiền cố định</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị</Label>
                <Input type="number" value={campaignForm.discountValue} onChange={(event) => setCampaignForm((form) => ({ ...form, discountValue: Number(event.target.value) }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={campaignForm.status} onValueChange={(value) => setCampaignForm((form) => ({ ...form, status: value as Campaign["status"] }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                    <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                    <SelectItem value="ACTIVE">Đang chạy</SelectItem>
                    <SelectItem value="ENDED">Đã kết thúc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Bắt đầu</Label>
                <Input type="date" value={campaignForm.startAt || ""} onChange={(event) => setCampaignForm((form) => ({ ...form, startAt: event.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc</Label>
                <Input type="date" value={campaignForm.endAt || ""} onChange={(event) => setCampaignForm((form) => ({ ...form, endAt: event.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID sản phẩm</Label>
              <Textarea value={campaignForm.productIds.join("\n")} onChange={(event) => setCampaignForm((form) => ({ ...form, productIds: event.target.value.split(/\s+/).filter(Boolean) }))} className="rounded-xl font-mono text-xs" placeholder="Mỗi dòng một ID sản phẩm" />
            </div>
            <div className="space-y-2">
              <Label>ID danh mục</Label>
              <Textarea value={campaignForm.categoryIds.join("\n")} onChange={(event) => setCampaignForm((form) => ({ ...form, categoryIds: event.target.value.split(/\s+/).filter(Boolean) }))} className="rounded-xl font-mono text-xs" placeholder="Mỗi dòng một ID danh mục" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={saveCampaign} disabled={isSaving} className="rounded-xl">
              <IconDeviceFloppy className="mr-2 size-4" />
              Lưu campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
