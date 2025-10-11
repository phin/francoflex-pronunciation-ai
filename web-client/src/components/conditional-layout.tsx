"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { TopNav } from "@/components/top-nav"

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

  useEffect(() => {
    if (!loading && !user && pathname !== "/") {
      router.push("/")
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
  
  if (pathname === "/") {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24">
        {children}
      </main>
    </div>
  )
}
