import "@workspace/ui/globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"

import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "RuangKampus",
    template: "%s · RuangKampus",
  },
  description: "Sistem reservasi dan pelaporan fasilitas kampus.",
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider defaultTheme="light" storageKey="ppk-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
