import "./globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "RuangKampus — Scaffold",
  description: "Scaffold awal project PPK RuangKampus.",
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans text-foreground`}
      >
        {children}
      </body>
    </html>
  )
}
