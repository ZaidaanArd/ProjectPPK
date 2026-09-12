import "./globals.css"

import type { Metadata } from "next"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { site, siteUrl } from "@/lib/site"

const robotoHeading = localFont({
  src: "./fonts/roboto.woff2",
  weight: "700",
  display: "swap",
  variable: "--font-heading",
})

const inter = localFont({
  src: "./fonts/inter.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Sthana Kampus — Reservasi Fasilitas Kampus",
    template: "%s | Sthana Kampus",
  },
  description: site.description,
  authors: [{ name: site.creator.name, url: site.creator.url }],
  creator: site.creator.name,
  robots: { index: Boolean(siteUrl), follow: Boolean(siteUrl) },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.name,
    title: site.name,
    description: site.description,
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    ...(siteUrl ? { images: [`${siteUrl}/opengraph-image`] } : {}),
  },
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
