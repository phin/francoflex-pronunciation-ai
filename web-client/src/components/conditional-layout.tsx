"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppSidebar } from "../app/sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  
  useEffect(() => {
    // Redirect authenticated users away from login page
    if (!loading && user && pathname === "/") {
      router.push('/voice_chat_activity')
    }
  }, [user, loading, pathname, router])
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Don't show sidebar on the root page (login/auth page) or preferences page
  if (pathname === "/" || pathname === "/preferences") {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }
  
  // Show sidebar for all other pages
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <DynamicBreadcrumb />
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
