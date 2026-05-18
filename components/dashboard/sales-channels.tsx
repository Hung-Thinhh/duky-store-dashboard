import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { salesChannels } from "@/lib/mock-data"

export function SalesChannels() {
  const totalRevenue = salesChannels.reduce((sum, ch) => sum + ch.revenue, 0)

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Kênh bán hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col gap-4">
          {salesChannels.map((channel) => (
            <div key={channel.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: channel.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {channel.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(channel.revenue)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {channel.percentage}%
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(channel.revenue / totalRevenue) * 100}%`,
                    backgroundColor: channel.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
