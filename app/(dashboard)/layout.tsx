import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex min-h-svh flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
