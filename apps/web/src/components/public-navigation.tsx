"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const publicNav = [
  { href: "/", label: "Beranda", exact: true },
  { href: "/facilities", label: "Fasilitas", exact: false },
]

export function PublicNavigation() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="hidden items-center gap-1 md:flex"
    >
      {publicNav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
