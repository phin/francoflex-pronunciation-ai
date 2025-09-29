import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "./sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ConditionalLayout } from "@/components/conditional-layout"
import { AuthProvider } from "@/contexts/AuthContext"

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Francoflex - Professional French Pronunciation Practice",
  description: "Learn professional French pronunciation for your industry with AI-powered feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.variable} font-sans bg-background`}>
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}