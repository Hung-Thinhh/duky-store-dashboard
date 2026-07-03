"use client"

import * as React from "react"
import { IconCopy, IconDownload, IconLoader2, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { seoService } from "@/lib/api/services/seo.service"

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = React.useState("")
  const [robots, setRobots] = React.useState("")
  const [robotsDraft, setRobotsDraft] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchFiles = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const [sitemapXml, robotsTxt] = await Promise.all([
        seoService.generateSitemap(),
        seoService.getRobotsTxt(),
      ])
      const nextSitemap = String(sitemapXml)
      const nextRobots = String(robotsTxt)
      setSitemap(nextSitemap)
      setRobots(nextRobots)
      setRobotsDraft(window.localStorage.getItem("duky-robots-draft") || nextRobots)
    } catch (error) {
      console.error("Failed to fetch sitemap", error)
      setSitemap("")
      setRobots("")
      setRobotsDraft(window.localStorage.getItem("duky-robots-draft") || "")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const saveRobotsDraft = () => {
    window.localStorage.setItem("duky-robots-draft", robotsDraft)
    alert("Đã lưu draft robots.txt trên dashboard. Cần backend endpoint để publish trực tiếp.")
  }

  const copyText = async (content: string) => {
    await navigator.clipboard.writeText(content)
    alert("Đã sao chép nội dung.")
  }

  return (
    <div className="mx-auto flex max-w-8xl w-full min-w-0 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sitemap & robots</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem sitemap.xml, robots.txt, refresh dữ liệu và chuẩn bị draft robots để publish khi backend hỗ trợ.
          </p>
        </div>
        <Button onClick={fetchFiles} disabled={isLoading} className="rounded-xl">
          {isLoading ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : <IconRefresh className="mr-2 size-4" />}
          Tải lại
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>sitemap.xml</CardTitle>
                <CardDescription>Nội dung render từ endpoint hiện tại.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => copyText(sitemap)} className="rounded-lg">
                  <IconCopy className="mr-2 size-4" />
                  Sao chép
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText("sitemap.xml", sitemap)}
                  className="rounded-lg"
                >
                  <IconDownload className="mr-2 size-4" />
                  Tải
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[640px] overflow-auto rounded-xl border bg-muted/30 p-5 text-xs">
              {isLoading ? "Đang tải..." : sitemap || "Không có dữ liệu"}
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>robots.txt hiện tại</CardTitle>
                <CardDescription>Nội dung đang được API/public route trả về.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => copyText(robots)} className="rounded-lg">
                  <IconCopy className="mr-2 size-4" />
                  Sao chép
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText("robots.txt", robots)}
                  className="rounded-lg"
                >
                  <IconDownload className="mr-2 size-4" />
                  Tải
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[260px] overflow-auto rounded-xl border bg-muted/30 p-5 text-xs">
              {isLoading ? "Đang tải..." : robots || "Không có dữ liệu"}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Bản nháp chỉnh sửa robots.txt</CardTitle>
          <CardDescription>
            Có thể sửa, lưu draft local và tải file. Backend hiện chưa có endpoint update robots.txt trực tiếp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={robotsDraft}
            onChange={(event) => setRobotsDraft(event.target.value)}
            className="min-h-[260px] rounded-xl font-mono text-xs"
            placeholder="User-agent: *"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveRobotsDraft} className="rounded-xl">
              Lưu draft robots
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadText("robots-draft.txt", robotsDraft)}
              className="rounded-xl"
            >
              <IconDownload className="mr-2 size-4" />
              Tải draft
            </Button>
            <Button type="button" variant="outline" onClick={() => copyText(robotsDraft)} className="rounded-xl">
              <IconCopy className="mr-2 size-4" />
              Sao chép draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
