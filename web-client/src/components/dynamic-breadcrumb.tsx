"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Define breadcrumb mappings
  const breadcrumbMap: Record<string, string> = {
    "/": "Home",
    "/new_conversation": "New Conversation",
    "/voice_chat_activity": "Activity",
  }
  
  // Generate breadcrumb items based on pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [
      { href: "/", label: "Francoflex" }
    ]
    
    let currentPath = ""
    segments.forEach((segment) => {
      currentPath += `/${segment}`
      const label = breadcrumbMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ href: currentPath, label })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  // Special handling for voice_chat_activity to show chat/activity
  if (pathname === "/voice_chat_activity") {
    breadcrumbs[breadcrumbs.length - 2] = { href: "/new_conversation", label: "Chat" }
    breadcrumbs[breadcrumbs.length - 1] = { href: "/voice_chat_activity", label: "Activity" }
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={breadcrumb.href}>
                {breadcrumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
