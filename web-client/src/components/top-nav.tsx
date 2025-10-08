"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Repeat Mode", href: "/voice_chat_activity" },
  { label: "Conversational Mode", href: "/voice_chat_conversational" },
  { label: "Preferences", href: "/preferences" },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error("Failed to sign out")
      return
    }
    toast.success("Signed out successfully")
    router.push("/")
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Francoflex</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.email}
              </span>
              <Button variant="neutral" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="neutral" size="sm" asChild>
              <Link href="/">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
