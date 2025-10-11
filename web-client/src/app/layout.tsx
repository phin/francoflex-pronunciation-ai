import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
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
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }>
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
