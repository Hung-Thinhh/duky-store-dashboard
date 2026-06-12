import { Inter, Geist_Mono, Montserrat, Playfair_Display } from "next/font/google"
import Script from "next/script";
import type { Metadata } from "next"

import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Bảng điều khiển Duky Store",
  description:
    "Bảng điều khiển quản trị Duky Store: đơn hàng, sản phẩm, khách hàng và báo cáo.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        montserrat.variable,
        playfair.variable,
      )}
    >
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
