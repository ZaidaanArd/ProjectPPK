import "./globals.css"

import type { Metadata } from "next"
import { Inter, Roboto } from "next/font/google"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const robotoHeading = Roboto({ subsets: ["latin"], variable: "--font-heading" })

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "RuangKampus — Scaffold",
  description: "Scaffold awal project PPK RuangKampus.",
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={cn(robotoHeading.variable)}>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans text-foreground`}
      >
        {children}
      </body>
    </html>
  )
}
